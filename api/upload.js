// Vercel Serverless Function: /api/upload
// Accepts base64 image data and saves it locally or returns image data URL
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { imageBase64, filename } = req.body || {};
    if (!imageBase64) {
      res.status(400).json({ success: false, message: 'No image data provided' });
      return;
    }

    // Try to save to public/images if disk is writable
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = (filename || `upload-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uploadPath = path.join(process.cwd(), 'public', 'images', safeName);

    try {
      fs.writeFileSync(uploadPath, buffer);
      res.status(200).json({
        success: true,
        url: `/images/${safeName}`,
        message: 'Image uploaded successfully'
      });
      return;
    } catch (diskErr) {
      // In serverless environments where local disk is read-only, return base64 URL directly
      res.status(200).json({
        success: true,
        url: imageBase64,
        message: 'Image stored as data URL'
      });
      return;
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
