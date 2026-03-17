/**
 * Auth Guard
 * Must be loaded before page content renders.
 * Redirects unauthenticated users to the login page by checking for a valid
 * MSAL session in sessionStorage (cacheLocation: "sessionStorage").
 */
(function () {
  'use strict';

  var CLIENT_ID = '1a68a1d0-660a-486f-b9fa-7f84325a12e6';
  var LOGIN_PAGE = '/login.html';

  function isAuthenticated() {
    try {
      if (sessionStorage.getItem('portalUser')) return true;
      var keys = Object.keys(sessionStorage);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(CLIENT_ID) !== -1) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  if (!isAuthenticated()) {
    window.location.replace(LOGIN_PAGE);
  }
}());
