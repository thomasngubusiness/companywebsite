'use strict';
const { init } = require('./db');
init();
console.log('Database initialized at', require('../config').dbPath);
