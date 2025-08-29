// netlify/functions/alumnos.js
const { resp, gsGet } = require('./_fetch');

exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const grupo = params.get('grupo') || '';
    if (!grupo) return resp(400, { error: 'MISSING_GRUPO' });

    const arr = await gsGet({ action: 'alumnos', grupo });
    return resp(200, Array.isArray(arr) ? arr : []);
  } catch (e) {
    console.error('alumnos error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
