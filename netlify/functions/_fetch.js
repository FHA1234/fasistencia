// netlify/functions/_fetch.js
const APPS = process.env.APPS_SCRIPT_URL || '';
const SERVER_SECRET = process.env.SERVER_SECRET || '';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const qs = (obj) => new URLSearchParams(obj).toString();

const resp = (statusCode, bodyObj) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(bodyObj)
});

// GET -> doGet(e): añade server_secret como query
const gsGet = async (params = {}) => {
  if (!APPS) throw new Error('APPS_SCRIPT_URL missing');
  const url = `${APPS}?${qs({ ...params, server_secret: SERVER_SECRET })}`;
  const r = await fetch(url, { method: 'GET' });
  const text = await r.text();
  try { return JSON.parse(text); }
  catch (e) { throw new Error('AppsScript non-JSON: ' + text.slice(0, 140)); }
};

// POST -> doPost(e): JSON con server_secret en el body
const gsPost = async (body = {}) => {
  if (!APPS) throw new Error('APPS_SCRIPT_URL missing');
  const r = await fetch(APPS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, server_secret: SERVER_SECRET })
  });
  const text = await r.text();
  try { return JSON.parse(text); }
  catch (e) { throw new Error('AppsScript non-JSON: ' + text.slice(0, 140)); }
};

module.exports = { resp, gsGet, gsPost };
