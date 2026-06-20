'use strict';
const bcrypt = require('bcryptjs');
const { db } = require('../database/db');
const { sign } = require('../middleware/auth');

function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(String(email).toLowerCase().trim());
  // Constant-ish failure path to reduce user enumeration
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
  const token = sign({ id: admin.id, email: admin.email });
  res.cookie('token', token, {
    httpOnly: true, sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', maxAge: 8 * 3600 * 1000,
  });
  res.json({ success: true, token, email: admin.email });
}
function logout(_req, res) { res.clearCookie('token'); res.json({ success: true }); }
function me(req, res) { res.json({ success: true, admin: req.admin }); }
module.exports = { login, logout, me };
