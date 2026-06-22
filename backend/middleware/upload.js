'use strict';
/* Strict, defense-in-depth file-upload handling for public enquiry attachments.
 *
 * A file must pass ALL layers:
 *   1. Size limit (10 MB) + single file only (enforced by multer).
 *   2. Extension allowlist (no double extensions, no executables/scripts).
 *   3. Declared MIME-type allowlist.
 *   4. Magic-byte (file signature) check that must MATCH the extension — the key
 *      control: a .pdf that is really a PHP/JSP/EXE reverse shell is rejected.
 *   5. Content scan of the head of the file for script/shell/EXE markers.
 *   6. Saved OUTSIDE the web root with a random name + forced-safe extension, so
 *      it can never be requested or executed as a script.
 */
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Outside ROOT (= company-website) so express.static can never serve it.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'enq_uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { /* ignore */ }

const MAX_BYTES = 10 * 1024 * 1024;

const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);
const isZip = (b) => startsWith(b, [0x50, 0x4b]) && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07); // PK..
const isOle = (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const isPdf = (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]);                 // %PDF
const isPng = (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isJpg = (b) => startsWith(b, [0xff, 0xd8, 0xff]);

const TYPES = {
  pdf:  { mimes: ['application/pdf'], sig: isPdf },
  png:  { mimes: ['image/png'], sig: isPng },
  jpg:  { mimes: ['image/jpeg'], sig: isJpg },
  jpeg: { mimes: ['image/jpeg'], sig: isJpg },
  doc:  { mimes: ['application/msword'], sig: isOle },
  xls:  { mimes: ['application/vnd.ms-excel'], sig: isOle },
  docx: { mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], sig: isZip },
  xlsx: { mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], sig: isZip },
};

function extOf(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}
// Reject sneaky names like "scope.pdf.php", "shell.php.jpg", paths, control chars.
function hasDangerousName(name) {
  const n = String(name || '');
  if (/[/\\\x00-\x1f]/.test(n)) return true;
  const bad = /^(php\d?|phtml|phar|jsp|jspx|asp|aspx|cgi|pl|py|rb|sh|bash|exe|dll|bat|cmd|com|scr|js|mjs|vbs|ps1|htaccess|svg|html?|xhtml)$/i;
  const segs = n.toLowerCase().split('.');
  for (let i = 1; i < segs.length; i++) { if (bad.test(segs[i])) return true; } // any ext segment
  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 40, parts: 60 },
  fileFilter(_req, file, cb) {
    const ext = extOf(file.originalname);
    if (hasDangerousName(file.originalname)) return cb(new Error('FILE_NAME'));
    const t = TYPES[ext];
    if (!t) return cb(new Error('FILE_EXT'));
    if (t.mimes.indexOf(file.mimetype) === -1) return cb(new Error('FILE_MIME'));
    cb(null, true);
  },
}).single('attachment');

// Scan the head of the buffer for script/shell/EXE markers (defense in depth).
function looksMalicious(buf) {
  if (buf[0] === 0x4d && buf[1] === 0x5a) return true;            // MZ = Windows EXE/DLL
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return true; // ELF
  if (buf[0] === 0x23 && buf[1] === 0x21) return true;           // #! shebang
  const head = buf.slice(0, 8192).toString('latin1').toLowerCase();
  return head.indexOf('<?php') !== -1 || head.indexOf('<?=') !== -1 ||
         head.indexOf('<script') !== -1 || head.indexOf('<%') !== -1;
}

// Express middleware: run multer, then magic-byte + content checks, then persist.
function handleUpload(req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      const map = {
        LIMIT_FILE_SIZE: 'Attachment is too large (max 10 MB).',
        FILE_EXT: 'That file type is not allowed. Use PDF, DOC(X), XLS(X), PNG or JPG.',
        FILE_MIME: 'The file type does not match its content.',
        FILE_NAME: 'That file name is not allowed.',
      };
      return res.status(400).json({ success: false, message: map[err.code] || map[err.message] || 'Attachment could not be processed.' });
    }
    if (!req.file) return next(); // attachment is optional

    const ext = extOf(req.file.originalname);
    const t = TYPES[ext];
    const buf = req.file.buffer;
    if (!t || !buf || buf.length < 4 || !t.sig(buf)) {
      return res.status(400).json({ success: false, message: 'The file content does not match a real PDF/Office/image file and was rejected.' });
    }
    if (looksMalicious(buf)) {
      return res.status(400).json({ success: false, message: 'The file was rejected by the security scan.' });
    }
    const safeName = crypto.randomBytes(16).toString('hex') + '.' + ext;
    try {
      fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buf, { mode: 0o600 });
    } catch (e) {
      console.error('[upload.write]', e.message);
      return res.status(500).json({ success: false, message: 'Could not store the attachment.' });
    }
    req.attachment = { stored: safeName, original: req.file.originalname.slice(0, 180), size: buf.length };
    next();
  });
}

module.exports = { handleUpload, UPLOAD_DIR };
