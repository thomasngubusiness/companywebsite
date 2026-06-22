'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const { sign, setAuthCookie } = require('../middleware/auth');
const captcha = require('./captchaController');
const { sendResetEmail } = require('../api/mailer');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function login(req, res) {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    if (!captcha.verify(captchaId, captchaAnswer)) {
      return res.status(400).json({ success: false, message: 'Captcha incorrect. Please try again.', captcha: true });
    }
    const { rows } = await query('SELECT * FROM admins WHERE email = $1', [String(email).toLowerCase().trim()]);
    const admin = rows[0];
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const role = admin.role || 'admin';
    setAuthCookie(res, sign({ id: admin.id, email: admin.email, role }));
    res.json({ success: true, email: admin.email, role });
  } catch (e) {
    console.error('[auth.login]', e.message);
    res.status(500).json({ success: false, message: 'Sign-in failed. Please try again.' });
  }
}

function logout(_req, res) { res.clearCookie('token'); res.json({ success: true }); }

async function me(req, res) {
  // re-read role from DB so privilege changes take effect without re-login
  try {
    const { rows } = await query('SELECT id, email, role FROM admins WHERE id = $1', [req.admin.id]);
    if (!rows[0]) return res.status(401).json({ success: false });
    res.json({ success: true, admin: rows[0] });
  } catch (e) {
    res.json({ success: true, admin: req.admin });
  }
}

async function updateProfile(req, res) {
  try {
    const { current_password, email, password } = req.body || {};
    const { rows } = await query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = rows[0];
    if (!admin) return res.status(404).json({ success: false, message: 'Account not found.' });
    if (!current_password || !bcrypt.compareSync(current_password, admin.password_hash)) {
      return res.status(403).json({ success: false, message: 'Current password is incorrect.' });
    }
    let newEmail = admin.email;
    if (email && email.toLowerCase().trim() !== admin.email) {
      newEmail = String(email).toLowerCase().trim();
      if (!EMAIL.test(newEmail)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      const dup = await query('SELECT 1 FROM admins WHERE email = $1 AND id <> $2', [newEmail, admin.id]);
      if (dup.rowCount) return res.status(409).json({ success: false, message: 'That email is already in use.' });
    }
    let hash = admin.password_hash;
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      hash = bcrypt.hashSync(password, 12);
    }
    await query('UPDATE admins SET email=$1, password_hash=$2 WHERE id=$3', [newEmail, hash, admin.id]);
    setAuthCookie(res, sign({ id: admin.id, email: newEmail, role: admin.role || 'admin' }));
    res.json({ success: true, email: newEmail });
  } catch (e) {
    console.error('[auth.updateProfile]', e.message);
    res.status(500).json({ success: false, message: 'Could not update your account.' });
  }
}

async function forgot(req, res) {
  // Always responds success to avoid leaking which emails exist.
  try {
    const email = String((req.body && req.body.email) || '').toLowerCase().trim();
    if (EMAIL.test(email)) {
      const { rows } = await query('SELECT id FROM admins WHERE email = $1', [email]);
      if (rows[0]) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await query('DELETE FROM password_resets WHERE admin_id = $1', [rows[0].id]);
        await query('INSERT INTO password_resets (token, admin_id, expires_at) VALUES ($1, $2, $3)', [token, rows[0].id, expires]);
        const origin = process.env.PUBLIC_URL || (req.protocol + '://' + req.get('host'));
        const link = `${origin}/admin/reset.html?token=${token}`;
        sendResetEmail(email, link).catch((e) => console.error('[mailer.reset]', e.message));
      }
    }
    res.json({ success: true, message: 'If that email belongs to an admin, a reset link has been sent.' });
  } catch (e) {
    console.error('[auth.forgot]', e.message);
    res.json({ success: true, message: 'If that email belongs to an admin, a reset link has been sent.' });
  }
}

async function reset(req, res) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'A valid token and a password of at least 8 characters are required.' });
    }
    const { rows } = await query(
      'SELECT pr.admin_id FROM password_resets pr WHERE pr.token = $1 AND pr.expires_at > now()', [token]);
    if (!rows[0]) return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired.' });
    const hash = bcrypt.hashSync(password, 12);
    await query('UPDATE admins SET password_hash=$1 WHERE id=$2', [hash, rows[0].admin_id]);
    await query('DELETE FROM password_resets WHERE admin_id=$1', [rows[0].admin_id]);
    res.json({ success: true });
  } catch (e) {
    console.error('[auth.reset]', e.message);
    res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
}

module.exports = { login, logout, me, updateProfile, forgot, reset };
