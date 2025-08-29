// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    let data = null;

    // 1) Intentar leer desde Netlify Blobs (modo manual con siteID + token)
    try {
      const { getStore } = await import('@netlify/blobs');
      const siteID = process.env.NETLIFY_SITE_ID;
      const token  = process.env.NETLIFY_API_TOKEN;

      if (siteID && token) {
        const store = getStore('roster', { siteID, token });
        data = await store.get('roster.json', { type: 'json' });
      } else {
        console.log('blobs manual not configured (missing NETLIFY_SITE_ID or NETLIFY_API_TOKEN)');
      }
    } catch (e) {
      console.log('blobs read error:', e.message);
    }

    // 2) Si hay byGroup completo, devolverlo (rápido)
    if (data && data.byGroup && Object.keys(data.byGroup).length) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        },
        body: JSON.stringify(data)
      };
    }

    // 3) Fallback: solo listas de grupos (el front pedirá /alumnos por grupo)
    const g = await gsGet({ action: 'grupos' });
    const out = {
      byGroup: {},
      nacionales: Array.isArray(g.nacionales) ? g.nacionales : [],
      internacionales: Array.isArray(g.internacionales) ? g.internacionales : [],
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(out)
    };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
