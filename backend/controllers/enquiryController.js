'use strict';
const crypto = require('crypto');
const { db } = require('../database/db');
const { sendEnquiryEmails } = require('../api/mailer');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUSES = ['New', 'Contacted', 'In Progress', 'Proposal Sent', 'Closed'];

function makeRef() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${('0'+(d.getMonth()+1)).slice(-2)}${('0'+d.getDate()).slice(-2)}`;
  return `ENQ-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function create(req, res) {
  const b = req.body || {};
  if (!b.full_name || !b.email || !EMAIL.test(b.email)) {
    return res.status(400).json({ success: false, message: 'Name and a valid email are required.' });
  }
  const reference = makeRef();
  const source = (req.params.kind) || b.source || 'enquiry';
  const stmt = db.prepare(`INSERT INTO enquiries
    (reference, full_name, company_name, email, phone, country, industry, company_size,
     service, contact_method, meeting_date, budget, timeline, project_description, source, ip, status)
    VALUES (@reference,@full_name,@company_name,@email,@phone,@country,@industry,@company_size,
     @service,@contact_method,@meeting_date,@budget,@timeline,@project_description,@source,@ip,'New')`);
  const row = {
    reference, full_name: b.full_name, company_name: b.company_name || null, email: b.email,
    phone: b.phone || null, country: b.country || null, industry: b.industry || null,
    company_size: b.company_size || null, service: b.service || null, contact_method: b.contact_method || null,
    meeting_date: b.meeting_date || null, budget: b.budget || null, timeline: b.timeline || null,
    project_description: b.project_description || b.subject || null, source, ip: req.ip,
  };
  const info = stmt.run(row);
  const saved = db.prepare('SELECT * FROM enquiries WHERE enquiry_id = ?').get(info.lastInsertRowid);
  sendEnquiryEmails(saved).catch(e => console.error('[mailer]', e.message));
  return res.status(201).json({ success: true, reference, message: 'Enquiry received.' });
}

function list(req, res) {
  const { status, q, sort } = req.query;
  let sql = 'SELECT * FROM enquiries';
  const where = [], args = [];
  if (status && STATUSES.includes(status)) { where.push('status = ?'); args.push(status); }
  if (q) { where.push('(full_name LIKE ? OR company_name LIKE ? OR email LIKE ? OR service LIKE ?)');
    const like = `%${q}%`; args.push(like, like, like, like); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...args);
  res.json({ success: true, count: rows.length, enquiries: rows });
}

function stats(_req, res) {
  const total = db.prepare('SELECT COUNT(*) n FROM enquiries').get().n;
  const byStatus = {};
  STATUSES.forEach(s => { byStatus[s] = db.prepare('SELECT COUNT(*) n FROM enquiries WHERE status=?').get(s).n; });
  const byService = db.prepare('SELECT service, COUNT(*) n FROM enquiries GROUP BY service ORDER BY n DESC').all();
  const closed = byStatus['Closed'] || 0;
  const conversion = total ? Math.round((closed / total) * 100) : 0;
  res.json({ success: true, total, new: byStatus['New'] || 0, byStatus, byService, conversion });
}

function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
  const info = db.prepare('UPDATE enquiries SET status=? WHERE enquiry_id=?').run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true });
}

function remove(req, res) {
  const info = db.prepare('DELETE FROM enquiries WHERE enquiry_id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true });
}

function exportCsv(_req, res) {
  const rows = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
  const cols = ['enquiry_id','reference','created_at','full_name','company_name','email','phone',
    'country','industry','company_size','service','contact_method','meeting_date','budget','timeline','status'];
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="enquiries.csv"');
  res.send(csv);
}
module.exports = { create, list, stats, updateStatus, remove, exportCsv, STATUSES };
