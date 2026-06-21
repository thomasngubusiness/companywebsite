'use strict';
const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const { sign } = require('../middleware/auth');

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const { rows } = await query('SELECT * FROM admins WHERE email = $1', [String(email).toLowerCase().trim()]);
    const admin = rows[0];
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const token = sign({ id: admin.id, email: admin.email });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 3600 * 1000,
    });
    res.json({ success: true, token, email: admin.email });
  } catch (e) {
    console.error('[auth.login]', e.message);
    res.status(500).json({ success: false, message: 'Sign-in failed. Please try again.' });
  }
}

function logout(_req, res) { res.clearCookie('token'); res.json({ success: true }); }
function me(req, res) { res.json({ success: true, admin: req.admin }); }

module.exports = { login, logout, me };
