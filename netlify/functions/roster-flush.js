const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    // Leer de Blobs en modo manual (siteID + token)
    let data = null;
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('roster', {
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
      });
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

    // Fallback: solo grupos desde Apps Script (para no romper la web)
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
