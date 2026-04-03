const { app } = require('@azure/functions');
const https = require('https');

/**
 * Custom Authentication Extension - OnAttributeCollectionStart
 * 
 * Checks user's email against:
 *   1. ALLOWED_DOMAINS env var (permanent baseline - e.g., revivepipes.com)
 *   2. ALLOWED_EMAILS env var (manual individual approvals)
 *   3. SharePoint "Approved Access" list (automated approvals from Power Automate)
 * 
 * SECURITY: Fails closed on all errors.
 * PERFORMANCE: Caches SharePoint list in memory, refreshes every 5 minutes.
 */

// In-memory cache for SharePoint allowlist
let cachedAllowlist = { domains: [], emails: [], lastFetched: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Makes an HTTPS request and returns a promise
 */
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

/**
 * Gets an access token from Microsoft Entra using client credentials
 */
async function getAccessToken(context) {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    context.log('WARNING: Graph API credentials not configured');
    return null;
  }

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

  if (response.statusCode !== 200 || !response.body.access_token) {
    context.log('ERROR: Failed to get Graph access token');
    return null;
  }

  return response.body.access_token;
}

/**
 * Fetches the Approved Access list from SharePoint via Graph API
 * Returns { domains: [], emails: [] }
 */
async function fetchAllowlistFromSharePoint(context) {
  const siteId = process.env.GRAPH_SITE_ID;
  const listId = process.env.GRAPH_LIST_ID;

  if (!siteId || !listId) {
    context.log('WARNING: SharePoint site/list IDs not configured');
    return { domains: [], emails: [] };
  }

  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    return { domains: [], emails: [] };
  }

  const options = {
    hostname: 'graph.microsoft.com',
    path: `/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=500`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  const response = await httpsRequest(options);

  if (response.statusCode !== 200 || !response.body.value) {
    context.log('ERROR: Failed to fetch SharePoint allowlist:', response.statusCode);
    return { domains: [], emails: [] };
  }

  const domains = [];
  const emails = [];

  for (const item of response.body.value) {
    const fields = item.fields;
    if (!fields || !fields.Value) continue;

    const value = fields.Value.toLowerCase().trim();
    const entryType = (fields.EntryType || 'Email').toLowerCase();

    if (entryType === 'domain') {
      domains.push(value);
    } else {
      emails.push(value);
    }
  }

  context.log(`SharePoint allowlist loaded: ${domains.length} domains, ${emails.length} emails`);
  return { domains, emails };
}

/**
 * Gets the combined allowlist from env vars + SharePoint (with caching)
 */
async function getAllowlist(context) {
  // Always include env var baseline
  const envDomains = (process.env.ALLOWED_DOMAINS || '')
    .split(',').map(d => d.toLowerCase().trim()).filter(d => d.length > 0);

  const envEmails = (process.env.ALLOWED_EMAILS || '')
    .split(',').map(e => e.toLowerCase().trim()).filter(e => e.length > 0);

  // Check if cache is still valid
  const now = Date.now();
  if (now - cachedAllowlist.lastFetched < CACHE_TTL_MS) {
    return {
      domains: [...envDomains, ...cachedAllowlist.domains],
      emails: [...envEmails, ...cachedAllowlist.emails]
    };
  }

  // Cache expired — refresh from SharePoint
  try {
    const spAllowlist = await fetchAllowlistFromSharePoint(context);
    cachedAllowlist = {
      domains: spAllowlist.domains,
      emails: spAllowlist.emails,
      lastFetched: now
    };
    context.log('Allowlist cache refreshed from SharePoint');
  } catch (error) {
    context.log('WARNING: Failed to refresh allowlist from SharePoint, using cached data');
    // Keep stale cache rather than blocking everyone
  }

  return {
    domains: [...envDomains, ...cachedAllowlist.domains],
    emails: [...envEmails, ...cachedAllowlist.emails]
  };
}

/**
 * Block response helper
 */
function blockResponse(title, message) {
  return {
    status: 200,
    jsonBody: {
      data: {
        "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
        actions: [
          {
            "@odata.type": "microsoft.graph.attributeCollectionStart.showBlockPage",
            title: title,
            message: message
          }
        ]
      }
    }
  };
}

/**
 * Continue response helper
 */
function continueResponse() {
  return {
    status: 200,
    jsonBody: {
      data: {
        "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
        actions: [
          {
            "@odata.type": "microsoft.graph.attributeCollectionStart.continueWithDefaultBehavior"
          }
        ]
      }
    }
  };
}

/**
 * HTTP POST handler - called by Entra during OnAttributeCollectionStart
 */
app.http('domainChecker', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      // Extract email from identities
      let email = null;
      if (body.data && body.data.userSignUpInfo && body.data.userSignUpInfo.identities) {
        for (const identity of body.data.userSignUpInfo.identities) {
          if (identity.issuerAssignedId && identity.issuerAssignedId.includes('@')) {
            email = identity.issuerAssignedId.toLowerCase().trim();
            context.log('Found email:', email, 'signInType:', identity.signInType);
            break;
          }
        }
      }

      // No email found — fail closed
      if (!email) {
        context.log('WARNING: No email found - blocking');
        return blockResponse(
          'Access not enabled',
          'We couldn\'t validate your email. Please go back and use the Request Access form.'
        );
      }

      // Get combined allowlist (env vars + SharePoint)
      const allowlist = await getAllowlist(context);
      const domain = email.split('@')[1];

      context.log(`Checking: email=${email}, domain=${domain}`);
      context.log(`Allowed domains: ${allowlist.domains.join(', ')}`);
      context.log(`Allowed emails: ${allowlist.emails.join(', ')}`);

      // Check individual email first, then domain
      if (allowlist.emails.includes(email) || allowlist.domains.includes(domain)) {
        context.log('ALLOWED');
        return continueResponse();
      }

      context.log('BLOCKED');
      return blockResponse(
        'Access not enabled',
        'Your organization hasn\'t been enabled for portal access yet. Please go back and use the Request Access form to request an invitation.'
      );

    } catch (error) {
      context.error('Domain checker error:', error.message);
      return blockResponse(
        'Access not enabled',
        'We couldn\'t process your sign-up request. Please go back and use the Request Access form.'
      );
    }
  }
});