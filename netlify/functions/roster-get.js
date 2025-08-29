// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    // Intento: leer desde Blobs manual con siteID+token
    try {
      const { getStore } = await import('@netlify/blobs');
      const siteID = (process.env.NETLIFY_SITE_ID || '').trim();
      const token  = (process.env.NETLIFY_API_TOKEN || '').trim();

      if (siteID && token) {
        const store = getStore('roster', { siteID, token });
        const data = await store.get('roster.json', { type: 'json' });
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
      } else {
        console.info('roster-get: blobs not configured', { hasSite: !!siteID, hasToken: !!token });
      }
    } catch (e) {
      console.info('roster-get: blobs not available:', e.message);
    }

    // Fallback: solo grupos desde Apps Script
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
