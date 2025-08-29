// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch');
const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  try {
    const store = getStore('roster');
    const data = await store.get('roster.json', { type: 'json' });
    if (data) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
        body: JSON.stringify(data)
      };
    }

    // Fallback rápido: solo grupos, para no bloquear la web
    const g = await gsGet({ action: 'grupos' });
    const out = {
      byGroup:{},
      nacionales: Array.isArray(g.nacionales) ? g.nacionales : [],
      internacionales: Array.isArray(g.internacionales) ? g.internacionales : [],
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };
    return { statusCode:200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(out) };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};

