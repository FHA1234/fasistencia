// netlify/functions/roster-flush.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
    const { pw = '' } = JSON.parse(event.body || '{}');
    if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
      // Nunca devolvemos "contraseña incorrecta" al front
      return resp(403, { error: 'FORBIDDEN' });
    }

    // Pide el roster a Apps Script y guárdalo en Blobs
    const data = await gsGet({ action: 'roster' });
    const txt = JSON.stringify(data);
    const version = Date.now().toString();

    await context.blobStore.set('roster.json', txt, {
      metadata: { updatedAt: new Date().toISOString(), version }
    });

    return resp(200, { status: 'OK', version });
  } catch (e) {
    console.error('roster-flush error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
