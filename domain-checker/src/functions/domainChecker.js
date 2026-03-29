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

      // Log the full payload for debugging
      context.log('=== FULL PAYLOAD START ===');
      context.log(JSON.stringify(body, null, 2));
      context.log('=== FULL PAYLOAD END ===');

      let email = null;

      // Path 1: Check userSignUpInfo.identities
      if (body.data && body.data.userSignUpInfo && body.data.userSignUpInfo.identities) {
        const identities = body.data.userSignUpInfo.identities;
        for (const identity of identities) {
          if (identity.signInType === 'emailAddress' && identity.issuerAssignedId) {
            email = identity.issuerAssignedId;
            context.log('Found email in identities:', email);
            break;
          }
          // Also check for email type
          if (identity.signInType === 'email' && identity.issuerAssignedId) {
            email = identity.issuerAssignedId;
            context.log('Found email in identities (email type):', email);
            break;
          }
        }
      }

      // Path 2: Check authenticationContext.user
      if (!email && body.data && body.data.authenticationContext && body.data.authenticationContext.user) {
        const user = body.data.authenticationContext.user;
        if (user.mail) {
          email = user.mail;
          context.log('Found email in authenticationContext.user.mail:', email);
        } else if (user.userPrincipalName) {
          email = user.userPrincipalName;
          context.log('Found email in authenticationContext.user.userPrincipalName:', email);
        }
      }

      // Path 3: Check userSignUpInfo.attributes for email
      if (!email && body.data && body.data.userSignUpInfo && body.data.userSignUpInfo.attributes) {
        const attrs = body.data.userSignUpInfo.attributes;
        if (attrs.email && attrs.email.value) {
          email = attrs.email.value;
          context.log('Found email in attributes.email:', email);
        } else if (attrs.emailAddress && attrs.emailAddress.value) {
          email = attrs.emailAddress.value;
          context.log('Found email in attributes.emailAddress:', email);
        }
      }

      // Path 4: Check top-level data fields
      if (!email && body.data) {
        if (body.data.email) {
          email = body.data.email;
          context.log('Found email in data.email:', email);
        }
        if (!email && body.data.userPrincipalName) {
          email = body.data.userPrincipalName;
          context.log('Found email in data.userPrincipalName:', email);
        }
      }

      if (!email) {
        context.log('WARNING: No email found in any known path');
        context.log('Available data keys:', body.data ? Object.keys(body.data) : 'no data');
        if (body.data && body.data.userSignUpInfo) {
          context.log('userSignUpInfo keys:', Object.keys(body.data.userSignUpInfo));
          if (body.data.userSignUpInfo.identities) {
            context.log('identities:', JSON.stringify(body.data.userSignUpInfo.identities));
          }
        }
        
        // If we can't find the email, continue (fail open)
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
                "@odata.type": "microsoft.graph.attributeCollectionStart.continueWithDefaultBehavior"
              }
            ]
          }
        }
      };
    }
  }
});