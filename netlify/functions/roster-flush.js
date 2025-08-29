const { resp, gsGet } = require('./_fetch');

// pool de concurrencia
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

    console.log('flush start');

    // 1) grupos
    const g = await gsGet({ action: 'grupos' });
    const nacionales = Array.isArray(g.nacionales) ? g.nacionales : [];
    const internacionales = Array.isArray(g.internacionales) ? g.internacionales : [];
    const allGroups = [...nacionales, ...internacionales];
    console.log('grupos totales:', allGroups.length);

    // 2) alumnos (límite 5)
    const pairs = await withLimit(allGroups, 5, async (grupo) => {
      const arr = await gsGet({ action: 'alumnos', grupo });
      return [grupo, Array.isArray(arr) ? arr : []];
    });

    const byGroup = Object.fromEntries(pairs);
    const totalAlumnos = Object.values(byGroup).reduce((n,a)=>n + a.length, 0);
    console.log('alumnos totales:', totalAlumnos);

    const roster = {
      byGroup, nacionales, internacionales,
      version: Date.now(), updatedAt: new Date().toISOString()
    };

    // 3) guardar en Netlify Blobs (modo manual con siteID+token)
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('roster', {
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_API_TOKEN
    });

    console.log('saving to blobs...');
    await store.setJSON('roster.json', roster);

    console.log('flush done', { version: roster.version });
    return resp(200, { status:'OK', version: roster.version, grupos: allGroups.length, alumnos: totalAlumnos, updatedAt: roster.updatedAt });
  } catch (e) {
    console.error('roster-flush error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
