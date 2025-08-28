// netlify/functions/flush.js
const { resp, gsPost } = require('./_fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });
    const { pw = '' } = JSON.parse(event.body || '{}');
    // Apps Script nuevo: POST { action:'flush', pw }
    const data = await gsPost({ action: 'flush', pw });
    return resp(200, data);
  } catch (e) {
    console.error('flush error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
