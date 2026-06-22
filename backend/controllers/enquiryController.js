'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { query } = require('../database/db');
const { sendEnquiryEmails } = require('../api/mailer');
const captcha = require('./captchaController');
const risk = require('../middleware/riskGuard');
const { UPLOAD_DIR } = require('../middleware/upload');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUSES = ['New', 'Contacted', 'In Progress', 'Proposal Sent', 'Closed'];

function makeRef() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)}`;
  return `ENQ-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function create(req, res) {
  try {
    const b = req.body || {};
    if (!b.full_name || !b.email || !EMAIL.test(b.email)) {
      return res.status(400).json({ success: false, message: 'Name and a valid email are required.' });
    }
    const source = req.params.kind || b.source || 'enquiry';
    const ip = req.ip;
    // Adaptive captcha: hidden for normal users, required only once this IP is
    // submitting suspiciously often (likely spam/abuse).
    if (risk.suspicious(source, ip)) {
      const ok = await captcha.verify(b.captchaToken || b['g-recaptcha-response'], ip);
      if (!ok) {
        return res.status(400).json({ success: false, captchaRequired: true,
          message: 'Please complete the verification and submit again.' });
      }
    }
    risk.record(source, ip);
    const reference = makeRef();
    const att = req.attachment || null;
    const sql = `INSERT INTO enquiries
      (reference, full_name, company_name, email, phone, country, industry, company_size,
       service, contact_method, meeting_date, budget, timeline, project_description, source, ip,
       attachment_stored, attachment_name, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'New')
      RETURNING *`;
    const vals = [
      reference, b.full_name, b.company_name || null, b.email, b.phone || null, b.country || null,
      b.industry || null, b.company_size || null, b.service || null, b.contact_method || null,
      b.meeting_date || null, b.budget || null, b.timeline || null,
      b.project_description || b.subject || null, source, req.ip,
      att ? att.stored : null, att ? att.original : null,
    ];
    const { rows } = await query(sql, vals);
    const saved = rows[0];
    sendEnquiryEmails(saved).catch((e) => console.error('[mailer]', e.message));
    return res.status(201).json({ success: true, reference, message: 'Enquiry received.', captchaRequired: risk.suspicious(source, ip) });
  } catch (e) {
    console.error('[enquiry.create]', e.message);
    return res.status(500).json({ success: false, message: 'Could not save your enquiry. Please try again.' });
  }
}

async function list(req, res) {
  try {
    const { status, q, sort } = req.query;
    const where = [], args = [];
    if (status && STATUSES.includes(status)) { args.push(status); where.push(`status = $${args.length}`); }
    if (q) {
      args.push(`%${q}%`);
      const i = args.length;
      where.push(`(full_name ILIKE $${i} OR company_name ILIKE $${i} OR email ILIKE $${i} OR service ILIKE $${i})`);
    }
    let sql = 'SELECT * FROM enquiries';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';
    const { rows } = await query(sql, args);
    res.json({ success: true, count: rows.length, enquiries: rows });
  } catch (e) {
    console.error('[enquiry.list]', e.message);
    res.status(500).json({ success: false, message: 'Failed to load enquiries.' });
  }
}

async function stats(_req, res) {
  try {
    const total = (await query('SELECT COUNT(*)::int AS n FROM enquiries')).rows[0].n;
    const statusRows = (await query('SELECT status, COUNT(*)::int AS n FROM enquiries GROUP BY status')).rows;
    const byStatus = {};
    STATUSES.forEach((s) => { byStatus[s] = 0; });
    statusRows.forEach((r) => { byStatus[r.status] = r.n; });
    const byService = (await query(
      'SELECT service, COUNT(*)::int AS n FROM enquiries GROUP BY service ORDER BY n DESC')).rows;
    const closed = byStatus['Closed'] || 0;
    const conversion = total ? Math.round((closed / total) * 100) : 0;
    res.json({ success: true, total, new: byStatus['New'] || 0, byStatus, byService, conversion });
  } catch (e) {
    console.error('[enquiry.stats]', e.message);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const r = await query('UPDATE enquiries SET status=$1 WHERE enquiry_id=$2', [status, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('[enquiry.updateStatus]', e.message);
    res.status(500).json({ success: false, message: 'Failed to update.' });
  }
}

async function remove(req, res) {
  try {
    const r = await query('DELETE FROM enquiries WHERE enquiry_id=$1', [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('[enquiry.remove]', e.message);
    res.status(500).json({ success: false, message: 'Failed to delete.' });
  }
}

async function exportCsv(_req, res) {
  try {
    const { rows } = await query('SELECT * FROM enquiries ORDER BY created_at DESC');
    const cols = ['enquiry_id', 'reference', 'created_at', 'full_name', 'company_name', 'email', 'phone',
      'country', 'industry', 'company_size', 'service', 'contact_method', 'meeting_date', 'budget', 'timeline', 'status'];
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = [cols.join(',')].concat(rows.map((r) => cols.map((c) => esc(r[c])).join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="enquiries.csv"');
    res.send(csv);
  } catch (e) {
    console.error('[enquiry.exportCsv]', e.message);
    res.status(500).json({ success: false, message: 'Failed to export.' });
  }
}

async function downloadAttachment(req, res) {
  try {
    const row = (await query('SELECT attachment_stored, attachment_name FROM enquiries WHERE enquiry_id=$1', [req.params.id])).rows[0];
    if (!row || !row.attachment_stored) return res.status(404).json({ success: false, message: 'No attachment.' });
    // Guard against any path traversal — only ever a bare random filename.
    const safe = path.basename(row.attachment_stored);
    const full = path.join(UPLOAD_DIR, safe);
    if (!full.startsWith(path.resolve(UPLOAD_DIR)) || !fs.existsSync(full)) {
      return res.status(404).json({ success: false, message: 'File no longer available.' });
    }
    const dl = (row.attachment_name || safe).replace(/[\r\n"]/g, '');
    res.setHeader('Content-Type', 'application/octet-stream'); // never serve inline / never execute
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment; filename="' + dl + '"');
    fs.createReadStream(full).pipe(res);
  } catch (e) {
    console.error('[enquiry.downloadAttachment]', e.message);
    res.status(500).json({ success: false, message: 'Failed to fetch attachment.' });
  }
}

module.exports = { create, list, stats, updateStatus, remove, exportCsv, downloadAttachment, STATUSES };
