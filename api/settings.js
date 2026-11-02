// Vercel Serverless Function: /api/settings
// Manages website text content, contact details, social links & quotes
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS = {
  announcement: '✨ Discounts available sometimes for newsletter subscribers!',
  heroHeadline: 'Handmade Knot with Love',
  heroSubheadline: 'Borse fatte a mano all\'uncinetto. Knot-by-knot handcrafted bags & heirloom clothes directly for your everyday rhythm.',
  phone: '3319565982',
  email: 'fabianojessica6@gmail.com',
  hours: 'Open 24/7, 6 days a week, 365 days a year',
  instagram: '@knotyourbag',
  whatsapp: '3319565982',
  aboutQuote: 'È un marchio che rappresenta un negozio di borse fatte a mano all\'uncinetto. L\'ho scelto perché secondo me è un bel marchio che riesce a far capire cosa vende l\'artigiano ovvero il gomitolo e l\'uncinetto.',
  aboutQuote2: 'Inoltre ritengo che l\'artigianato sia un ottimo settore poco conosciuto su cui costruire qualcosa.',
  aboutAuthor: 'Jessica Fabiano'
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

function writeSettings(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing settings:', e);
    return false;
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET: Read current website settings
  if (req.method === 'GET') {
    const settings = readSettings();
    res.status(200).json({ success: true, settings });
    return;
  }

  // POST / PUT: Update website settings from Admin Dashboard
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const updates = req.body || {};
      const current = readSettings();
      const merged = { ...current, ...updates };
      writeSettings(merged);
      res.status(200).json({ success: true, settings: merged });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
