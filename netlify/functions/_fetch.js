const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const SERVER_SECRET   = process.env.SERVER_SECRET;

function resp(status, data) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function gsGet(params = {}) {
  if (!APPS_SCRIPT_URL || !SERVER_SECRET) throw new Error('Missing env vars');
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('server_secret', SERVER_SECRET);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { method: 'GET' });
  const txt = await r.text();
  if (!r.ok) throw new Error(`AppsScript GET ${r.status}: ${txt}`);
  return JSON.parse(txt);
}

async function gsPost(body = {}) {
  if (!APPS_SCRIPT_URL || !SERVER_SECRET) throw new Error('Missing env vars');
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ server_secret: SERVER_SECRET, ...body }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`AppsScript POST ${r.status}: ${txt}`);
  return JSON.parse(txt);
}

module.exports = { resp, gsGet, gsPost };
