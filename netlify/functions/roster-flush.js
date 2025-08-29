// netlify/functions/roster-flush.js
const { resp, gsGet } = require('./_fetch');

// Pequeño helper para pedir en paralelo con límite
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

    // ← Clave admin (recortada para evitar espacios)
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

    // ← Cuerpo recibido (recortamos también)
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch {}
    const pw = String(body.pw || '').trim();

    if (!ADMIN_PASSWORD) {
      return resp(500, { error: 'ADMIN_PASSWORD_NOT_SET' });
    }
    if (pw !== ADMIN_PASSWORD) {
      return resp(403, { error: 'FORBIDDEN' });
    }

    // 1) Pide SOLO los grupos
    const g = await gsGet({ action: 'grupos' });
    const nacionales = Array.isArray(g.nacionales) ? g.nacionales : [];
    const internacionales = Array.isArray(g.internacionales) ? g.internacionales : [];
    const allGroups = [...nacionales, ...internacionales];

    // 2) Pide alumnos por grupo (paralelo con límite 5)
    const pairs = await withLimit(allGroups, 5, async (grupo) => {
      try {
        const arr = await gsGet({ action: 'alumnos', grupo });
        return [grupo, Array.isArray(arr) ? arr : []];
      } catch (e) {
        console.error('alumnos error', grupo, e.message);
        return [grupo, []];
      }
    });

    const byGroup = Object.fromEntries(pairs);
    const roster = {
      byGroup,
      nacionales,
      internacionales,
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    // 3) Guarda en Netlify Blobs (modo manual con siteID/token)
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('roster', {
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
      });
      await store.setJSON('roster.json', roster);
    } catch (e) {
      console.error('save blobs error:', e.message);
      // No abortamos: devolveremos OK igualmente (el front puede vivir con el fallback)
    }

    return resp(200, { status: 'OK', version: roster.version, grupos: allGroups.length });
  } catch (e) {
    console.error('roster-flush fatal:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};

