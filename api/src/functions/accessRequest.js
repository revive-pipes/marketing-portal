const { app } = require('@azure/functions');
const https = require('https');

// Configuration from environment variables
const CONFIG = {
  tenantId: process.env.TENANT_ID || '',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  siteId: process.env.SITE_ID || '',
  listId: process.env.LIST_ID || ''
};

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
async function getAccessToken() {
  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
    scope: 'https://graph.microsoft.com/.default'
  }).toString();

  const options = {
    hostname: 'login.microsoftonline.com',
    path: `/${CONFIG.tenantId}/oauth2/v2.0/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenBody)
    }
  };

  const response = await httpsRequest(options, tokenBody);

  if (response.statusCode !== 200 || !response.body.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(response.body));
  }

  return response.body.access_token;
}

/**
 * Creates a new item in the SharePoint list via Microsoft Graph
 */
async function createListItem(accessToken, fields) {
  const itemBody = JSON.stringify({ fields });

  const options = {
    hostname: 'graph.microsoft.com',
    path: `/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(itemBody)
    }
  };

  const response = await httpsRequest(options, itemBody);

  if (response.statusCode !== 201) {
    throw new Error('Failed to create list item: ' + JSON.stringify(response.body));
  }

  return response.body;
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitizes input - trims whitespace, limits length
 */
function sanitize(str, maxLength) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength || 255);
}

/**
 * HTTP POST handler for access requests
 */
app.http('accessRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      if (!body) {
        return {
          status: 400,
          jsonBody: { success: false, error: 'Request body is required' }
        };
      }

      // Extract and sanitize fields
      const name = sanitize(body.name, 100);
      const email = sanitize(body.email, 255).toLowerCase();
      const organization = sanitize(body.organization, 255);
      const jobTitle = sanitize(body.jobTitle, 100);
      const phone = sanitize(body.phone, 30);
      const type = sanitize(body.type, 20);
      const invitedBy = sanitize(body.invitedBy, 255).toLowerCase();

      // Validate required fields
      if (!name) {
        return { status: 400, jsonBody: { success: false, error: 'Name is required' } };
      }

      if (!email || !isValidEmail(email)) {
        return { status: 400, jsonBody: { success: false, error: 'Valid email is required' } };
      }

      if (!organization) {
        return { status: 400, jsonBody: { success: false, error: 'Organization is required' } };
      }

      // Validate request type
      const validTypes = ['access_request', 'colleague_invite'];
      const requestType = validTypes.includes(type) ? type : 'access_request';

      // Map to SharePoint list column names
      const fields = {
        Title: name,
        RequesterName: name,
        RequesterEmail: email,
        Organization: organization,
        JobTitle: jobTitle || '',
        Phone: phone || '',
        RequestType: requestType === 'access_request' ? 'Access Request' : 'Colleague Invite',
        InvitedBy: invitedBy || '',
        Status: 'Pending',
        SubmittedAt: new Date().toISOString()
      };

      // Get access token
      const accessToken = await getAccessToken();

      // Create the list item
      await createListItem(accessToken, fields);

      context.log('Access request created:', email, requestType);

      return {
        status: 200,
        jsonBody: { success: true, message: 'Request submitted successfully' }
      };

    } catch (error) {
      context.error('Access request error:', error.message);
      return {
        status: 500,
        jsonBody: { success: false, error: 'An error occurred. Please try again later.' }
      };
    }
  }
});