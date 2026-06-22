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
        // Only bounce to the login page when a PROTECTED call is unauthorized.
        // A failed /login must NOT redirect — the page needs to show the error.
        if (r.status === 401 && path.indexOf('/login') !== 0) {
          location.href = 'login.html';
          throw new Error('unauth');
        }
        return { ok: r.ok, body: j };
      });
    });
  }
  function csrf() { return req('/csrf').then(function (r) { return r.body.csrf; }); }
  function applyRoleUI(a) {
    var role = (a && a.role) || 'sales';
    document.body.setAttribute('data-role', role);
    function hide(href){ document.querySelectorAll('.admin-nav a[href="'+href+'"]').forEach(function(el){ el.style.display='none'; }); }
    if (role === 'sales') { hide('content.html'); hide('admins.html'); }
    else if (role === 'admin') { hide('admins.html'); }
    // page-level access guard
    var page = (location.pathname.split('/').pop() || '');
    if (page === 'content.html' && !(role === 'admin' || role === 'super')) location.href = 'dashboard.html';
    if (page === 'admins.html' && role !== 'super') location.href = 'dashboard.html';
  }
  function guard() {
    return req('/me').then(function (r) {
      if (!r.ok) { location.href = 'login.html'; return null; }
      applyRoleUI(r.body.admin);
      return r.body.admin;
    });
  }
  function logout() { req('/logout', { method: 'POST' }).finally(function () { location.href = 'login.html'; }); }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'admin-toast ' + (kind === 'bad' ? 'bad' : 'ok');
    t.textContent = (kind === 'bad' ? '⚠  ' : '✓  ') + msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, 2800);
  }
  return { req: req, csrf: csrf, guard: guard, logout: logout, toast: toast, API: API };
})();

/* 15-minute idle auto-logout. The server also enforces this (sliding 15m JWT),
   this just redirects the UI promptly when the admin walks away. */
(function () {
  var IDLE_MS = 15 * 60 * 1000, timer;
  function out() { try { window.ADMIN && window.ADMIN.logout(); } catch (e) { location.href = 'login.html?timeout=1'; } }
  function reset() { clearTimeout(timer); timer = setTimeout(out, IDLE_MS); }
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, reset, { passive: true });
  });
  reset();
})();
