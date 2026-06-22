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

async function requireAuth(req, res, next) {
  const token = (req.cookies && req.cookies.token) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
  // Authorize against the LIVE role/email in the database, not the token, so
  // role changes (and account deletion) take effect immediately for everyone.
  let id = decoded.id, email = decoded.email, role = decoded.role || 'admin';
  try {
    const { query } = require('../database/db');
    const { rows } = await query('SELECT email, role FROM admins WHERE id = $1', [id]);
    if (!rows[0]) return res.status(401).json({ success: false, message: 'Account no longer exists.' });
    email = rows[0].email; role = rows[0].role || 'admin';
  } catch (e) {
    console.error('[auth.requireAuth] role lookup failed:', e.message); // fall back to token claims
  }
  req.admin = { id: id, email: email, role: role };
  // Sliding session: refresh the cookie (15m) on every authenticated request.
  _cookie(res, sign({ id: id, email: email, role: role }));
  next();
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
