'use strict';
const config = require('../config');

// Public info for the login page: which captcha provider + the site key.
function info(_req, res) {
  res.json({
    success: true,
    provider: config.recaptcha.secret && config.recaptcha.siteKey ? 'recaptcha' : 'none',
    siteKey: config.recaptcha.siteKey || '',
  });
}

// Verify a reCAPTCHA token with Google. If not configured, captcha is skipped
// (so the login never locks out before you've set the keys).
async function verify(token, ip) {
  if (!config.recaptcha.secret) return true;
  if (!token) return false;
  try {
    const params = new URLSearchParams();
    params.append('secret', config.recaptcha.secret);
    params.append('response', token);
    if (ip) params.append('remoteip', ip);
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const d = await r.json();
    return !!(d && d.success);
  } catch (e) {
    console.error('[captcha.verify]', e.message);
    return false;
  }
}

module.exports = { info, verify };
