const { app } = require('@azure/functions');

/**
 * Custom Authentication Extension - OnAttributeCollectionStart
 * 
 * Called by Entra External ID before showing the attribute collection page.
 * Checks the user's email against:
 *   1. ALLOWED_DOMAINS - entire domains (e.g., revivepipes.com)
 *   2. ALLOWED_EMAILS - specific individual emails (e.g., john@gmail.com)
 * Returns Continue if allowed, ShowBlockPage if blocked.
 * 
 * SECURITY: Fails closed - if email cannot be found or an error occurs,
 * the user is blocked from signing up.
 */
app.http('domainChecker', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      let email = null;

      // Extract email from userSignUpInfo.identities
      if (body.data && body.data.userSignUpInfo && body.data.userSignUpInfo.identities) {
        const identities = body.data.userSignUpInfo.identities;
        for (const identity of identities) {
          if (identity.issuerAssignedId && identity.issuerAssignedId.includes('@')) {
            email = identity.issuerAssignedId.toLowerCase().trim();
            context.log('Found email:', email, 'signInType:', identity.signInType);
            break;
          }
        }
      }

      // If email not found, block (fail closed)
      if (!email) {
        context.log('WARNING: No email found - blocking sign-up');
        return {
          status: 200,
          jsonBody: {
            data: {
              "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
              actions: [
                {
                  "@odata.type": "microsoft.graph.attributeCollectionStart.showBlockPage",
                  title: "Access not enabled",
                  message: "We couldn't validate your email. Please go back and use the Request Access form."
                }
              ]
            }
          }
        };
      }

      // Parse allowlists
      const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
        .split(',')
        .map(d => d.toLowerCase().trim())
        .filter(d => d.length > 0);

      const allowedEmails = (process.env.ALLOWED_EMAILS || '')
        .split(',')
        .map(e => e.toLowerCase().trim())
        .filter(e => e.length > 0);

      const domain = email.split('@')[1];

      // Check 1: Is the full email individually approved?
      const emailApproved = allowedEmails.includes(email);

      // Check 2: Is the domain approved?
      const domainApproved = allowedDomains.includes(domain);

      context.log(`Email: ${email}, Domain: ${domain}`);
      context.log(`Allowed domains: ${allowedDomains.join(', ')}`);
      context.log(`Allowed emails: ${allowedEmails.join(', ')}`);
      context.log(`Domain approved: ${domainApproved}, Email approved: ${emailApproved}`);

      if (domainApproved || emailApproved) {
        context.log(`ALLOWED - ${emailApproved ? 'individual email' : 'domain'} match`);
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
      } else {
        context.log(`BLOCKED - no match for ${email}`);
        return {
          status: 200,
          jsonBody: {
            data: {
              "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
              actions: [
                {
                  "@odata.type": "microsoft.graph.attributeCollectionStart.showBlockPage",
                  title: "Access not enabled",
                  message: "Your organization hasn't been enabled for portal access yet. Please go back and use the Request Access form to request an invitation."
                }
              ]
            }
          }
        };
      }

    } catch (error) {
      context.error('Domain checker error:', error.message);
      return {
        status: 200,
        jsonBody: {
          data: {
            "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
            actions: [
              {
                "@odata.type": "microsoft.graph.attributeCollectionStart.showBlockPage",
                title: "Access not enabled",
                message: "We couldn't process your sign-up request. Please go back and use the Request Access form."
              }
            ]
          }
        }
      };
    }
  }
});