const $ = (s) => document.querySelector(s);
const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const post = (u, b) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) });
const labels = { draft: 'Rascunho', scheduled: 'Agendado', publishing: 'A publicar', published: 'Publicado', failed: 'Falhou' };

async function load() {
  const posts = await (await fetch('/api/posts')).json();
  $('#l').innerHTML = posts.map((p) => {
    const url = `/media/${p.media}`;
    const isVideo = p.kind.includes('video') || p.kind === 'reel';
    const shape = p.kind.startsWith('story') || p.kind === 'reel' ? 'story' : '';
    const media = isVideo
      ? `<video class="preview-media ${shape}" src="${url}" controls playsinline></video>`
      : `<img class="preview-media ${shape}" src="${url}" alt="Prévia da imagem da publicação">`;
    const open = ['draft', 'failed', 'scheduled'].includes(p.status);
    const targets = [`<span class="platform-chip">Instagram${p.status === 'published' ? (p.ig_id ? ' · publicado' : '') : ''}</span>`];
    if (p.facebook && !p.kind.startsWith('story')) {
      targets.push(`<span class="platform-chip">Facebook${p.fb_id ? ' · publicado' : p.fb_error ? ' · falhou' : ''}</span>`);
    }
    return `<div class="p" data-id="${p.id}">
      <div>
        <p class="preview-title">Prévia aproximada · ${p.kind.startsWith('story') ? 'Story' : p.kind === 'reel' ? 'Reel' : 'Feed'}</p>
        <div class="post-preview">
          <div class="preview-heading"><span class="preview-avatar">C</span><span>@cortexis.tech</span><span class="preview-kind">${p.kind.startsWith('story') ? 'Story' : p.kind === 'reel' ? 'Reel' : 'Publicação'}</span></div>
          ${media}
          <div class="preview-actions" aria-hidden="true"><span>♡</span><span>◯</span><span>➤</span></div>
          <div class="preview-caption"><strong>cortexis.tech</strong><span data-caption-preview>${esc(p.caption || 'A legenda aparecerá aqui.')}</span></div>
          <div class="preview-platforms">${targets.join('')}</div>
        </div>
        <p class="preview-note">Prévia ilustrativa. O enquadramento final pode variar conforme o formato e a aplicação.</p>
      </div>
      <div class="editor-area">
      <div class="t status-line">${p.kind} · ${labels[p.status]}${p.llm ? ' · legenda: ' + esc(p.llm) : ''}${p.scheduled_at ? ' · ' + new Date(p.scheduled_at).toLocaleString() : ''}</div>
      <textarea data-caption-editor ${open ? '' : 'disabled'}>${esc(p.caption)}</textarea>
      ${p.facebook ? `<div class="t status-line">Facebook: ${p.fb_id ? 'publicado' : p.fb_error ? 'falhou' : 'pendente'}</div>` : ''}
      ${p.fb_error ? `<div class="t" style="color:#b00">${esc(p.fb_error)}</div>` : ''}
      ${p.error ? `<div class="t" style="color:#b00">${esc(p.error)}</div>` : ''}
      ${open ? `<div class="row"><input type="datetime-local" class="when"><button data-a="approve">Aprovar</button><button class="s" data-a="regen">Refazer legenda</button><button class="s" data-a="del">Apagar</button></div>` : ''}
      </div>
    </div>`;
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

$('#l').oninput = (e) => {
  if (e.target.matches('[data-caption-editor]')) {
    const preview = e.target.closest('.p').querySelector('[data-caption-preview]');
    preview.textContent = e.target.value || 'A legenda aparecerá aqui.';
  }
};

load();
setInterval(() => {
  if (!document.activeElement.matches('[data-caption-editor]')) load();
}, 15000);
