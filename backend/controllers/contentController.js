'use strict';
const { query } = require('../database/db');

// Sections the admin may edit. Anything else is rejected.
const KEYS = ['about_team', 'insights', 'careers', 'partners', 'contact'];

async function getAll(_req, res) {
  try {
    const { rows } = await query('SELECT key, data FROM site_content');
    const out = {};
    rows.forEach((r) => { out[r.key] = r.data; });
    res.json({ success: true, content: out });
  } catch (e) {
    console.error('[content.getAll]', e.message);
    res.status(500).json({ success: false, message: 'Failed to load content.' });
  }
}

async function update(req, res) {
  try {
    const key = req.params.key;
    if (!KEYS.includes(key)) return res.status(400).json({ success: false, message: 'Unknown content section.' });
    let data = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'data')) ? req.body.data : req.body;
    if (data === undefined || data === null) data = {};
    await query(
      `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [key, JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[content.update]', e.message);
    res.status(500).json({ success: false, message: 'Failed to save content.' });
  }
}

module.exports = { getAll, update, KEYS };
