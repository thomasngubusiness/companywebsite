/* Admin portal client — talks to /api/admin */
window.ADMIN = (function () {
  'use strict';
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.apiBase || '/api') + '/admin';
  function req(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    opts.credentials = 'include';
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { location.href = 'login.html'; throw new Error('unauth'); }
        return { ok: r.ok, body: j };
      });
    });
  }
  function csrf() { return req('/csrf').then(function (r) { return r.body.csrf; }); }
  function guard() { return req('/me').then(function (r) { if (!r.ok) location.href = 'login.html'; return r.body.admin; }); }
  function logout() { req('/logout', { method: 'POST' }).finally(function () { location.href = 'login.html'; }); }
  return { req: req, csrf: csrf, guard: guard, logout: logout, API: API };
})();
