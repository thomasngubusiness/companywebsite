'use strict';
/* Adaptive abuse detection: per-IP sliding-window counters.
 *
 * Used so that Google reCAPTCHA stays HIDDEN for normal visitors and is only
 * required once an IP looks like a brute-force / spam source (too many failed
 * logins, or too many form submissions, within the window).
 */
const WINDOW_MS = 15 * 60 * 1000;            // 15-minute rolling window
const THRESHOLDS = { login: 3, enquiry: 3, contact: 3, partner: 4, application: 4 };
const buckets = new Map();                    // "ctx|ip" -> number[] (timestamps)

function keyFor(ctx, ip) { return ctx + '|' + (ip || '?'); }
function prune(arr, now) {
  let i = 0;
  while (i < arr.length && now - arr[i] >= WINDOW_MS) i++;
  return i ? arr.slice(i) : arr;
}
function threshold(ctx) { return THRESHOLDS[ctx] || 3; }

// Count of recent events for this ctx+ip.
function attempts(ctx, ip) {
  const now = Date.now();
  const k = keyFor(ctx, ip);
  const a = prune(buckets.get(k) || [], now);
  buckets.set(k, a);
  return a.length;
}
// Record one event; returns the new count.
function record(ctx, ip) {
  const now = Date.now();
  const k = keyFor(ctx, ip);
  const a = prune(buckets.get(k) || [], now);
  a.push(now);
  buckets.set(k, a);
  return a.length;
}
// Has this ctx+ip crossed the threshold (=> require captcha)?
function suspicious(ctx, ip) { return attempts(ctx, ip) >= threshold(ctx); }
function clear(ctx, ip) { buckets.delete(keyFor(ctx, ip)); }

// Periodic cleanup so the map can't grow unbounded.
const t = setInterval(() => {
  const now = Date.now();
  for (const [k, a] of buckets) {
    const p = prune(a, now);
    if (!p.length) buckets.delete(k); else buckets.set(k, p);
  }
}, WINDOW_MS);
if (t.unref) t.unref();

module.exports = { record, attempts, suspicious, clear, threshold, WINDOW_MS };
