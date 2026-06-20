'use strict';
// Double-submit cookie CSRF protection for admin state-changing routes.
const crypto = require('crypto');

function issueToken(req, res, next) {
  let token = req.cookies && req.cookies.csrf;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf', token, { sameSite: 'strict', httpOnly: false, secure: process.env.NODE_ENV === 'production' });
  }
  res.locals.csrf = token;
  next();
}
function verifyToken(req, res, next) {
  const cookie = req.cookies && req.cookies.csrf;
  const header = req.headers['x-csrf-token'];
  if (!cookie || !header || cookie !== header) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
  }
  next();
}
module.exports = { issueToken, verifyToken };
