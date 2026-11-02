// Vercel Serverless Function: /api/enquiries
// Handles customer inquiry submissions and admin retrieval/replies
const fs = require('fs');
const path = require('path');

const INQUIRIES_FILE = path.join(process.cwd(), 'data', 'inquiries.json');

const DEFAULT_INQUIRIES = [];

function readInquiries() {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      const data = fs.readFileSync(INQUIRIES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading inquiries:', e);
  }
  return [];
}

function writeInquiries(list) {
  try {
    const dir = path.dirname(INQUIRIES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing inquiries:', e);
    return false;
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET: List enquiries
  if (req.method === 'GET') {
    const list = readInquiries();
    res.status(200).json({ success: true, count: list.length, enquiries: list });
    return;
  }

  // POST: Customer submits an enquiry
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { name, email, phone, subject, message } = body;
      if (!name || !email || !message) {
        res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        return;
      }
      const list = readInquiries();
      const newInquiry = {
        id: `INQ-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        subject: (subject || 'General Inquiry').trim(),
        message: message.trim(),
        status: 'new',
        created_at: new Date().toISOString()
      };
      list.unshift(newInquiry);
      writeInquiries(list);
      res.status(201).json({ success: true, message: 'Enquiry received with thanks!', enquiry: newInquiry });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  // PATCH / PUT: Update status or reply
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const { id, status, admin_notes } = req.body || {};
      const list = readInquiries();
      const found = list.find(x => x.id === id);
      if (!found) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }
      if (status) found.status = status;
      if (admin_notes !== undefined) found.admin_notes = admin_notes;
      writeInquiries(list);
      res.status(200).json({ success: true, enquiry: found });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  // DELETE: Remove enquiry
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || req.body || {};
      let list = readInquiries();
      list = list.filter(x => x.id !== id);
      writeInquiries(list);
      res.status(200).json({ success: true, message: 'Enquiry removed' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
