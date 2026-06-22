'use strict';
const crypto = require('crypto');
const DISABLED = process.env.CAPTCHA_DISABLED === 'true';
const store = new Map(); // id -> { answer, expires }

function gc() {
  const now = Date.now();
  for (const [k, v] of store) if (v.expires < now) store.delete(k);
}

function issue(_req, res) {
  gc();
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const id = crypto.randomBytes(12).toString('hex');
  store.set(id, { answer: String(a + b), expires: Date.now() + 5 * 60 * 1000 });
  res.json({ success: true, id, question: `${a} + ${b} = ?`, disabled: DISABLED });
}

// One-time verification. Returns true if disabled or correct.
function verify(id, answer) {
  if (DISABLED) return true;
  if (!id) return false;
  const e = store.get(id);
  if (!e) return false;
  store.delete(id);
  if (e.expires < Date.now()) return false;
  return String(answer == null ? '' : answer).trim() === e.answer;
}

module.exports = { issue, verify, DISABLED };
