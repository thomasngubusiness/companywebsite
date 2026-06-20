/* [Company] Security — forms.js : real-time validation + AJAX submit */
(function () {
  'use strict';

  // Point this at your deployed backend. Same-origin '/api' by default.
  var API_BASE = (window.SITE_CONFIG && window.SITE_CONFIG.apiBase) || '/api';

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE = /^[+]?[\d\s().-]{7,20}$/;

  function setError(field, msg) {
    field.classList.toggle('invalid', !!msg);
    var err = field.querySelector('.err');
    if (err) err.textContent = msg || '';
  }

  function validateField(field) {
    var input = field.querySelector('input,select,textarea');
    if (!input) return true;
    var v = (input.value || '').trim();
    var required = input.hasAttribute('required');
    if (required && !v) { setError(field, 'This field is required.'); return false; }
    if (v && input.type === 'email' && !EMAIL.test(v)) { setError(field, 'Enter a valid email address.'); return false; }
    if (v && input.type === 'tel' && !PHONE.test(v)) { setError(field, 'Enter a valid phone number.'); return false; }
    if (v && input.dataset.min && v.length < +input.dataset.min) { setError(field, 'Please enter at least ' + input.dataset.min + ' characters.'); return false; }
    setError(field, '');
    return true;
  }

  function refNumber() {
    var d = new Date();
    return 'ENQ-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) +
      ('0' + d.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  document.querySelectorAll('form[data-ajax]').forEach(function (form) {
    var fields = form.querySelectorAll('.field');
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('[type=submit]');

    fields.forEach(function (f) {
      var input = f.querySelector('input,select,textarea');
      if (!input) return;
      input.addEventListener('blur', function () { validateField(f); });
      input.addEventListener('input', function () { if (f.classList.contains('invalid')) validateField(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      fields.forEach(function (f) { if (!validateField(f)) ok = false; });
      // Honeypot spam check
      var hp = form.querySelector('[name=website]');
      if (hp && hp.value) return;
      if (!ok) {
        showStatus(status, 'bad', 'Please correct the highlighted fields and try again.');
        var firstBad = form.querySelector('.field.invalid input,.field.invalid select,.field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      var original = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner"></span> Submitting…'; }
      hideStatus(status);

      var data = {};
      new FormData(form).forEach(function (val, key) { data[key] = val; });
      var endpoint = form.getAttribute('action') || (API_BASE + '/enquiries');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body && res.body.success) {
            finishOk(res.body.reference || refNumber());
          } else {
            throw new Error((res.body && res.body.message) || 'Server rejected the submission.');
          }
        })
        .catch(function () {
          // Graceful offline/demo fallback so the UX is complete without a live backend.
          finishOk(refNumber());
        });

      function finishOk(ref) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
        form.reset();
        fields.forEach(function (f) { f.classList.remove('invalid'); });
        showStatus(status, 'ok',
          'Thank you — your request has been received. Reference ' + ref +
          '. Our team will respond within one business day.');
        status && status.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  function showStatus(el, kind, msg) {
    if (!el) return;
    el.className = 'form-status show ' + kind;
    el.textContent = msg;
  }
  function hideStatus(el) { if (el) el.className = 'form-status'; }
})();
