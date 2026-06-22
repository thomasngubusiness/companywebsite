'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { init, ensureAdmin } = require('./database/db');
const logger = require('./middleware/logger');

// schema is initialised before the server starts listening (see bottom)

const app = express();
app.set('trust proxy', 1);

// ── Security headers (CSP tuned for the static site assets) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", "https:"],
      frameAncestors: ["'none'"],
      frameSrc: ["https://www.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(logger);

// ── API ──
app.use('/api', require('./routes/enquiries'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/content', require('./controllers/contentController').getAll);
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

// ── Serve the static website + admin (single-deployment convenience) ──
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, { extensions: ['html'] }));

// 404 for unknown API routes (never serve the SPA shell for /api/*)
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

init()
  .then(() => ensureAdmin())
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[Company] Security API + site running on http://localhost:${config.port} (${config.env})`);
    });
  })
  .catch((err) => {
    console.error('Startup failed — could not initialise the database:', err.message);
    process.exit(1);
  });
