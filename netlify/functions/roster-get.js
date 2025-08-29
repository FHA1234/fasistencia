const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    // 1) Lee de Netlify Blobs (import dinámico para ESM)
    let data = null;
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('roster');
      data = await store.get('roster.json', { type: 'json' });
    } catch (e) {
      console.log('blobs not available:', e.message);
    }

    if (data) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        },
        body: JSON.stringify(data)
      };
    }

    // 2) Fallback rápido: solo grupos desde Apps Script
    const g = await gsGet({ action: 'grupos' });
    const out = {
      byGroup: {},
      nacionales: Array.isArray(g.nacionales) ? g.nacionales : [],
      internacionales: Array.isArray(g.internacionales) ? g.internacionales : [],
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
