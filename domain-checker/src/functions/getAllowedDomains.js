const { app } = require('@azure/functions');

/**
 * Returns the current list of allowed domains.
 * Called by the front-end login page to check domains before triggering MSAL.
 * This ensures the front-end and back-end use the same allowlist.
 */
app.http('getAllowedDomains', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
      .split(',')
      .map(d => d.toLowerCase().trim())
      .filter(d => d.length > 0);

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      },
      jsonBody: {
        domains: allowedDomains
      }
    };
  }
});