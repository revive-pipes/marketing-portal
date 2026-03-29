const { app } = require('@azure/functions');

/**
 * Returns the current allowed domains and individual emails.
 * Called by the front-end login page to check before triggering MSAL.
 * Single source of truth - both front-end and Entra extension use the same data.
 */
app.http('getAllowedDomains', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
      .split(',')
      .map(d => d.toLowerCase().trim())
      .filter(d => d.length > 0);

    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.toLowerCase().trim())
      .filter(e => e.length > 0);

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      },
      jsonBody: {
        domains: allowedDomains,
        emails: allowedEmails
      }
    };
  }
});