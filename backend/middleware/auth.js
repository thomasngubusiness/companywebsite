'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
}

function _cookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = (req.cookies && req.cookies.token) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.admin = decoded;
    // Sliding session: refresh the cookie on every authenticated request so an
    // ACTIVE admin stays logged in, but 15 minutes of inactivity logs them out.
    _cookie(res, sign({ id: decoded.id, email: decoded.email, role: decoded.role || 'admin' }));
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
}

function requireRole(roles) {
  return function (req, res, next) {
    if (!req.admin || roles.indexOf(req.admin.role) === -1) {
      return res.status(403).json({ success: false, message: 'You do not have permission to do that.' });
    }
    next();
  };
}
const requireSuper = requireRole(['super']);

module.exports = { sign, requireAuth, requireRole, requireSuper, setAuthCookie: _cookie };
