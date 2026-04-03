const { app } = require('@azure/functions');
const https = require('https');

/**
 * Checks if a specific email is allowed access.
 * Called by the front-end login page before triggering MSAL.
 * 
 * Input: POST { "email": "john@example.com" }
 * Output: { "allowed": true/false }
 * 
 * Does NOT return the full allowlist — prevents data leakage.
 */

let cachedData = { domains: [], emails: [], lastFetched: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default'
  }).toString();

  const options = {
    hostname: 'login.microsoftonline.com',
    path: `/${tenantId}/oauth2/v2.0/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenBody)
    }
  };

  const response = await httpsRequest(options, tokenBody);
  if (response.statusCode !== 200 || !response.body.access_token) return null;
  return response.body.access_token;
}

async function fetchSharePointAllowlist(context) {
  const siteId = process.env.GRAPH_SITE_ID;
  const listId = process.env.GRAPH_LIST_ID;
  if (!siteId || !listId) return { domains: [], emails: [] };

  const accessToken = await getAccessToken();
  if (!accessToken) return { domains: [], emails: [] };

  const options = {
    hostname: 'graph.microsoft.com',
    path: `/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=500`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  };

  const response = await httpsRequest(options);
  if (response.statusCode !== 200 || !response.body.value) return { domains: [], emails: [] };

  const domains = [];
  const emails = [];

  for (const item of response.body.value) {
    const fields = item.fields;
    if (!fields || !fields.Value) continue;

    const status = (fields.Status || '').toLowerCase();
    if (status !== 'approved') continue;

    const value = fields.Value.toLowerCase().trim();
    const entryType = (fields.EntryType || 'Email').toLowerCase();

    if (entryType === 'domain') {
      domains.push(value);
    } else {
      emails.push(value);
    }
  }

  return { domains, emails };
}

async function isEmailAllowed(email, context) {
  email = email.toLowerCase().trim();
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1]) return false;
  const domain = parts[1];

  // Check env var baseline first (instant)
  const envDomains = (process.env.ALLOWED_DOMAINS || '')
    .split(',').map(d => d.toLowerCase().trim()).filter(d => d.length > 0);
  const envEmails = (process.env.ALLOWED_EMAILS || '')
    .split(',').map(e => e.toLowerCase().trim()).filter(e => e.length > 0);

  if (envDomains.includes(domain) || envEmails.includes(email)) return true;

  // Check SharePoint (cached)
  const now = Date.now();
  if (now - cachedData.lastFetched >= CACHE_TTL_MS) {
    try {
      const spData = await fetchSharePointAllowlist(context);
      cachedData = { ...spData, lastFetched: now };
    } catch (error) {
      context.log('WARNING: Failed to refresh SharePoint cache');
    }
  }

  if (cachedData.domains.includes(domain) || cachedData.emails.includes(email)) return true;

  return false;
}

app.http('checkAllowedAccess', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      if (!body || !body.email) {
        return {
          status: 400,
          jsonBody: { allowed: false, error: 'Email is required' }
        };
      }

      const allowed = await isEmailAllowed(body.email, context);

      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST'
        },
        jsonBody: { allowed: allowed }
      };

    } catch (error) {
      context.error('checkAllowedAccess error:', error.message);
      return {
        status: 200,
        jsonBody: { allowed: false }
      };
    }
  }
});