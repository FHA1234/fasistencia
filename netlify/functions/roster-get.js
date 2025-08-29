// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async (event, context) => {
  try {
    const store = context && context.blobStore;
    const key = 'roster.json';

    // 1) Si ya hay JSON en Blobs → devolverlo (rápido)
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

    // 2) Fallback rápido: SOLO grupos (1 llamada a tu Apps Script)
    const g = await gsGet({ action: 'grupos' });
    const out = {
      byGroup: {}, // aún vacío → el front usará plan B para alumnos
      nacionales: Array.isArray(g.nacionales) ? g.nacionales : [],
      internacionales: Array.isArray(g.internacionales) ? g.internacionales : [],
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    const txt = JSON.stringify(out);
    if (store && store.set) {
      await store.set(key, txt, {
        metadata: { updatedAt: out.updatedAt, version: String(out.version) }
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
      body: txt
    };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};

