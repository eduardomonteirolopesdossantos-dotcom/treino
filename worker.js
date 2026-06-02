// Cloudflare Worker entry point
// Handles /api/storage (KV sync) and passes everything else to static assets
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: cloud storage sync
    if (url.pathname === '/api/storage') {
      return handleStorage(request, env);
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};

/* ── CORS headers ── */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/* ── Storage handler ── */
async function handleStorage(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // KV not bound — degrade gracefully (dev/gui without binding)
  if (!env.VESTIBULAR_KV) {
    return request.method === 'GET'
      ? json({})
      : json({ ok: true, note: 'KV not configured' });
  }

  if (request.method === 'GET') {
    const raw = await env.VESTIBULAR_KV.get('backup');
    return new Response(raw || '{}', {
      headers: { ...CORS, 'Content-Type': 'application/json' },
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
