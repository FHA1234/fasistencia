const { resp, gsGet } = require('./_fetch');

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const grupo = url.searchParams.get('grupo') || '';
    // Apps Script nuevo: GET ?action=alumnos&grupo=...
    const data = await gsGet({ action: 'alumnos', grupo });
    return resp(200, Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('alumnos error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
