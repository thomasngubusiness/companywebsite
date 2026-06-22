'use strict';
const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function list(_req, res) {
  try {
    const { rows } = await query('SELECT id, email, role, created_at FROM admins ORDER BY created_at ASC');
    res.json({ success: true, admins: rows });
  } catch (e) {
    console.error('[admins.list]', e.message);
    res.status(500).json({ success: false, message: 'Failed to load admins.' });
  }
}

async function create(req, res) {
  try {
    const email = String((req.body && req.body.email) || '').toLowerCase().trim();
    const password = (req.body && req.body.password) || '';
    if (!EMAIL.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    const hash = bcrypt.hashSync(password, 12);
    try {
      await query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
    } catch (e) {
      if (/duplicate|unique/i.test(e.message)) return res.status(409).json({ success: false, message: 'That email is already an admin.' });
      throw e;
    }
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('[admins.create]', e.message);
    res.status(500).json({ success: false, message: 'Failed to create admin.' });
  }
}

async function resetPassword(req, res) {
  try {
    const password = (req.body && req.body.password) || '';
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    const hash = bcrypt.hashSync(password, 12);
    const r = await query('UPDATE admins SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('[admins.reset]', e.message);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
}

async function remove(req, res) {
  try {
    const total = (await query('SELECT COUNT(*)::int AS n FROM admins')).rows[0].n;
    if (total <= 1) return res.status(400).json({ success: false, message: 'Cannot delete the last admin.' });
    const r = await query('DELETE FROM admins WHERE id=$1', [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('[admins.remove]', e.message);
    res.status(500).json({ success: false, message: 'Failed to delete admin.' });
  }
}

module.exports = { list, create, resetPassword, remove };
