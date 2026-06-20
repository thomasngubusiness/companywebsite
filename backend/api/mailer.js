'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  if (!config.mail.host) return null; // email not configured — skip gracefully
  transporter = nodemailer.createTransport({
    host: config.mail.host, port: config.mail.port, secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
  });
  return transporter;
}

function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

async function sendEnquiryEmails(enquiry) {
  const t = getTransport();
  if (!t) { console.warn('[mailer] SMTP not configured — skipping emails'); return false; }
  const rows = Object.entries({
    Reference: enquiry.reference, Name: enquiry.full_name, Company: enquiry.company_name,
    Email: enquiry.email, Phone: enquiry.phone, Country: enquiry.country, Industry: enquiry.industry,
    'Company size': enquiry.company_size, Service: enquiry.service, 'Contact method': enquiry.contact_method,
    'Meeting date': enquiry.meeting_date, Budget: enquiry.budget, Timeline: enquiry.timeline,
    Submitted: enquiry.created_at,
  }).filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 12px;color:#888">${esc(k)}</td><td style="padding:6px 12px"><b>${esc(v)}</b></td></tr>`).join('');

  // Admin notification
  await t.sendMail({
    from: config.mail.from, to: config.mail.admin,
    subject: `New enquiry ${enquiry.reference} — ${enquiry.service || 'General'}`,
    html: `<h2>New security enquiry</h2><table>${rows}</table>
           <p style="margin-top:12px"><b>Project description</b><br>${esc(enquiry.project_description)}</p>`,
  });

  // Customer confirmation
  await t.sendMail({
    from: config.mail.from, to: enquiry.email,
    subject: `We received your request — ${enquiry.reference}`,
    html: `<h2>Thank you, ${esc(enquiry.full_name)}.</h2>
           <p>We've received your request for <b>${esc(enquiry.service || 'a consultation')}</b>.</p>
           <p>Your reference number is <b>${esc(enquiry.reference)}</b>. Our consultants will respond within <b>one business day</b>.</p>
           <p>If it's urgent, call our 24/7 line at +60 3-1234 5678.</p>
           <p>— [Company] Security</p>`,
  });
  return true;
}
module.exports = { sendEnquiryEmails };
