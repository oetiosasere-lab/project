const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Initial Product Catalog
const PRODUCTS = [
  {
    id: 'cloud-clutch',
    name: 'The Cloud Knitted Clutch',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/cloud-clutch.jpeg',
    tag: 'Bestseller',
    stock: 5,
    stockStatus: 'In Stock / Available',
    stockAlert: 'Only 5 left in this batch',
    description: 'Slow-crafted with ultra-soft chunky cotton yarn in our signature milky white shade. Features an organic cloud silhouette with magnetic closure.',
    colors: [
      { name: 'Milky White', hex: '#FAF7F2', default: true },
      { name: 'Oatmeal Beige', hex: '#D8CBBF' },
      { name: 'Blush Rose', hex: '#E2B8AE' },
      { name: 'Midnight Charcoal', hex: '#232323' }
    ],
    features: ['100% Recycled Chunky Cotton', 'Hand-stitched reinforced lining', 'Featherlight & holds daily essentials']
  },
  {
    id: 'pearl-dew-barrel',
    name: 'The Pearl Dew Barrel Bag',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/pearl-dew-barrel.jpeg',
    tag: 'Artisan Pick',
    stock: 3,
    stockStatus: 'In Stock / Available',
    stockAlert: 'Low Stock — 3 left',
    description: 'Statement barrel silhouette hand-knotted in crisp milky cotton and embellished with hand-sewn shimmering pearl beads. Modern luxury meets slow artisan craft.',
    colors: [
      { name: 'Pearl White', hex: '#FFFFFF', default: true },
      { name: 'Champagne Cream', hex: '#F4ECE1' },
      { name: 'Soft Ice Blue', hex: '#D1DEE8' }
    ],
    features: ['Hand-sewn iridescent pearl beads', 'Rigid barrel structure that holds shape', 'Ergonomic knit handle']
  },
  {
    id: 'indigo-knot',
    name: 'The Burano Deep Indigo Knot',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/indigo-knot.jpeg',
    tag: 'Trending',
    stock: 6,
    stockStatus: 'In Stock / Available',
    stockAlert: 'In Stock & Ready to Ship',
    description: 'Chunky deep indigo handbag adorned with a delicate golden link necklace and luminous baroque pearl pendant. An effortless day-to-night showstopper.',
    colors: [
      { name: 'Deep Indigo', hex: '#2A4365', default: true },
      { name: 'Velvet Black', hex: '#181818' },
      { name: 'Olive Green', hex: '#586A53' }
    ],
    features: ['Includes detachable gold-tone pearl chain', 'Thick cushion weave handle', 'Rich color-fast dyed textile']
  },
  {
    id: 'capri-daisy-tote',
    name: 'The Capri Daisy Market Tote',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/capri-daisy-tote.jpeg',
    tag: 'Community Favorite',
    stock: 4,
    stockStatus: 'In Stock / Available',
    stockAlert: '4 pieces remaining',
    description: 'High-energy electric cyan woven tote bag finished with enamel daisy floral pins and braided ergonomic carry handles. Radiates joyful Mediterranean sunshine.',
    colors: [
      { name: 'Capri Azure', hex: '#0EA5E9', default: true },
      { name: 'Sunflower Yellow', hex: '#EAB308' },
      { name: 'Coral Peach', hex: '#F97316' },
      { name: 'Lilac Dream', hex: '#C084FC' }
    ],
    features: ['Includes 2 handcrafted enamel floral pins', 'Double-reinforced twist braided straps', 'Spacious interior for phone, book & keys']
  },
  {
    id: 'baby-cardigan-set',
    name: 'Heirloom Baby Cardigan & Booties',
    category: 'clothes',
    categoryLabel: 'Knitwear & Clothes',
    image: '/images/baby-cardigan-set.jpeg',
    tag: 'Heirloom Clothes',
    stock: 7,
    stockStatus: 'In Stock / Available',
    stockAlert: '7 sets available / Custom sizing',
    description: 'Tenderly hand-knitted baby blue ribbed jacket with an asymmetrical button band and natural carved wooden buttons, paired with matching cozy booties. Hypoallergenic and gentle on skin.',
    colors: [
      { name: 'Pastel Blue', hex: '#BFDBFE', default: true },
      { name: 'Milky Oat', hex: '#F3EFE6' },
      { name: 'Sage Green', hex: '#D1E0D0' },
      { name: 'Buttercup Warmth', hex: '#FEF08A' }
    ],
    features: ['100% baby-safe organic combed yarn', 'Genuine carved wooden buttons', 'Includes matching hand-knit booties']
  },
  {
    id: 'coastline-tote',
    name: 'The Coastline Bicolor Tote',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/coastline-tote.jpeg',
    tag: 'New Release',
    stock: 4,
    stockStatus: 'In Stock / Available',
    stockAlert: '4 available',
    description: 'Artisanal seaside-inspired woven shoulder tote with alternating coffee brown and milky white braided ribs. Lightweight, tactile, and effortlessly chic.',
    colors: [
      { name: 'Espresso & Milk', hex: '#453229', default: true },
      { name: 'Navy & White', hex: '#1E293B' },
      { name: 'Caramel & Cream', hex: '#854D0E' }
    ],
    features: ['Intertwined bicolor ribbon yarn', 'Comfort shoulder drop height', 'Structured bottom flat base']
  },
  {
    id: 'heartstring-basket',
    name: 'The Heartstring Periwinkle Basket',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/heartstring-basket.jpeg',
    tag: 'Popular Gift',
    stock: 5,
    stockStatus: 'In Stock / Available',
    stockAlert: '5 pieces available',
    description: 'Tubular knit periwinkle basket bag with an arched braided handle and a charming hand-crocheted oatmeal heart keepsake charm suspended from the rim.',
    colors: [
      { name: 'Periwinkle Blue', hex: '#818CF8', default: true },
      { name: 'Milky Cream', hex: '#FAF5EE' },
      { name: 'Earthy Terracotta', hex: '#DD6B4D' },
      { name: 'Matcha Green', hex: '#86A789' }
    ],
    features: ['Detachable hand-crocheted heart charm', 'Thick tubular stitch construction', 'Compact & darling everyday silhouette']
  },
  {
    id: 'espresso-slouch-tote',
    name: 'The Espresso Pearl Slouch Tote',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/espresso-slouch-tote.jpeg',
    tag: 'Editorial',
    stock: 3,
    stockStatus: 'In Stock / Available',
    stockAlert: 'Low Stock — 3 left',
    description: 'Deep espresso macramé-inspired slouch tote with layered diamond knots and twin baroque pearl beaded swags draped across the sweetheart neckline.',
    colors: [
      { name: 'Espresso Dark', hex: '#342621', default: true },
      { name: 'Pitch Black', hex: '#111111' },
      { name: 'Warm Taupe', hex: '#78685C' }
    ],
    features: ['Double lustrous pearl draped swags', 'Flexible slouchy silhouette with generous depth', 'Zero synthetic plastics']
  },
  {
    id: 'rose-bouquet',
    name: 'The Eternal Knotted Rose Bouquet',
    category: 'gifts',
    categoryLabel: 'Gift & Accessories',
    image: '/images/rose-bouquet.jpeg',
    tag: 'Keepsake',
    stock: 8,
    stockStatus: 'In Stock / Available',
    stockAlert: '8 bouquets ready',
    description: 'A luxurious artisanal bouquet of dozens of hand-crocheted crimson velvet roses wrapped in textured gold-trimmed paper. A forever keepsake that never withers.',
    colors: [
      { name: 'Velvet Crimson', hex: '#DC2626', default: true },
      { name: 'Vintage Dusty Pink', hex: '#FB7185' },
      { name: 'Ivory Snow', hex: '#FFFBEB' }
    ],
    features: ['Never wilts or fades — forever memory', 'Luxury embossed paper & gold ribbon wrapping', 'Custom gift card handwritten by our artisan']
  }
];

