// netlify/functions/roster-flush.js
const { resp, gsGet } = require('./_fetch');

async function buildRosterFromSheets() {
  const g = await gsGet({ action: 'grupos' });
  const nacionales = Array.isArray(g.nacionales) ? g.nacionales : [];
  const internacionales = Array.isArray(g.internacionales) ? g.internacionales : [];
  const allGroups = [...nacionales, ...internacionales];
  const byGroup = {};
  for (const grupo of allGroups) {
    const alumnos = await gsGet({ action: 'alumnos', grupo });
    byGroup[grupo] = Array.isArray(alumnos) ? alumnos : [];
  }
  return {
    byGroup,
    nacionales,
    internacionales,
    version: Date.now(),
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'METHOD_NOT_ALLOWED' });

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
    const { pw = '' } = JSON.parse(event.body || '{}');
    if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
      return resp(403, { error: 'FORBIDDEN' }); // no propagamos "contraseña incorrecta"
    }

    const roster = await buildRosterFromSheets();
    const txt = JSON.stringify(roster);
    const store = context && context.blobStore;
    if (store && store.set) {
      await store.set('roster.json', txt, {
        metadata: { updatedAt: roster.updatedAt, version: String(roster.version) }
      });
    }
    return resp(200, { status: 'OK', version: roster.version });
  } catch (e) {
    console.error('roster-flush error:', e);
    return resp(502, { error: 'BACKEND_UNAVAILABLE' });
  }
};

