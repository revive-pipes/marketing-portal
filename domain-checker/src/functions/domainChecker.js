const { app } = require('@azure/functions');

/**
 * Custom Authentication Extension - OnAttributeCollectionStart
 * 
 * Called by Entra External ID before showing the attribute collection page.
 * Checks the user's email domain against the allowed domains list.
 * Returns Continue for allowed domains, ShowBlockPage for blocked domains.
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
      // Entra sends signInType as "federated" with issuer "mail" for email OTP
      if (body.data && body.data.userSignUpInfo && body.data.userSignUpInfo.identities) {
        const identities = body.data.userSignUpInfo.identities;
        for (const identity of identities) {
          if (identity.issuerAssignedId && identity.issuerAssignedId.includes('@')) {
            email = identity.issuerAssignedId;
            context.log('Found email in identities:', email, 'signInType:', identity.signInType);
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
                  message: "We couldn't validate your email domain. Please go back and use the Request Access form."
                }
              ]
            }
          }
        };
      }

      // Extract domain and check against allowlist
      const domain = email.split('@')[1].toLowerCase().trim();
      const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
        .split(',')
        .map(d => d.toLowerCase().trim())
        .filter(d => d.length > 0);

      context.log(`Checking domain: ${domain} against allowed: ${allowedDomains.join(', ')}`);

      if (allowedDomains.includes(domain)) {
        context.log(`Domain ${domain} is ALLOWED`);
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
        context.log(`Domain ${domain} is BLOCKED`);
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
      // Fail closed - block on error
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