const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Read & Write JSON Helpers
function readJson(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading JSON from', file, err);
  }
  return fallback;
}

function writeJson(file, data) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON to', file, err);
    return false;
  }
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Create server
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = reqUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. PRODUCTS API: /api/products
  if (pathname === '/api/products') {
    if (req.method === 'GET') {
      const products = readJson(PRODUCTS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: products.length, products }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const p = JSON.parse(body);
          if (!p || !p.name) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Product name is required' }));
            return;
          }
          const products = readJson(PRODUCTS_FILE, []);
          const id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const newProduct = {
            id,
            name: p.name.trim(),
            category: p.category || 'bags',
            categoryLabel: p.categoryLabel || (p.category === 'clothes' ? 'Knitwear & Clothes' : p.category === 'gifts' ? 'Gift & Accessories' : 'Signature Knot Bags'),
            image: p.image || '/images/cloud-clutch.jpeg',
            tag: p.tag || 'New Artisan Arrival',
            stock: parseInt(p.stock, 10) || 5,
            stockStatus: p.stockStatus || 'In Stock / Available',
            stockAlert: p.stockAlert || 'In Stock & Ready to Ship',
            description: p.description || '',
            colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: 'Default', hex: '#FAF7F2', default: true }],
            features: Array.isArray(p.features) ? p.features : ['100% Hand-knitted artisan piece']
          };
          const existingIdx = products.findIndex(x => x.id === id);
          if (existingIdx >= 0) products[existingIdx] = newProduct;
          else products.unshift(newProduct);
          writeJson(PRODUCTS_FILE, products);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, product: newProduct }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
        }
      });
      return;
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const p = JSON.parse(body);
          const products = readJson(PRODUCTS_FILE, []);
          const idx = products.findIndex(x => x.id === p.id);
          if (idx === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Product not found' }));
            return;
          }
          products[idx] = { ...products[idx], ...p };
          writeJson(PRODUCTS_FILE, products);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, product: products[idx] }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const qId = reqUrl.searchParams.get('id');
          const payload = body ? JSON.parse(body) : {};
          const targetId = qId || payload.id;
          let products = readJson(PRODUCTS_FILE, []);
          products = products.filter(x => x.id !== targetId);
          writeJson(PRODUCTS_FILE, products);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Product deleted' }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Delete failed' }));
        }
      });
      return;
    }
  }

  // 2. ENQUIRIES API: /api/enquiries
  if (pathname === '/api/enquiries') {
    if (req.method === 'GET') {
      const list = readJson(INQUIRIES_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: list.length, enquiries: list }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const { name, email, phone, subject, message } = JSON.parse(body);
          if (!name || !email || !message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Name, email and message required' }));
            return;
          }
          const list = readJson(INQUIRIES_FILE, []);
          const newInq = {
            id: `INQ-${Math.floor(100 + Math.random() * 900)}`,
            name: name.trim(),
            email: email.trim(),
            phone: (phone || '').trim(),
            subject: (subject || 'General Inquiry').trim(),
            message: message.trim(),
            status: 'new',
            created_at: new Date().toISOString()
          };
          list.unshift(newInq);
          writeJson(INQUIRIES_FILE, list);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Enquiry sent!', enquiry: newInq }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid format' }));
        }
      });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const { id, status, admin_notes } = JSON.parse(body);
          const list = readJson(INQUIRIES_FILE, []);
          const found = list.find(x => x.id === id);
          if (!found) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Not found' }));
            return;
          }
          if (status) found.status = status;
          if (admin_notes !== undefined) found.admin_notes = admin_notes;
          writeJson(INQUIRIES_FILE, list);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, enquiry: found }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Update failed' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const qId = reqUrl.searchParams.get('id');
          const payload = body ? JSON.parse(body) : {};
          const targetId = qId || payload.id;
          let list = readJson(INQUIRIES_FILE, []);
          list = list.filter(x => x.id !== targetId);
          writeJson(INQUIRIES_FILE, list);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Enquiry deleted' }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Delete failed' }));
        }
      });
      return;
    }
  }

  // 3. SETTINGS API: /api/settings
  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      const settings = readJson(SETTINGS_FILE, {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, settings }));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          const current = readJson(SETTINGS_FILE, {});
          const merged = { ...current, ...updates };
          writeJson(SETTINGS_FILE, merged);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, settings: merged }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
        }
      });
      return;
    }
  }

  // 4. IMAGE UPLOAD API: /api/upload
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { imageBase64, filename } = JSON.parse(body);
        if (!imageBase64) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'No image provided' }));
          return;
        }
        const safeName = (filename || `upload-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9.-]/g, '_');
        const uploadPath = path.join(PUBLIC_DIR, 'images', safeName);
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(uploadPath, Buffer.from(cleanBase64, 'base64'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: `/images/${safeName}`, message: 'Uploaded successfully' }));
      } catch (err) {
        // Fallback: return as base64 string
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: JSON.parse(body).imageBase64, message: 'Data URL stored' }));
      }
    });
    return;
  }

  // 5. ORDERS API: /api/orders
  if (req.method === 'GET' && pathname.startsWith('/api/orders/')) {
    const orderId = pathname.replace('/api/orders/', '');
    const orders = readJson(ORDERS_FILE, []);
    const found = orders.find(o => o.orderId === orderId);
    if (found) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, order: found }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Order not found' }));
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    const orders = readJson(ORDERS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: orders.length, orders }));
    return;
  }

  if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/orders')) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { orderId, orderRef, status, isCompleted } = payload;
        const targetId = orderId || orderRef || pathname.replace('/api/orders/', '').replace('/api/orders', '');
        
        const orders = readJson(ORDERS_FILE, []);
        const found = orders.find(o => o.orderId === targetId || o.order_reference === targetId);
        if (found) {
          found.status = status || (isCompleted ? 'Completed' : found.status);
          found.is_completed = (status === 'completed' || isCompleted === true);
          writeJson(ORDERS_FILE, orders);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, order: found }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Order not found' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { fullName, phone, email, deliveryAddress, quantity, productId, color, personalization, notes } = payload;

        if (!fullName || !phone || !email || !deliveryAddress) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Please fill in all required fields (Full Name, Phone Number, Email, and Delivery Address).'
          }));
          return;
        }

        const qty = parseInt(quantity, 10) || 1;
        const products = readJson(PRODUCTS_FILE, []);
        const matchedProduct = products.find(p => p.id === productId) || (products[0] || { id: 'cloud-clutch', name: 'The Cloud Knitted Clutch', image: '/images/cloud-clutch.jpeg', colors: [{ name: 'Milky White' }] });

        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderId = `KYB-${randomNum}`;
        const trackingNumber = `TRACK-KNB-${Date.now().toString().slice(-6)}`;

        const orderDate = new Date();
        const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);

        const newOrder = {
          orderId,
          trackingNumber,
          createdAt: orderDate.toISOString(),
          estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          status: 'Confirmed & In Artisan Queue',
          currentStep: 1,
          steps: [
            { step: 1, title: 'Order Received', desc: 'Order logged & placed into artisan crafting queue', completed: true, time: 'Just now' },
            { step: 2, title: 'Handcrafting with Love', desc: 'Artisan hand-knitting your yarn with custom details', completed: false, time: 'Next 24-48 hrs' },
            { step: 3, title: 'Quality Check & Eco-Packing', desc: 'Inspected for flawless stitches and wrapped with signature ribbon', completed: false, time: 'Estimated Day 3' },
            { step: 4, title: 'Dispatched for Safe Delivery', desc: 'Handed to courier for express doorstep delivery', completed: false, time: 'Estimated Day 4-5' }
          ],
          customer: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            deliveryAddress: deliveryAddress.trim()
          },
          item: {
            id: matchedProduct.id,
            name: matchedProduct.name,
            image: matchedProduct.image,
            quantity: qty,
            color: color || (matchedProduct.colors && matchedProduct.colors[0] ? matchedProduct.colors[0].name : 'Milky White'),
            personalization: personalization ? personalization.trim() : 'Standard handcrafted edition',
            notes: notes ? notes.trim() : 'None provided'
          },
          confirmationMessage: 'Thank you for patronising us! We have got your order and will deliver them to you as soon as possible.',
          contactInfo: {
            phone: '3319565982',
            email: 'fabianojessica6@gmail.com',
            serviceHours: 'Open 24/7, 6 days a week, 365 days a year',
            instagram: '@knotyourbag'
          }
        };

        const orders = readJson(ORDERS_FILE, []);
        orders.unshift(newOrder);
        writeJson(ORDERS_FILE, orders);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Thank you for patronising us! We have got your order and will deliver them to you as soon as possible.',
          order: newOrder
        }));
      } catch (err) {
        console.error('Error processing order payload:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid order data format' }));
      }
    });
    return;
  }

  // 6. STATIC FILE SERVING
  let requestedPath = pathname === '/' ? '/index.html' : pathname;
  if (requestedPath === '/admin') requestedPath = '/admin.html';
  let filePath = path.join(PUBLIC_DIR, requestedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const ext = path.extname(pathname);
      if (!ext || ext === '.html') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, content) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          }
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err2, content) => {
      if (err2) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  knotyourbag E-Commerce Server is running locally!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Admin Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`  API Products: http://localhost:${PORT}/api/products`);
  console.log(`  API Orders: http://localhost:${PORT}/api/orders`);
  console.log(`  API Enquiries: http://localhost:${PORT}/api/enquiries`);
  console.log(`  API Settings: http://localhost:${PORT}/api/settings`);
  console.log(`====================================================`);
});
