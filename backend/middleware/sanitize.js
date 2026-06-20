'use strict';
// Lightweight input sanitization to mitigate stored XSS. Strips angle brackets
// and trims/caps length. DB access uses parameterized queries (SQLi-safe), so we
// preserve spaces and normal punctuation for legitimate names and descriptions.
function clean(v) {
  if (typeof v !== 'string') return v;
  return v.replace(/[<>]/g, '').trim().slice(0, 5000);
}
function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const k of Object.keys(req.body)) req.body[k] = clean(req.body[k]);
  }
  next();
}
module.exports = { clean, sanitizeBody };
