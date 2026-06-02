// Cloudflare Pages Function — cloud storage for vestibular app
// Handles GET (load) and POST (save) requests to KV
export async function onRequest(context) {
  const { request, env } = context;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  // KV not bound (e.g. dev/gui without binding configured) — degrade gracefully
  if (!env.VESTIBULAR_KV) {
    return request.method === 'GET'
      ? json({})
      : json({ ok: true, note: 'KV not configured' });
  }

  if (request.method === 'GET') {
    const raw = await env.VESTIBULAR_KV.get('backup');
    return new Response(raw || '{}', {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    const body = await request.text();
    try { JSON.parse(body); } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    await env.VESTIBULAR_KV.put('backup', body);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