// Helper to read saved orders
function getOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading orders:', err);
  }
  return [];
}

// Helper to save orders
function saveOrder(order) {
  try {
    const orders = getOrders();
    orders.unshift(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving order:', err);
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Get products
  if (req.method === 'GET' && pathname === '/api/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: PRODUCTS.length, products: PRODUCTS }));
    return;
  }

  // API: Get order by ID
  if (req.method === 'GET' && pathname.startsWith('/api/orders/')) {
    const orderId = pathname.replace('/api/orders/', '');
    const orders = getOrders();
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

  // API: Get recent orders list
  if (req.method === 'GET' && pathname === '/api/orders') {
    const orders = getOrders();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: orders.length, orders }));
    return;
  }

  // API: Update order status
  if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/orders')) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { orderId, orderRef, status, isCompleted } = payload;
        const targetId = orderId || orderRef || pathname.replace('/api/orders/', '').replace('/api/orders', '');
        
        const orders = getOrders();
        const found = orders.find(o => o.orderId === targetId || o.order_reference === targetId);
        if (found) {
          found.status = status || (isCompleted ? 'Completed' : found.status);
          found.is_completed = (status === 'completed' || isCompleted === true);
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
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

  // API: Create new order
  if (req.method === 'POST' && pathname === '/api/orders') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // Validation
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
        const matchedProduct = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];

        // Generate unique order ID
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderId = `KYB-${randomNum}`;
        const trackingNumber = `TRACK-KNB-${Date.now().toString().slice(-6)}`;

        // Calculate expected delivery date (3-5 business days)
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
          currentStep: 1, // 1: Order Placed, 2: Handcrafting, 3: Quality Check & Packing, 4: Out for Delivery
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
            color: color || matchedProduct.colors[0].name,
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

        saveOrder(newOrder);

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

  // Static File Serving
  let requestedPath = pathname === '/' ? '/index.html' : pathname;
  if (requestedPath === '/admin') requestedPath = '/admin.html';
  let filePath = path.join(PUBLIC_DIR, requestedPath);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not an asset
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
  console.log(`  API Products: http://localhost:${PORT}/api/products`);
  console.log(`  API Orders: http://localhost:${PORT}/api/orders`);
  console.log(`====================================================`);
});
