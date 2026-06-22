'use strict';
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/enquiryController');
const { sanitizeBody } = require('../middleware/sanitize');
const { handleUpload } = require('../middleware/upload');

// Strict limit on public submissions to deter spam/abuse.
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' } });

// Public submission endpoints (enquiry / contact / partners / applications all map here)
router.post('/enquiries', submitLimiter, handleUpload, sanitizeBody, c.create);
router.post('/contact',   submitLimiter, sanitizeBody, (req, res) => { req.params.kind = 'contact'; c.create(req, res); });
router.post('/partners',  submitLimiter, sanitizeBody, (req, res) => { req.params.kind = 'partner'; c.create(req, res); });
router.post('/applications', submitLimiter, sanitizeBody, (req, res) => { req.params.kind = 'application'; c.create(req, res); });
module.exports = router;
