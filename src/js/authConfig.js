/**
 * MSAL Authentication Configuration
 * 
 * Configures Microsoft Authentication Library (MSAL.js) 
 * to work with Entra External ID for client portal authentication.
 */

const msalConfig = {
    auth: {
        clientId: "1a68a1d0-660a-486f-b9fa-7f84325a12e6",
        authority: "https://revivemarketingclients.ciamlogin.com/",
        redirectUri: window.location.origin + "/src/login.html",
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

const loginRequest = {
    scopes: ["openid", "profile", "email"],
};