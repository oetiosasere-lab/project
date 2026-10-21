// knotyourbag — Client Side Application Logic
let productsData = [];
let selectedProductForOrder = null;
let currentFilter = 'all';

// Fallback products if API is offline
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

// Product card state map: stores user selections per product { qty, selectedColor, personalization }
const cardStates = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();
  initFAQ();
  initOrderTrackerLookup();
  await loadProducts();
  initOrderForm();
});

// Fetch products from server API or fallback
async function loadProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      productsData = data.products || DEFAULT_PRODUCTS;
    } else {
      productsData = DEFAULT_PRODUCTS;
    }
  } catch (err) {
    console.log('Using local products data');
    productsData = DEFAULT_PRODUCTS;
  }

  // Populate product dropdown in order form
  populateOrderProductDropdown();

  // Render product grid
  renderProductGrid();

  // Setup category filter buttons
  setupCategoryFilters();
}

// Render Products Grid
function renderProductGrid() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? productsData
    : productsData.filter(p => p.category === currentFilter);

  container.innerHTML = filtered.map(p => {
    // Initialize state if not present
    if (!cardStates[p.id]) {
      cardStates[p.id] = {
        qty: 1,
        selectedColor: p.colors[0].name,
        personalization: ''
      };
    }
    const state = cardStates[p.id];

    return `
      <div class="artisan-card bg-white rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between" id="card-${p.id}">
        <!-- Image & Tag Header -->
        <div class="relative overflow-hidden aspect-[4/3] bg-neutral-100 group">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute top-3 left-3 flex flex-wrap gap-2">
            <span class="px-2.5 py-1 bg-black/80 backdrop-blur-md text-[#FAF8F5] text-xs font-semibold rounded-full uppercase tracking-wider">
              ${p.tag}
            </span>
          </div>
          <!-- Real-Time Stock Status Badge -->
          <div class="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-neutral-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-medium text-neutral-800">
            <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-indicator"></span>
            <span>${p.stockStatus}</span>
            <span class="text-neutral-400 font-normal">(${p.stock} left)</span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-1">${p.categoryLabel}</div>
            <div class="mb-2">
              <h3 class="font-bold text-lg text-neutral-900 leading-snug">${p.name}</h3>
            </div>
            <p class="text-sm text-neutral-600 line-clamp-2 mb-4 leading-relaxed">${p.description}</p>
          </div>

          <!-- Interactive Inputs Box -->
          <div class="bg-[#FAF8F5] rounded-xl p-3.5 border border-neutral-200/60 mb-4 space-y-3">
            
            <!-- 1. Color Selector -->
            <div>
              <div class="flex justify-between items-center text-xs font-semibold text-neutral-700 mb-1.5">
                <span>Color: <strong class="text-neutral-900 font-bold" id="color-label-${p.id}">${state.selectedColor}</strong></span>
                <span class="text-[10px] text-neutral-500 font-normal">Hand-dyed</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                ${p.colors.map(c => `
                  <button 
                    type="button"
                    class="color-swatch w-7 h-7 rounded-full border-2 transition-all ${state.selectedColor === c.name ? 'border-neutral-950 scale-110 shadow-sm' : 'border-neutral-300'}"
                    style="background-color: ${c.hex};"
                    title="${c.name}"
                    onclick="selectProductColor('${p.id}', '${c.name}')"
                  ></button>
                `).join('')}
              </div>
            </div>

            <!-- 2. Quantity Selector -->
            <div class="flex items-center justify-between pt-1 border-t border-neutral-200/50">
              <span class="text-xs font-semibold text-neutral-700">Quantity</span>
              <div class="inline-flex items-center bg-white rounded-lg border border-neutral-300 shadow-sm">
                <button 
                  type="button" 
                  class="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-l-lg font-bold text-sm transition"
                  onclick="updateProductQty('${p.id}', -1)"
                  aria-label="Decrease quantity"
                >-</button>
                <span class="w-8 text-center text-xs font-bold text-neutral-900" id="qty-val-${p.id}">${state.qty}</span>
                <button 
                  type="button" 
                  class="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-r-lg font-bold text-sm transition"
                  onclick="updateProductQty('${p.id}', 1)"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            <!-- 3. Personalization & Custom Color Input -->
            <div class="pt-1 border-t border-neutral-200/50">
              <label for="custom-input-${p.id}" class="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                <span>Custom Color & Personalization</span>
                <span class="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Free customization</span>
              </label>
              <input 
                type="text" 
                id="custom-input-${p.id}" 
                value="${state.personalization}"
                oninput="updateProductPersonalization('${p.id}', this.value)"
                placeholder="Custom color, initials, or custom strap..." 
                class="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
            </div>
          </div>

          <!-- Action Button: Order This Item -->
          <div class="space-y-2">
            <button 
              type="button" 
              onclick="orderThisProduct('${p.id}')"
              class="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 active:scale-[0.98] text-[#FAF8F5] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <span>Order Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button 
              type="button" 
              onclick="openQuickView('${p.id}')"
              class="w-full py-1.5 px-3 bg-transparent hover:bg-neutral-100 text-neutral-600 rounded-lg font-medium text-xs transition flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Artisan Details & Care</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Category Filters
function setupCategoryFilters() {
  const buttons = document.querySelectorAll('.cat-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('bg-neutral-950', 'text-[#FAF8F5]');
        b.classList.add('bg-white', 'text-neutral-700', 'border', 'border-neutral-200');
      });
      btn.classList.add('bg-neutral-950', 'text-[#FAF8F5]');
      btn.classList.remove('bg-white', 'text-neutral-700', 'border-neutral-200');

      currentFilter = btn.dataset.category;
      renderProductGrid();
    });
  });
}

// Color Selection Handler
function selectProductColor(productId, colorName) {
  if (!cardStates[productId]) return;
  cardStates[productId].selectedColor = colorName;
  const label = document.getElementById(`color-label-${productId}`);
  if (label) label.textContent = colorName;

  // Re-render card swatch rings
  const card = document.getElementById(`card-${productId}`);
  if (card) {
    const swatches = card.querySelectorAll('.color-swatch');
    swatches.forEach(sw => {
      if (sw.getAttribute('title') === colorName) {
        sw.classList.add('border-neutral-950', 'scale-110', 'shadow-sm');
        sw.classList.remove('border-neutral-300');
      } else {
        sw.classList.remove('border-neutral-950', 'scale-110', 'shadow-sm');
        sw.classList.add('border-neutral-300');
      }
    });
  }
}

// Quantity Counter Handler
function updateProductQty(productId, delta) {
  if (!cardStates[productId]) return;
  let newQty = cardStates[productId].qty + delta;
  if (newQty < 1) newQty = 1;
  if (newQty > 10) newQty = 10;
  cardStates[productId].qty = newQty;

  const qtyEl = document.getElementById(`qty-val-${productId}`);
  if (qtyEl) qtyEl.textContent = newQty;
}

// Personalization Input Handler
function updateProductPersonalization(productId, value) {
  if (!cardStates[productId]) return;
  cardStates[productId].personalization = value;
}

// Populate product select dropdown in the Order Form
function populateOrderProductDropdown() {
  const select = document.getElementById('order-product-select');
  if (!select) return;

  select.innerHTML = productsData.map(p => `
    <option value="${p.id}">${p.name}</option>
  `).join('');

  select.addEventListener('change', (e) => {
    const p = productsData.find(item => item.id === e.target.value);
    if (p) {
      updateOrderFormWithProduct(p, 1, p.colors[0].name, '');
    }
  });
}

// "Order This Item" Action from Product Card: Transfers selection to Order Form & smooth scrolls!
function orderThisProduct(productId) {
  const p = productsData.find(item => item.id === productId);
  if (!p) return;

  const state = cardStates[productId] || { qty: 1, selectedColor: p.colors[0].name, personalization: '' };
  updateOrderFormWithProduct(p, state.qty, state.selectedColor, state.personalization);

  // Smooth scroll to the order form section
  const formSection = document.getElementById('order-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth' });
    
    // Highlight form container for 2 seconds
    const formCard = document.getElementById('order-form-container');
    if (formCard) {
      formCard.classList.add('ring-2', 'ring-neutral-950', 'order-highlight');
      setTimeout(() => {
        formCard.classList.remove('ring-2', 'ring-neutral-950', 'order-highlight');
      }, 2500);
    }
  }

  showToast(`Selected "${p.name}" (${state.qty}x, ${state.selectedColor}). Ready to order!`);
}

// Helper: updates Order Form inputs with chosen product
function updateOrderFormWithProduct(product, qty, color, personalization) {
  selectedProductForOrder = product;

  // Dropdown
  const select = document.getElementById('order-product-select');
  if (select) select.value = product.id;

  // Quantity
  const qtyInput = document.getElementById('order-quantity');
  if (qtyInput) qtyInput.value = qty;

  // Color / Personalization
  const colorInput = document.getElementById('order-color-detail');
  if (colorInput) {
    colorInput.value = personalization ? `${color} — Note: ${personalization}` : color;
  }

  // Update Summary banner
  renderOrderFormSummary(product, qty);
}

// Update Order Form Summary (No prices)
function renderOrderFormSummary(product, qty) {
  const summaryBox = document.getElementById('order-live-summary');
  if (!summaryBox || !product) return;

  summaryBox.innerHTML = `
    <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200">
      <img src="${product.image}" alt="${product.name}" class="w-14 h-14 rounded-lg object-cover border border-neutral-200" />
      <div class="flex-1">
        <h4 class="font-bold text-sm text-neutral-900">${product.name}</h4>
        <div class="text-xs text-neutral-500">${qty} item(s) selected</div>
      </div>
      <div class="text-right">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
          Handmade to Order
        </span>
      </div>
    </div>
  `;
}

// Order Form Submission & Back-End API Call
function initOrderForm() {
  const form = document.getElementById('knotyourbag-order-form');
  if (!form) return;

  // Quantity stepper inside form
  const decBtn = document.getElementById('form-qty-dec');
  const incBtn = document.getElementById('form-qty-inc');
  const qtyInput = document.getElementById('order-quantity');

  if (decBtn && incBtn && qtyInput) {
    decBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
        if (selectedProductForOrder) renderOrderFormSummary(selectedProductForOrder, val - 1);
      }
    });
    incBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 10) {
        qtyInput.value = val + 1;
        if (selectedProductForOrder) renderOrderFormSummary(selectedProductForOrder, val + 1);
      }
    });
    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 1) val = 1;
      if (val > 10) val = 10;
      qtyInput.value = val;
      if (selectedProductForOrder) renderOrderFormSummary(selectedProductForOrder, val);
    });
  }

  // Pre-select first product if none selected
  if (productsData.length > 0 && !selectedProductForOrder) {
    updateOrderFormWithProduct(productsData[0], 1, productsData[0].colors[0].name, '');
  }

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('order-full-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const email = document.getElementById('order-email').value.trim();
    const deliveryAddress = document.getElementById('order-address').value.trim();
    const productId = document.getElementById('order-product-select').value;
    const quantity = parseInt(document.getElementById('order-quantity').value, 10) || 1;
    const colorDetail = document.getElementById('order-color-detail').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    if (!fullName || !phone || !email || !deliveryAddress) {
      alert('Please fill in all required fields (Full Name, Phone Number, Email, and Delivery Address).');
      return;
    }

    const submitBtn = document.getElementById('order-submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Handcrafting your order...</span>
    `;

    const payload = {
      fullName,
      phone,
      email,
      deliveryAddress,
      productId,
      quantity,
      color: colorDetail,
      personalization: colorDetail,
      notes
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Sync to localStorage and Supabase for Admin Dashboard
        syncOrderToAdminStorage(result.order);

        // Success! Launch celebration confetti
        triggerConfetti();

        // Show Delivery Dashboard / Confirmation View
        openDeliveryDashboard(result.order);

        // Reset form
        form.reset();
        if (productsData.length > 0) {
          updateOrderFormWithProduct(productsData[0], 1, productsData[0].colors[0].name, '');
        }
      } else {
        alert(result.message || 'There was an issue processing your order. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      // Fallback local order creation if network error
      const mockOrder = createMockOrderLocally(payload);
      syncOrderToAdminStorage(mockOrder);
      triggerConfetti();
      openDeliveryDashboard(mockOrder);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Fallback Mock Order in case of offline usage
function createMockOrderLocally(payload) {
  const p = productsData.find(item => item.id === payload.productId) || productsData[0];
  const orderId = `KYB-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderDate = new Date();
  const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  return {
    orderId,
    trackingNumber: `TRACK-KNB-${Date.now().toString().slice(-6)}`,
    createdAt: orderDate.toISOString(),
    estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    confirmationMessage: 'Thank you for patronising us! We have got your order and will deliver them to you as soon as possible.',
    customer: {
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      deliveryAddress: payload.deliveryAddress
    },
    item: {
      id: p.id,
      name: p.name,
      image: p.image,
      quantity: payload.quantity,
      color: payload.color || 'Custom Choice',
      personalization: payload.personalization || 'Custom Artisan Request',
      notes: payload.notes || 'None'
    },
    steps: [
      { step: 1, title: 'Order Received', desc: 'Order logged & placed into artisan crafting queue', completed: true, time: 'Just now' },
      { step: 2, title: 'Handcrafting with Love', desc: 'Artisan hand-knitting your yarn with custom details', completed: false, time: 'Next 24-48 hrs' },
      { step: 3, title: 'Quality Check & Eco-Packing', desc: 'Inspected for flawless stitches and wrapped with signature ribbon', completed: false, time: 'Estimated Day 3' },
      { step: 4, title: 'Dispatched for Safe Delivery', desc: 'Handed to courier for express doorstep delivery', completed: false, time: 'Estimated Day 4-5' }
    ],
    contactInfo: {
      phone: '3319565982',
      email: 'fabianojessica6@gmail.com',
      serviceHours: 'Open 24/7, 6 days a week, 365 days a year',
      instagram: '@knotyourbag'
    }
  };
}

// Delivery Dashboard / Confirmation View Modal
function openDeliveryDashboard(order) {
  const modal = document.getElementById('delivery-dashboard-modal');
  if (!modal) return;

  const content = document.getElementById('delivery-dashboard-content');
  if (!content) return;

  content.innerHTML = `
    <!-- Top Celebratory Header -->
    <div class="text-center pb-6 border-b border-neutral-200">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-mono font-bold rounded-full mb-2">
        <span>Order Reference:</span>
        <span class="text-neutral-950 font-black">${order.orderId}</span>
      </div>

      <!-- Mandatory Confirmation Message -->
      <div class="p-4 bg-[#FAF8F5] border border-neutral-200/80 rounded-2xl max-w-xl mx-auto shadow-sm">
        <p class="font-editorial text-lg md:text-xl text-neutral-900 italic font-semibold leading-relaxed">
          &ldquo;${order.confirmationMessage}&rdquo;
        </p>
      </div>
    </div>

    <!-- Stepper Tracker -->
    <div class="py-6 border-b border-neutral-200">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-bold text-sm text-neutral-900 uppercase tracking-wider flex items-center gap-2">
          <span>Live Order Tracking</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-indicator"></span>
        </h4>
        <span class="text-xs text-neutral-500 font-mono">Tracking: ${order.trackingNumber}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        ${order.steps.map((st, idx) => `
          <div class="relative p-3.5 rounded-xl border ${st.completed ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm' : idx === 1 ? 'bg-white border-neutral-900 ring-2 ring-neutral-950/10' : 'bg-[#FAF8F5] border-neutral-200 text-neutral-500'}">
            <div class="flex items-center justify-between mb-1.5">
              <span class="w-5 h-5 rounded-full ${st.completed ? 'bg-white text-neutral-950' : idx === 1 ? 'bg-neutral-950 text-white' : 'bg-neutral-300 text-white'} text-[10px] font-bold flex items-center justify-center">
                ${st.completed ? '✓' : idx + 1}
              </span>
              <span class="text-[10px] font-mono ${st.completed ? 'text-neutral-300' : 'text-neutral-500'}">${st.time}</span>
            </div>
            <div class="font-bold text-xs ${st.completed ? 'text-white' : 'text-neutral-900'}">${st.title}</div>
            <div class="text-[11px] leading-snug mt-1 ${st.completed ? 'text-neutral-300' : 'text-neutral-600'}">${st.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Two Column Summary: Order Details & Customer Delivery Info -->
    <div class="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-neutral-200">
      <!-- Ordered Item Details -->
      <div class="bg-[#FAF8F5] p-5 rounded-2xl border border-neutral-200">
        <h5 class="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3">Item Details</h5>
        <div class="flex items-center gap-4 mb-4">
          <img src="${order.item.image}" alt="${order.item.name}" class="w-20 h-20 rounded-xl object-cover border border-neutral-200 shadow-sm" />
          <div>
            <h4 class="font-bold text-base text-neutral-900">${order.item.name}</h4>
            <div class="text-xs text-neutral-600 mt-1">Quantity: <strong class="text-neutral-950 font-bold">${order.item.quantity}</strong></div>
            <div class="text-xs text-emerald-700 font-semibold mt-1">Handcrafted Artisan Batch</div>
          </div>
        </div>

        <div class="pt-3 border-t border-neutral-200/80 space-y-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-neutral-600">Selected Color:</span>
            <span class="font-semibold text-neutral-900">${order.item.color}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-600">Personalization:</span>
            <span class="font-semibold text-neutral-900 text-right">${order.item.personalization}</span>
          </div>
          ${order.item.notes && order.item.notes !== 'None' ? `
          <div class="flex justify-between">
            <span class="text-neutral-600">Special Notes:</span>
            <span class="font-semibold text-neutral-900 text-right">${order.item.notes}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Delivery & Customer Information -->
      <div class="bg-[#FAF8F5] p-5 rounded-2xl border border-neutral-200 flex flex-col justify-between">
        <div>
          <h5 class="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3">Recipient & Delivery</h5>
          <div class="space-y-2 text-xs">
            <div class="flex items-start gap-2">
              <span class="text-neutral-500 w-24">Full Name:</span>
              <span class="font-bold text-neutral-900 flex-1">${order.customer.fullName}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-neutral-500 w-24">Phone:</span>
              <span class="font-semibold text-neutral-900 flex-1">${order.customer.phone}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-neutral-500 w-24">Email:</span>
              <span class="font-semibold text-neutral-900 flex-1">${order.customer.email}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-neutral-500 w-24">Address:</span>
              <span class="font-semibold text-neutral-900 flex-1 leading-relaxed">${order.customer.deliveryAddress}</span>
            </div>
            <div class="flex items-start gap-2 pt-2 border-t border-neutral-200">
              <span class="text-neutral-500 w-24">Est. Delivery:</span>
              <span class="font-bold text-emerald-700 flex-1">${order.estimatedDelivery}</span>
            </div>
          </div>
        </div>

        <!-- Artisan Promises & Direct Assistance Reminder -->
        <div class="mt-4 pt-3 border-t border-neutral-200 text-[11px] text-neutral-600 flex items-center justify-between">
          <span>Need help? Call: <strong>${order.contactInfo.phone}</strong></span>
          <span>${order.contactInfo.serviceHours}</span>
        </div>
      </div>
    </div>

    <!-- Actions & Buttons -->
    <div class="pt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button 
          type="button" 
          onclick="window.print()" 
          class="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Receipt</span>
        </button>
        <a 
          href="https://wa.me/3319565982?text=Hello%20knotyourbag!%20I%20just%20placed%20order%20${order.orderId}%20for%20${encodeURIComponent(order.item.name)}" 
          target="_blank" 
          class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <span>WhatsApp Update</span>
        </a>
      </div>

      <button 
        type="button" 
        onclick="closeDeliveryDashboard()" 
        class="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-[#FAF8F5] text-xs font-bold rounded-xl transition"
      >
        Close & Continue Shopping
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDeliveryDashboard() {
  const modal = document.getElementById('delivery-dashboard-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Order Tracker Lookup Bar (search by ID)
function initOrderTrackerLookup() {
  const searchBtn = document.getElementById('btn-lookup-order');
  const searchInput = document.getElementById('input-lookup-order');

  if (searchBtn && searchInput) {
    const handleSearch = async () => {
      const q = searchInput.value.trim();
      if (!q) {
        showToast('Please enter your Order ID (e.g. KYB-12345)');
        return;
      }
      try {
        const res = await fetch(`/api/orders/${q}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            openDeliveryDashboard(data.order);
            return;
          }
        }
        showToast('Order reference not found. Please double-check your ID.');
      } catch (err) {
        showToast('Could not connect to tracking server. Try again.');
      }
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
}

// Quick View Modal
function openQuickView(productId) {
  const p = productsData.find(item => item.id === productId);
  if (!p) return;

  const modal = document.getElementById('quickview-modal');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col justify-between">
        <div>
          <div class="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">${p.categoryLabel}</div>
          <h3 class="font-bold text-2xl text-neutral-900 mb-2">${p.name}</h3>
          <p class="text-sm text-neutral-700 leading-relaxed mb-6">${p.description}</p>
          
          <div class="space-y-3 mb-6">
            <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-900">Artisan Craft Specifications</h4>
            <ul class="space-y-2 text-xs text-neutral-600">
              ${p.features.map(f => `
                <li class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-neutral-950"></span>
                  <span>${f}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="space-y-3 pt-4 border-t border-neutral-200">
          <button 
            type="button" 
            onclick="orderThisProduct('${p.id}'); closeQuickView();" 
            class="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition"
          >
            Order This Handcrafted Item
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeQuickView() {
  const modal = document.getElementById('quickview-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Mobile Menu
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  const menu = document.getElementById('mobile-menu-drawer');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      menu.classList.remove('translate-x-full');
    });
  }
  if (closeBtn && menu) {
    closeBtn.addEventListener('click', () => {
      menu.classList.add('translate-x-full');
    });
  }
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.add('translate-x-full');
    });
  });
}

// FAQ Accordion
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (header && content) {
      header.addEventListener('click', () => {
        const isOpen = !content.classList.contains('hidden');
        // Close others
        items.forEach(other => {
          other.querySelector('.faq-content')?.classList.add('hidden');
          other.querySelector('.faq-icon')?.classList.remove('rotate-180');
        });

        if (!isOpen) {
          content.classList.remove('hidden');
          icon?.classList.add('rotate-180');
        }
      });
    }
  });
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById('global-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3500);
}

// Confetti Animation
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FAF8F5', '#111111', '#D8CBBF', '#D47A60', '#8A9A86']
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
}

// Sync placed order to localStorage & Supabase for Admin Dashboard
function syncOrderToAdminStorage(order) {
  try {
    const raw = localStorage.getItem('kyb_orders') || '[]';
    const list = JSON.parse(raw);
    
    // Normalize format
    const record = {
      order_reference: order.orderId || order.order_reference,
      tracking_number: order.trackingNumber || order.tracking_number,
      customer_name: (order.customer && order.customer.fullName) || order.customer_name,
      customer_phone: (order.customer && order.customer.phone) || order.customer_phone,
      customer_email: (order.customer && order.customer.email) || order.customer_email,
      delivery_address: (order.customer && order.customer.deliveryAddress) || order.delivery_address,
      product_id: (order.item && order.item.id) || order.product_id,
      product_name: (order.item && order.item.name) || order.product_name,
      quantity: (order.item && order.item.quantity) || order.quantity || 1,
      color: (order.item && order.item.color) || order.color || 'Milky White',
      personalization: (order.item && order.item.personalization) || order.personalization || '',
      delivery_notes: (order.item && order.item.notes) || order.delivery_notes || '',
      status: 'pending',
      is_completed: false,
      created_at: order.createdAt || new Date().toISOString()
    };

    list.unshift(record);
    localStorage.setItem('kyb_orders', JSON.stringify(list));

    // Also attempt direct insert into Supabase if configured in localStorage
    const sbUrl = localStorage.getItem('supabase_url');
    const sbKey = localStorage.getItem('supabase_key');
    if (sbUrl && sbKey && window.supabase) {
      const sb = window.supabase.createClient(sbUrl, sbKey);
      sb.from('orders').insert([record]).then(res => {
        if (res.error) console.warn('Supabase sync notice:', res.error);
        else console.log('Successfully synced order to Supabase!');
      }).catch(err => console.warn('Supabase sync skipped:', err));
    }
  } catch (e) {
    console.error('Storage sync error:', e);
  }
}
