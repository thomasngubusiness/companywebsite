'use strict';
const bcrypt = require('bcryptjs');
const { db, init } = require('./db');
const config = require('../config');
init();
const email = (config.admin.email || '').toLowerCase().trim();
const pass = config.admin.password;
if (!email || !pass) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env'); process.exit(1); }
const hash = bcrypt.hashSync(pass, 12);
db.prepare(`INSERT INTO admins (email, password_hash) VALUES (?, ?)
            ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`).run(email, hash);
console.log('Admin user ready:', email);
