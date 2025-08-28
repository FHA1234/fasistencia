// netlify/functions/grupos.js
const { gsGet } = require('./_fetch');

exports.handler = async () => {
  try {
    // 1) token del Apps Script “viejo”
    const tok = await gsGet({ action: 'token' });
    const token = tok && tok.token ? tok.token : '';

    // 2) roster completo: { "GRUPO": ["Alumno1","Alumno2"], ... }
    const roster = await gsGet({ action: 'roster', token }) || {};
    const grupos = Object.keys(roster).sort();

    // NOTA: tu hoja no usa columna "TIPO", así que todo va a NACIONAL.
    const data = {
      nacionales: grupos,
      internacionales: [],
      byGroup: roster,                // ← incluimos TODO para evitar más llamadas
      version: Date.now(),
      updatedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // pequeño caché en CDN (2 min) para acelerón con muchos alumnos
        'Cache-Control': 'public, max-age=0, s-maxage=120'
      },
      body: JSON.stringify(data),
    };
  } catch (e) {
    console.error('grupos error:', e);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'BACKEND_UNAVAILABLE' })
    };
  }
};
