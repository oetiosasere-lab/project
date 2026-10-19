// Vercel Serverless Function: GET /api/products
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

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(200).json({
    success: true,
    count: PRODUCTS.length,
    products: PRODUCTS
  });
};
