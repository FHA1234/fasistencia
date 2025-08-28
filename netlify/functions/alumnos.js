const { resp, gsGet } = require('./_fetch');

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const grupo = url.searchParams.get('grupo') || '';
    const data = await gsGet({ action: 'alumnos', grupo });
    return resp(200, data);
  } catch (e) {
    console.error('alumnos error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
