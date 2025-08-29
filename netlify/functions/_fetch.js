// netlify/functions/_fetch.js
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';
const SERVER_SECRET   = process.env.SERVER_SECRET   || '';

function resp(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}

// GET a Apps Script con server_secret
async function gsGet(params) {
  const q = new URLSearchParams({ ...params, server_secret: SERVER_SECRET });
  const url = `${APPS_SCRIPT_URL}?${q.toString()}`;
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error(`gsGet ${params.action} ${r.status}`);
  return r.json();
}

// POST a Apps Script con server_secret
async function gsPost(payload) {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, server_secret: SERVER_SECRET })
  });
  if (!r.ok) throw new Error(`gsPost ${payload.action} ${r.status}`);
  return r.json();
}

module.exports = { resp, gsGet, gsPost };
