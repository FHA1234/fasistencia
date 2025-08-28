const { resp, gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    const data = await gsGet({ action: 'grupos' });
    return resp(200, data);
  } catch (e) {
    console.error('grupos error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
