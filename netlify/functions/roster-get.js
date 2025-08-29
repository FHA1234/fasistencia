// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch');

async function buildRosterFromSheets() {
  const g = await gsGet({ action: 'grupos' }); // {nacionales, internacionales, ...}
  const nacionales = Array.isArray(g.nacionales) ? g.nacionales : [];
  const internacionales = Array.isArray(g.internacionales) ? g.internacionales : [];
  const allGroups = [...nacionales, ...internacionales];

  const byGroup = {};
  // Secuencial para ser amable con Apps Script (puedes paralelizar si son pocos grupos)
  for (const grupo of allGroups) {
    const alumnos = await gsGet({ action: 'alumnos', grupo });
    byGroup[grupo] = Array.isArray(alumnos) ? alumnos : [];
  }
  return {
    byGroup,
    nacionales,
    internacionales,
    version: Date.now(),
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async (event, context) => {
  try {
    const store = context && context.blobStore;
    const key = 'roster.json';

    // 1) Si hay JSON en Blobs, devolverlo
    if (store && store.get) {
      const txt = await store.get(key, { type: 'text' });
      if (txt) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
          body: txt
        };
      }
    }

    // 2) No hay JSON: construir desde tu Code.gs (grupos + alumnos) y guardar
    const roster = await buildRosterFromSheets();
    const bodyTxt = JSON.stringify(roster);

    if (store && store.set) {
      await store.set(key, bodyTxt, {
        metadata: { updatedAt: roster.updatedAt, version: String(roster.version) }
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
      body: bodyTxt
    };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
