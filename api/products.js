// Vercel Serverless Function: /api/products
// Supports GET (fetch all active products) and POST/PUT/DELETE (admin management)
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

const DEFAULT_PRODUCTS = [
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
    tag: 'Classic Knit',
    stock: 5,
    stockStatus: 'In Stock / Available',
    stockAlert: '5 pieces ready to dispatch',
    description: 'Dual-tone architectural tote pairing deep espresso tones with warm ivory cotton cord. Spacious interior easily carries your 13-inch laptop, water bottle, and essentials.',
    colors: [
      { name: 'Espresso & Milk', hex: '#3A2E2B', default: true },
      { name: 'Terracotta & Oat', hex: '#9C5141' },
      { name: 'Sage & Cream', hex: '#728C69' }
    ],
    features: ['Fits 13-inch laptop & daily planner', 'Reinforced double-knit base for anti-sag', 'Hand-twisted chunky rope straps']
  },
  {
    id: 'heartstring-basket',
    name: 'The Heartstring Periwinkle Basket',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/heartstring-basket.jpeg',
    tag: 'Handmade Charm',
    stock: 4,
    stockStatus: 'In Stock / Available',
    stockAlert: '4 bags crafted',
    description: 'Whimsical rounded bucket tote in pastel periwinkle blue, embellished with sweet hand-crocheted cherry charms hanging along the rim. Brings joyful artisanal charm to any stroll.',
    colors: [
      { name: 'Pastel Periwinkle', hex: '#A5B4FC', default: true },
      { name: 'Butter Cream', hex: '#FEF9C3' },
      { name: 'Dusty Mauve', hex: '#D8B4E2' }
    ],
    features: ['Includes 2 hand-crocheted cherry charms', 'Sturdy basket weave holds round shape', 'Lightweight summer companion']
  },
  {
    id: 'espresso-slouch-tote',
    name: 'The Espresso Pearl Slouch Tote',
    category: 'bags',
    categoryLabel: 'Signature Knot Bags',
    image: '/images/espresso-slouch-tote.jpeg',
    tag: 'Artisan Pick',
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

function readProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading products file:', e);
  }
  return DEFAULT_PRODUCTS;
}

function writeProducts(products) {
  try {
    const dir = path.dirname(PRODUCTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing products file:', e);
    return false;
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET: List all products
  if (req.method === 'GET') {
    const products = readProducts();
    res.status(200).json({ success: true, count: products.length, products });
    return;
  }

  // POST: Add new product
  if (req.method === 'POST') {
    try {
      const p = req.body;
      if (!p || !p.name) {
        res.status(400).json({ success: false, message: 'Product name is required' });
        return;
      }
      const products = readProducts();
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

      // Check if product exists
      const existingIdx = products.findIndex(x => x.id === id);
      if (existingIdx >= 0) {
        products[existingIdx] = newProduct;
      } else {
        products.unshift(newProduct);
      }
      writeProducts(products);
      res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  // PUT: Update existing product
  if (req.method === 'PUT') {
    try {
      const p = req.body;
      if (!p || !p.id) {
        res.status(400).json({ success: false, message: 'Product id is required for update' });
        return;
      }
      const products = readProducts();
      const idx = products.findIndex(x => x.id === p.id);
      if (idx === -1) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      products[idx] = { ...products[idx], ...p };
      writeProducts(products);
      res.status(200).json({ success: true, product: products[idx] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  // DELETE: Remove product
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || {};
      const targetId = id || (req.body && req.body.id);
      if (!targetId) {
        res.status(400).json({ success: false, message: 'Product ID required' });
        return;
      }
      let products = readProducts();
      products = products.filter(x => x.id !== targetId);
      writeProducts(products);
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
