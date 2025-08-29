// netlify/functions/roster-get.js
const { resp } = require('./_fetch');

exports.handler = async () => {
  try {
    try {
      const { getStore } = await import('@netlify/blobs');
      const siteID = (process.env.NETLIFY_SITE_ID || '').trim();
      const token  = (process.env.NETLIFY_API_TOKEN || '').trim();

      if (siteID && token) {
        const store = getStore({ name: 'roster', siteID, token });
        const data  = await store.get('roster.json', { type: 'json' });

        if (data && data.byGroup && Object.keys(data.byGroup).length) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            },
            body: JSON.stringify(data)
          };
        }

        // JSON no existe o vacío
        const out = {
          error: 'NO_ROSTER',
          byGroup: {},
          nacionales: [],
          internacionales: [],
          version: Date.now(),
          updatedAt: new Date().toISOString()
        };
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          },
          body: JSON.stringify(out)
        };
      } else {
        console.info('roster-get: blobs not configured', { hasSite: !!siteID, hasToken: !!token });
      }
    } catch (e) {
      console.info('roster-get: blobs not available:', e.message);
    }

    // Sin plan B: no devolvemos alumnos si no hay Blobs
    const out = {
      error: 'NO_ROSTER',
      byGroup: {},
      nacionales: [],
      internacionales: [],
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(out)
    };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
