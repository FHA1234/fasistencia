// netlify/functions/roster-get.js
const { resp, gsGet } = require('./_fetch'); // usa tu helper existente

exports.handler = async (event, context) => {
  try {
    const store = context.blobStore;               // almacenamiento rápido de Netlify
    const key = 'roster.json';

    // 1) Intenta leer el JSON precalculado
    let txt = await store.get(key, { type: 'text' });
    if (!txt) {
      // 2) No existe: pide a Apps Script el roster completo (byGroup + listas)
      const data = await gsGet({ action: 'roster' });  // tu Apps Script ya lo tiene
      txt = JSON.stringify(data);
      await store.set(key, txt, {
        metadata: { updatedAt: new Date().toISOString(), version: Date.now().toString() }
      });
    }

    // Entrega super-rápida + caché corta en navegador (1 min) y CDN (5 min)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      },
      body: txt
    };
  } catch (e) {
    console.error('roster-get error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};
