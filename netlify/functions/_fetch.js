// netlify/functions/_fetch.js
const BASE = process.env.APPS_SCRIPT_URL;       // p.ej. https://script.google.com/macros/s/XXX/exec
const SECRET = process.env.SERVER_SECRET;       // Debe coincidir con props.getProperty('SERVER_SECRET') en Code.gs

function resp(status, data) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
}

function buildUrl(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  }
  if (SECRET) usp.set('server_secret', SECRET);
  return `${BASE}?${usp.toString()}`;
}

async function gsGet(params) {
  const url = buildUrl(params);
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error(`GS_GET ${r.status}`);
  return r.json();
}

async function gsPost(body) {
  const payload = Object.assign({}, body || {}, { server_secret: SECRET || '' });
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`GS_POST ${r.status}`);
  return r.json();
}

module.exports = { resp, gsGet, gsPost };

