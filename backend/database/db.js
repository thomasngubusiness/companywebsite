'use strict';
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config');

if (!config.databaseUrl) {
  console.warn('[db] DATABASE_URL is not set — the app needs a PostgreSQL connection string.');
}

// Render's INTERNAL database URL (no domain) needs no SSL; the EXTERNAL URL
// (*.render.com) requires SSL. Auto-detect so both work.
const needsSSL = /\.render\.com/i.test(config.databaseUrl) || process.env.PGSSL === 'true';

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
  max: 5,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

async function query(text, params) {
  return pool.query(text, params);
}

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

// Idempotently make sure the admin account exists, using ADMIN_EMAIL /
// ADMIN_PASSWORD. Runs on every startup so the login always works and the
// password can be rotated via env vars + redeploy.
async function ensureAdmin() {
  const email = (config.admin.email || '').toLowerCase().trim();
  const pass = config.admin.password;
  if (!email || !pass) {
    console.warn('[db] ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin seeded.');
    return;
  }
  const hash = bcrypt.hashSync(pass, 12);
  await pool.query(
    `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, hash]
  );
  console.log('[db] admin account ensured:', email);
}

module.exports = { pool, query, init, ensureAdmin };
