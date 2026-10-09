const API = 'https://graph.facebook.com/v21.0';

async function call(path, params, method = 'POST') {
  const qs = new URLSearchParams({ ...params, access_token: process.env.IG_ACCESS_TOKEN });
  const r = await fetch(`${API}/${path}${method === 'GET' ? `?${qs}` : ''}`, {
    method,
    ...(method === 'POST' ? { body: qs } : {})
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Graph API ${r.status}`);
  return data;
}

async function waitReady(containerId) {
  for (let i = 0; i < 60; i++) {
    const { status_code, status } = await call(containerId, { fields: 'status_code,status' }, 'GET');
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Processamento falhou: ${status || status_code}`);
    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error('Tempo esgotado a processar a mídia');
}

// kind: reel | image | story_video | story_image
export async function publish({ kind, url, caption }) {
  const id = process.env.IG_USER_ID;
  const params = { reel: { media_type: 'REELS', video_url: url, caption },
    image: { image_url: url, caption },
    story_video: { media_type: 'STORIES', video_url: url },
    story_image: { media_type: 'STORIES', image_url: url } }[kind];
  if (!params) throw new Error(`Tipo inválido: ${kind}`);
  const { id: container } = await call(`${id}/media`, params);
  await waitReady(container);
  const { id: media } = await call(`${id}/media_publish`, { creation_id: container });
  return media;
}
