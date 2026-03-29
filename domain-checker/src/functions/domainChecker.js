const { app } = require('@azure/functions');

/**
 * Custom Authentication Extension - OnAttributeCollectionStart
 * 
 * Called by Entra External ID before showing the attribute collection page.
 * Checks the user's email domain against the allowed domains list.
 * Returns Continue for allowed domains, ShowBlockPage for blocked domains.
 */
app.http('domainChecker', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      context.log('Domain checker called:', JSON.stringify(body).substring(0, 500));

      // Extract email from Entra's request payload
      // Entra sends the user's identities in the request
      let email = null;

      if (body.data && body.data.authenticationContext && body.data.authenticationContext.user) {
        // Try to get email from user object
        const user = body.data.authenticationContext.user;
        if (user.mail) {
          email = user.mail;
        } else if (user.userPrincipalName) {
          email = user.userPrincipalName;
        }
      }

      // Also check userSignUpInfo for self-service sign-up flows
      if (!email && body.data && body.data.userSignUpInfo) {
        const identities = body.data.userSignUpInfo.identities;
        if (identities && identities.length > 0) {
          for (const identity of identities) {
            if (identity.signInType === 'emailAddress' && identity.issuerAssignedId) {
              email = identity.issuerAssignedId;
              break;
            }
          }
        }
      }

      if (!email) {
        context.log('No email found in request payload');
        // If we can't find the email, allow them through
        // (the front-end should have already caught this)
        return {
          status: 200,
          jsonBody: {
            data: {
              "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
              actions: [
                {
                  "@odata.type": "microsoft.graph.attributeCollectionStart.continue"
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
        // Domain is allowed - continue sign-up
        context.log(`Domain ${domain} is ALLOWED`);
        return {
          status: 200,
          jsonBody: {
            data: {
              "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
              actions: [
                {
                  "@odata.type": "microsoft.graph.attributeCollectionStart.continue"
                }
              ]
            }
          }
        };
      } else {
        // Domain is blocked - show block page
        context.log(`Domain ${domain} is BLOCKED`);
        return {
          status: 200,
          jsonBody: {
            data: {
              "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
              actions: [
                {
                  "@odata.type": "microsoft.graph.attributeCollectionStart.showBlockPage",
                  message: "Your organization hasn't been enabled for portal access yet. Please go back and use the Request Access form to request an invitation."
                }
              ]
            }
          }
        };
      }

    } catch (error) {
      context.error('Domain checker error:', error.message);
      // On error, allow through (fail open) - front-end is the first check
      return {
        status: 200,
        jsonBody: {
          data: {
            "@odata.type": "microsoft.graph.onAttributeCollectionStartResponseData",
            actions: [
              {
                "@odata.type": "microsoft.graph.attributeCollectionStart.continue"
              }
            ]
          }
        }
      };
    }
  }
});