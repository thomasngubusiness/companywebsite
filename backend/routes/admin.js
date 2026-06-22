'use strict';
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const c = require('../controllers/enquiryController');
const content = require('../controllers/contentController');
const admins = require('../controllers/adminUsersController');
const { requireAuth } = require('../middleware/auth');
const { verifyToken, issueToken } = require('../middleware/csrf');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });

router.get('/csrf', issueToken, (_req, res) => res.json({ success: true, csrf: res.locals.csrf }));
router.post('/login', loginLimiter, auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

// Protected admin data
router.get('/enquiries', requireAuth, c.list);
router.get('/enquiries/export', requireAuth, c.exportCsv);
router.get('/stats', requireAuth, c.stats);
router.patch('/enquiries/:id/status', requireAuth, verifyToken, c.updateStatus);
router.delete('/enquiries/:id', requireAuth, verifyToken, c.remove);
router.put('/content/:key', requireAuth, verifyToken, content.update);
router.get('/admins', requireAuth, admins.list);
router.post('/admins', requireAuth, verifyToken, admins.create);
router.patch('/admins/:id/password', requireAuth, verifyToken, admins.resetPassword);
router.delete('/admins/:id', requireAuth, verifyToken, admins.remove);
module.exports = router;
