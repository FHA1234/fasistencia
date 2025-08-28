// netlify/functions/grupos.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    // Apps Script nuevo: GET ?action=grupos (+server_secret lo añade _fetch)
    const data = await gsGet({ action: 'grupos' });
    return resp(200, data);
  } catch (e) {
    console.error('grupos error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
