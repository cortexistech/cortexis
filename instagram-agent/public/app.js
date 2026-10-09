const $ = (s) => document.querySelector(s);
const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const post = (u, b) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) });
const labels = { draft: 'Rascunho', scheduled: 'Agendado', publishing: 'A publicar', published: 'Publicado', failed: 'Falhou' };

async function load() {
  const posts = await (await fetch('/api/posts')).json();
  $('#l').innerHTML = posts.map((p) => {
    const url = `/media/${p.media}`;
    const media = p.kind.includes('video') || p.kind === 'reel' ? `<video src="${url}" controls></video>` : `<img src="${url}">`;
    const open = ['draft', 'failed', 'scheduled'].includes(p.status);
    return `<div class="p" data-id="${p.id}">${media}<div>
      <div class="t">${p.kind} · ${labels[p.status]}${p.llm ? ' · ' + p.llm : ''}${p.scheduled_at ? ' · ' + new Date(p.scheduled_at).toLocaleString() : ''}</div>
      <textarea ${open ? '' : 'disabled'}>${esc(p.caption)}</textarea>
      ${p.error ? `<div class="t" style="color:#b00">${esc(p.error)}</div>` : ''}
      ${open ? `<div class="row"><input type="datetime-local" class="when"><button data-a="approve">Aprovar</button><button class="s" data-a="regen">Refazer legenda</button><button class="s" data-a="del">Apagar</button></div>` : ''}
    </div></div>`;
  }).join('');
}

$('#f').onsubmit = async (e) => {
  e.preventDefault();
  $('#m').textContent = 'A enviar…';
  const r = await fetch('/api/posts', { method: 'POST', body: new FormData(e.target) });
  $('#m').textContent = r.ok ? '' : 'Erro ao enviar';
  if (r.ok) e.target.reset();
  load();
};

$('#l').onclick = async (e) => {
  const a = e.target.dataset.a;
  if (!a) return;
  const box = e.target.closest('.p');
  const id = box.dataset.id;
  const caption = box.querySelector('textarea').value;
  if (a === 'del') await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  if (a === 'regen') await post(`/api/posts/${id}/regenerate`, { instruction: caption });
  if (a === 'approve') {
    await post(`/api/posts/${id}/caption`, { caption });
    await post(`/api/posts/${id}/approve`, { scheduled_at: box.querySelector('.when').value || null });
  }
  load();
};

load();
setInterval(load, 15000);
