/* Shared reCAPTCHA helper. The widget is rendered ON DEMAND — only when the
   server tells the client a challenge is required (adaptive / anti-brute-force).
   Normal visitors never see it. */
window.SiteCaptcha = (function () {
  'use strict';
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.apiBase || '/api') + '/admin';
  var cfg = null, cfgPromise = null, scriptPromise = null, widgets = {};

  function config() {
    if (cfgPromise) return cfgPromise;
    cfgPromise = fetch(API + '/captcha')
      .then(function (r) { return r.json(); })
      .then(function (d) { cfg = d || { provider: 'none' }; return cfg; })
      .catch(function () { cfg = { provider: 'none' }; return cfg; });
    return cfgPromise;
  }
  function loadScript() {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise(function (resolve) {
      if (window.grecaptcha && window.grecaptcha.render) return resolve();
      window.__siteCaptchaReady = function () { resolve(); };
      var s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?onload=__siteCaptchaReady&render=explicit';
      s.async = true; s.defer = true; document.head.appendChild(s);
    });
    return scriptPromise;
  }
  // Reveal + render the widget in holderId. Resolves true if a widget is shown.
  function show(holderId) {
    return config().then(function (d) {
      if (!d || d.provider !== 'recaptcha' || !d.siteKey) return false;
      var holder = document.getElementById(holderId);
      if (!holder) return false;
      holder.style.display = '';
      if (widgets[holderId] != null) { try { grecaptcha.reset(widgets[holderId]); } catch (e) {} return true; }
      return loadScript().then(function () {
        var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        try { widgets[holderId] = grecaptcha.render(holderId, { sitekey: d.siteKey, theme: theme }); } catch (e) {}
        return true;
      });
    });
  }
  function isShown(holderId) { return widgets[holderId] != null; }
  function token(holderId) { try { return grecaptcha.getResponse(widgets[holderId]); } catch (e) { return ''; } }
  function reset(holderId) { try { grecaptcha.reset(widgets[holderId]); } catch (e) {} }
  return { config: config, show: show, isShown: isShown, token: token, reset: reset };
})();
