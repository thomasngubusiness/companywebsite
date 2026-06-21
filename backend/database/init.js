'use strict';
const { init, pool } = require('./db');
init()
  .then(() => { console.log('PostgreSQL schema ready.'); return pool.end(); })
  .catch((e) => { console.error('DB init failed:', e.message); process.exit(1); });
