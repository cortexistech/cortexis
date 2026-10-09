const SYSTEM = `Você escreve legendas de Instagram em português para a Cortexistech, estúdio de software (sites, apps, agentes de IA). Tom executivo, claro e direto. Devolva só a legenda: gancho na primeira linha, 2 a 4 frases, chamada para ação e 5 a 8 hashtags. Sem emojis em excesso.`;

async function openai(prompt) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  return (await r.json()).choices[0].message.content.trim();
}

async function anthropic(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  return (await r.json()).content[0].text.trim();
}

let turn = 0;
// Alterna entre os provedores configurados e usa o outro se um falhar.
export async function writeCaption(prompt) {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push(['openai', openai]);
  if (process.env.ANTHROPIC_API_KEY) providers.push(['anthropic', anthropic]);
  if (!providers.length) throw new Error('Nenhuma chave de LLM configurada');
  const start = turn++ % providers.length;
  let lastError;
  for (let i = 0; i < providers.length; i++) {
    const [name, fn] = providers[(start + i) % providers.length];
    try {
      return { text: await fn(prompt), llm: name };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
