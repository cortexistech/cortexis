import express from 'express';
import multer from 'multer';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { extname } from 'node:path';
import { db, MEDIA_DIR } from './db.js';
import { writeCaption } from './llm.js';
import { publish, publishFacebook } from './instagram.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET, PUBLIC_BASE_URL } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !SESSION_SECRET) {
  console.error('Defina ADMIN_EMAIL, ADMIN_PASSWORD_HASH e SESSION_SECRET.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const upload = multer({
  storage: multer.diskStorage({
    destination: MEDIA_DIR,
    filename: (_r, f, cb) => cb(null, `${randomBytes(12).toString('hex')}${extname(f.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, /^(video|image)\//.test(f.mimetype))
});

const sign = (v) => createHmac('sha256', SESSION_SECRET).update(v).digest('hex');
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split('; ').filter(Boolean).map((c) => c.split(/=(.*)/s).slice(0, 2)));

function authed(req) {
  const [exp, sig] = (cookies(req).session || '').split('.');
  return exp && sig && Number(exp) > Date.now() && sig === sign(exp);
}
const guard = (req, res, next) => (authed(req) ? next() : req.path.startsWith('/api') ? res.status(401).json({ error: 'auth' }) : res.redirect('/login'));

function checkPassword(pw) {
  const [salt, hash] = ADMIN_PASSWORD_HASH.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

const attempts = new Map();
app.get('/login', (_q, res) => res.sendFile('login.html', { root: 'public' }));
app.post('/login', (req, res) => {
  const n = attempts.get(req.ip) || { c: 0, t: Date.now() };
  if (Date.now() - n.t > 15 * 60e3) { n.c = 0; n.t = Date.now(); }
  if (n.c >= 5) return res.status(429).send('Muitas tentativas. Aguarde 15 minutos.');
  const ok = req.body.email === ADMIN_EMAIL && checkPassword(String(req.body.password || ''));
  if (!ok) { attempts.set(req.ip, { ...n, c: n.c + 1 }); return res.redirect('/login?erro=1'); }
  const exp = String(Date.now() + 7 * 864e5);
  res.setHeader('Set-Cookie', `session=${exp}.${sign(exp)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
  res.redirect('/');
});
app.post('/logout', (_q, res) => {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  res.redirect('/login');
});

// A Meta precisa de aceder aos ficheiros por URL pública.
app.use('/media', express.static(MEDIA_DIR, { index: false, dotfiles: 'deny' }));

app.use(guard);
app.get('/', (_q, res) => res.sendFile('index.html', { root: 'public' }));
app.get('/app.js', (_q, res) => res.sendFile('app.js', { root: 'public' }));

const kindFor = (mime, story) => (mime.startsWith('video') ? (story ? 'story_video' : 'reel') : story ? 'story_image' : 'image');

app.get('/api/posts', (_q, res) => res.json(db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT 100').all()));

app.post('/api/posts', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie um vídeo ou imagem.' });
  const kind = kindFor(req.file.mimetype, req.body.story === 'on');
  const instruction = String(req.body.instruction || '');
  let caption = '', llm = null;
  try {
    ({ text: caption, llm } = await writeCaption(`Tipo: ${kind}. Instrução: ${instruction}`));
  } catch (e) {
    caption = '';
  }
  const r = db.prepare('INSERT INTO posts (kind, media, instruction, caption, llm, facebook) VALUES (?,?,?,?,?,?)')
    .run(kind, req.file.filename, instruction, caption, llm, req.body.facebook === 'on' && !kind.startsWith('story') ? 1 : 0);
  res.json({ id: Number(r.lastInsertRowid) });
});

app.post('/api/posts/:id/caption', (req, res) => {
  db.prepare("UPDATE posts SET caption=? WHERE id=? AND status IN ('draft','scheduled')").run(String(req.body.caption || ''), req.params.id);
  res.json({ ok: true });
});

app.post('/api/posts/:id/regenerate', async (req, res) => {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!p) return res.sendStatus(404);
  try {
    const { text, llm } = await writeCaption(`Tipo: ${p.kind}. Instrução: ${req.body.instruction || p.instruction}`);
    db.prepare('UPDATE posts SET caption=?, llm=? WHERE id=?').run(text, llm, p.id);
    res.json({ caption: text, llm });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

async function run(p) {
  db.prepare("UPDATE posts SET status='publishing', error=NULL WHERE id=?").run(p.id);
  try {
    const igId = await publish({ kind: p.kind, url: `${PUBLIC_BASE_URL}/media/${p.media}`, caption: p.caption });
    db.prepare("UPDATE posts SET status='published', ig_id=? WHERE id=?").run(igId, p.id);
    if (p.facebook) {
      try {
        const fbId = await publishFacebook({ kind: p.kind, url: `${PUBLIC_BASE_URL}/media/${p.media}`, caption: p.caption });
        db.prepare('UPDATE posts SET fb_id=?, fb_error=NULL WHERE id=?').run(fbId, p.id);
      } catch (e) {
        db.prepare('UPDATE posts SET fb_error=? WHERE id=?').run(e.message, p.id);
      }
    }
  } catch (e) {
    db.prepare("UPDATE posts SET status='failed', error=? WHERE id=?").run(e.message, p.id);
  }
}

// Aprovar: publica já, ou agenda se vier uma data.
app.post('/api/posts/:id/approve', (req, res) => {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!p || !['draft', 'failed', 'scheduled'].includes(p.status)) return res.sendStatus(409);
  const when = req.body.scheduled_at ? new Date(req.body.scheduled_at) : null;
  if (when && when > new Date()) {
    db.prepare("UPDATE posts SET status='scheduled', scheduled_at=? WHERE id=?").run(when.toISOString(), p.id);
    return res.json({ status: 'scheduled' });
  }
  run(p);
  res.json({ status: 'publishing' });
});

app.delete('/api/posts/:id', (req, res) => {
  db.prepare("DELETE FROM posts WHERE id=? AND status!='publishing'").run(req.params.id);
  res.json({ ok: true });
});

setInterval(() => {
  const due = db.prepare("SELECT * FROM posts WHERE status='scheduled' AND scheduled_at<=?").all(new Date().toISOString());
  due.forEach(run);
}, 30e3);

app.listen(process.env.PORT || 3000, () => console.log('Painel ativo'));
