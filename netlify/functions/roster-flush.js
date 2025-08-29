// netlify/functions/roster-flush.js
const { resp, gsGet } = require('./_fetch');

async function withLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return out;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
    const { pw = '' } = JSON.parse(event.body || '{}');
    if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return resp(403, { error: 'FORBIDDEN' });

    // 1) grupos
    const g = await gsGet({ action: 'grupos' });
    const nacionales = Array.isArray(g.nacionales) ? g.nacionales : [];
    const internacionales = Array.isArray(g.internacionales) ? g.internacionales : [];
    const allGroups = [...nacionales, ...internacionales];

    // 2) alumnos por grupo (paralelo con límite)
    const pairs = await withLimit(allGroups, 6, async (grupo) => {
      const arr = await gsGet({ action: 'alumnos', grupo });
      return [grupo, Array.isArray(arr) ? arr : []];
    });

    const roster = {
      byGroup: Object.fromEntries(pairs),
      nacionales, internacionales,
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    // 3) escribir en Blobs con siteID + token (modo manual)
    try {
      const { getStore } = await import('@netlify/blobs');

      const siteID = (process.env.NETLIFY_SITE_ID || '').trim();
      const token  = (process.env.NETLIFY_API_TOKEN || '').trim();

      // Diagnóstico si faltan
      if (!siteID || !token) {
        console.error('BLOBS_NOT_CONFIGURED', { hasSite: !!siteID, hasToken: !!token });
        return resp(500, { error: 'BLOBS_NOT_CONFIGURED' });
      }

      const store = getStore('roster', { siteID, token });
      await store.set('roster.json', JSON.stringify(roster), {
        metadata: { updatedAt: roster.updatedAt, version: String(roster.version) }
      });

      return resp(200, { status: 'OK', version: roster.version, grupos: allGroups.length });
    } catch (e) {
      console.error('roster-flush write error:', e);
      return resp(502, { error: 'BLOBS_WRITE_FAILED' });
    }
  } catch (e) {
    console.error('roster-flush error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
