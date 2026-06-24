'use strict';
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config');

if (!config.databaseUrl) {
  console.warn('[db] DATABASE_URL is not set — the app needs a PostgreSQL connection string.');
}

// Managed Postgres (Neon, Render external, Supabase, Aiven, etc.) requires SSL;
// local development does not. Enable SSL for any remote host, disable for
// localhost. Override either way with PGSSL=true / PGSSL=false.
const _dbUrl = config.databaseUrl || '';
const _isLocal = /(@|\/\/)(localhost|127\.0\.0\.1|\[?::1\]?)/i.test(_dbUrl);
const needsSSL =
  process.env.PGSSL === 'true' ||
  /sslmode=require/i.test(_dbUrl) ||
  (process.env.PGSSL !== 'false' && !!_dbUrl && !_isLocal);

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
    `INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, 'super')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super'`,
    [email, hash]
  );
  console.log('[db] super admin ensured:', email);

  // Optional: seed additional admins from ADMIN_USERS = "email:pass,email2:pass2"
  const extra = process.env.ADMIN_USERS || '';
  for (const pair of extra.split(/[,\n]/)) {
    const ix = pair.indexOf(':');
    if (ix < 1) continue;
    const e = pair.slice(0, ix).toLowerCase().trim();
    const p = pair.slice(ix + 1).trim();
    if (!e || !p) continue;
    const h = bcrypt.hashSync(p, 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, 'super')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super'`, [e, h]);
    console.log('[db] extra super admin ensured:', e);
  }
}

module.exports = { pool, query, init, ensureAdmin };
