// netlify/functions/registro.js
const { resp, gsPost } = require('./_fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });
    const body = JSON.parse(event.body || '{}');
    // Envía TODO a Apps Script junto con server_secret (gsPost lo añade)
    const data = await gsPost({ action: 'registro', ...body });
    return resp(200, data);
  } catch (e) {
    console.error('registro error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
