const { resp, gsPost } = require('./_fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });
    const payload = JSON.parse(event.body || '{}');
    const data = await gsPost({ action: 'registro', ...payload });
    return resp(200, data);
  } catch (e) {
    console.error('registro error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
