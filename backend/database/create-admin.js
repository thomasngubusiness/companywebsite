'use strict';
const bcrypt = require('bcryptjs');
const { init, query, pool } = require('./db');
const config = require('../config');

(async () => {
  try {
    await init();
    const email = (config.admin.email || '').toLowerCase().trim();
    const pass = config.admin.password;
    if (!email || !pass) {
      console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.');
      process.exit(1);
    }
    const hash = bcrypt.hashSync(pass, 12);
    await query(
      `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email, hash]
    );
    console.log('Admin user ready:', email);
    await pool.end();
  } catch (e) {
    console.error('create-admin failed:', e.message);
    process.exit(1);
  }
})();
