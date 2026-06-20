'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
}
function requireAuth(req, res, next) {
  const token = (req.cookies && req.cookies.token) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
}
module.exports = { sign, requireAuth };
