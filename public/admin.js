// knotyourbag — Website Owner Admin Portal
// Full management: Authentication, Orders, Products, Images, Enquiries, Settings

let allOrders = [];
let allProducts = [];
let allEnquiries = [];
let siteSettings = {};

let currentTab = 'all';
let searchQuery = '';
let productFilter = 'all';
let supabaseClient = null;

// Default Owner credentials if not configured in Supabase Auth
const DEFAULT_OWNER = {
  name: 'Jessica Fabiano',
  email: 'fabianojessica6@gmail.com',
  password: 'knotyourbag2026!'
};

// -------------------------------------------------------------
// 1. AUTHENTICATION & ACCESS CONTROL
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initSupabaseClient();
  checkAuthSession();
});

function switchAuthTab(tab) {
  const loginForm = document.getElementById('form-admin-login');
  const regForm = document.getElementById('form-admin-register');
  const tabLogin = document.getElementById('tab-btn-login');
  const tabReg = document.getElementById('tab-btn-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabLogin.classList.add('bg-white', 'shadow-sm', 'text-neutral-950');
    tabLogin.classList.remove('text-neutral-500');
    tabReg.classList.remove('bg-white', 'shadow-sm', 'text-neutral-950');
    tabReg.classList.add('text-neutral-500');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabReg.classList.add('bg-white', 'shadow-sm', 'text-neutral-950');
    tabReg.classList.remove('text-neutral-500');
    tabLogin.classList.remove('bg-white', 'shadow-sm', 'text-neutral-950');
    tabLogin.classList.add('text-neutral-500');
  }
}

function checkAuthSession() {
  const authScreen = document.getElementById('auth-screen');
  const adminApp = document.getElementById('admin-app');
  const userDisplay = document.getElementById('admin-user-display');

  const session = localStorage.getItem('kyb_admin_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user && user.email) {
        authScreen.classList.add('hidden');
        adminApp.classList.remove('hidden');
        if (userDisplay) userDisplay.textContent = `👤 ${user.name || user.email}`;
        loadAllData();
        return;
      }
    } catch (e) {}
  }

  // Not logged in: show lock screen
  authScreen.classList.remove('hidden');
  adminApp.classList.add('hidden');
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  // Try Supabase Auth if client is configured
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (!error && data && data.user) {
        const session = { email: data.user.email, name: data.user.user_metadata?.name || data.user.email };
        localStorage.setItem('kyb_admin_session', JSON.stringify(session));
        checkAuthSession();
        showAdminToast('Signed in securely via Supabase Auth');
        return;
      }
    } catch (e) {
      console.warn('Supabase auth sign-in skipped, checking local admins');
    }
  }

  // Check custom created administrators or default owner
  const adminsRaw = localStorage.getItem('kyb_admins') || '[]';
  let admins = [];
  try { admins = JSON.parse(adminsRaw); } catch (e) {}

  const matched = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password) ||
    (email.toLowerCase() === DEFAULT_OWNER.email.toLowerCase() && password === DEFAULT_OWNER.password ? DEFAULT_OWNER : null);

  if (matched) {
    const session = { email: matched.email, name: matched.name };
    localStorage.setItem('kyb_admin_session', JSON.stringify(session));
    checkAuthSession();
    showAdminToast(`Welcome back, ${matched.name}!`);
  } else {
    alert('Access Denied. Invalid email or password. Please try again.');
  }
}

async function handleAdminRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  if (!name || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  // If Supabase is connected, sign up via Supabase Auth
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) {
        console.warn('Supabase sign-up note:', error.message);
      }
    } catch (e) {}
  }

  // Save admin to secure registry
  const adminsRaw = localStorage.getItem('kyb_admins') || '[]';
  let admins = [];
  try { admins = JSON.parse(adminsRaw); } catch (e) {}

  if (admins.some(a => a.email.toLowerCase() === email.toLowerCase())) {
    alert('An administrator with this email already exists.');
    return;
  }

  admins.push({ name, email, password, createdAt: new Date().toISOString() });
  localStorage.setItem('kyb_admins', JSON.stringify(admins));

  // Log in immediately
  localStorage.setItem('kyb_admin_session', JSON.stringify({ name, email }));
  checkAuthSession();
  showAdminToast(`Administrator account for ${name} created!`);
}

function handleAdminLogout() {
  localStorage.removeItem('kyb_admin_session');
  if (supabaseClient) {
    supabaseClient.auth.signOut().catch(() => {});
  }
  checkAuthSession();
}

// -------------------------------------------------------------
// 2. MAIN SECTIONS NAVIGATION
// -------------------------------------------------------------
function switchMainSection(section) {
  const sections = ['orders', 'products', 'enquiries', 'settings'];
  sections.forEach(s => {
    const secEl = document.getElementById(`section-${s}`);
    const navBtn = document.getElementById(`nav-section-${s}`);
    if (s === section) {
      if (secEl) secEl.classList.remove('hidden');
      if (navBtn) {
        navBtn.classList.add('bg-neutral-950', 'text-white');
        navBtn.classList.remove('text-neutral-600', 'hover:bg-neutral-100');
      }
    } else {
      if (secEl) secEl.classList.add('hidden');
      if (navBtn) {
        navBtn.classList.remove('bg-neutral-950', 'text-white');
        navBtn.classList.add('text-neutral-600', 'hover:bg-neutral-100');
      }
    }
  });
}

// -------------------------------------------------------------
// 3. DATA LOADING (ORDERS, PRODUCTS, ENQUIRIES, SETTINGS)
// -------------------------------------------------------------
async function loadAllData() {
  await Promise.all([
    loadOrders(),
    loadProducts(),
    loadEnquiries(),
    loadSettings()
  ]);
  showAdminToast('All data synchronized with database');
}

// Setup Supabase Client
function initSupabaseClient() {
  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_key');
  const dot = document.getElementById('supabase-status-dot');
  const text = document.getElementById('supabase-status-text');

  if (savedUrl && savedKey && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(savedUrl, savedKey);
      if (dot) {
        dot.classList.remove('bg-amber-400');
        dot.classList.add('bg-emerald-500');
      }
      if (text) text.textContent = 'Supabase: Connected';
      subscribeToRealtime();
    } catch (e) {
      console.error('Supabase init error:', e);
    }
  } else {
    if (dot) {
      dot.classList.remove('bg-emerald-500');
      dot.classList.add('bg-amber-400');
    }
    if (text) text.textContent = 'Local Database';
  }
}

function subscribeToRealtime() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => loadEnquiries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => loadSettings())
      .subscribe();
  } catch (e) {}
}

// --- ORDERS ---
async function loadOrders() {
  let loaded = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) loaded = data;
    } catch (e) {}
  }

  if (loaded.length === 0) {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.orders && json.orders.length > 0) {
          loaded = json.orders.map(o => ({
            order_reference: o.orderId || o.order_reference,
            tracking_number: o.trackingNumber || o.tracking_number,
            customer_name: (o.customer && o.customer.fullName) || o.customer_name,
            customer_phone: (o.customer && o.customer.phone) || o.customer_phone,
            customer_email: (o.customer && o.customer.email) || o.customer_email,
            delivery_address: (o.customer && o.customer.deliveryAddress) || o.delivery_address,
            product_id: (o.item && o.item.id) || o.product_id,
            product_name: (o.item && o.item.name) || o.product_name,
            quantity: (o.item && o.item.quantity) || o.quantity || 1,
            color: (o.item && o.item.color) || o.color || 'Milky White',
            personalization: (o.item && o.item.personalization) || o.personalization || '',
            delivery_notes: (o.item && o.item.notes) || o.delivery_notes || '',
            status: o.status === 'Completed' || o.is_completed ? 'completed' : (o.status || 'in_crafting'),
            is_completed: o.status === 'Completed' || o.is_completed === true,
            created_at: o.createdAt || o.created_at || new Date().toISOString()
          }));
        }
      }
    } catch (e) {}
  }

  // Deduplicate
  const map = new Map();
  loaded.forEach(o => map.set(o.order_reference, o));
  allOrders = Array.from(map.values());

  updateMetricCards();
  renderOrdersTable();
}

function updateMetricCards() {
  const total = allOrders.length;
  const completed = allOrders.filter(o => o.is_completed || o.status === 'completed').length;
  const pending = total - completed;
  const totalItems = allOrders.reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 1), 0);

  const elTotal = document.getElementById('stat-total-orders');
  const elPending = document.getElementById('stat-pending-orders');
  const elComp = document.getElementById('stat-completed-orders');
  const elItems = document.getElementById('stat-total-items');

  if (elTotal) elTotal.textContent = total;
  if (elPending) elPending.textContent = pending;
  if (elComp) elComp.textContent = completed;
  if (elItems) elItems.textContent = totalItems;

  const bAll = document.getElementById('badge-count-all');
  const bPending = document.getElementById('badge-count-not-completed');
  const bComp = document.getElementById('badge-count-completed');
  const bNavOrders = document.getElementById('badge-nav-orders');

  if (bAll) bAll.textContent = total;
  if (bPending) bPending.textContent = pending;
  if (bComp) bComp.textContent = completed;
  if (bNavOrders) bNavOrders.textContent = pending;
}

function setTabFilter(tab) {
  currentTab = tab;
  ['all', 'not_completed', 'completed'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (!btn) return;
    if (t === tab) {
      btn.classList.add('bg-neutral-950', 'text-white');
      btn.classList.remove('bg-neutral-100', 'text-neutral-700');
    } else {
      btn.classList.remove('bg-neutral-950', 'text-white');
      btn.classList.add('bg-neutral-100', 'text-neutral-700');
    }
  });
  renderOrdersTable();
}

function handleSearch(val) {
  searchQuery = val.trim();
  renderOrdersTable();
}

function handleProductFilter(val) {
  productFilter = val;
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  const emptyState = document.getElementById('orders-empty-state');
  if (!tbody) return;

  let filtered = allOrders;

  if (currentTab === 'not_completed') {
    filtered = filtered.filter(o => !o.is_completed && o.status !== 'completed');
  } else if (currentTab === 'completed') {
    filtered = filtered.filter(o => o.is_completed || o.status === 'completed');
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(o =>
      (o.order_reference && o.order_reference.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(q)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
      (o.product_name && o.product_name.toLowerCase().includes(q))
    );
  }

  if (productFilter !== 'all') {
    filtered = filtered.filter(o => o.product_id === productFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(order => {
    const isComp = order.is_completed || order.status === 'completed';
    const statusBadge = isComp
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Completed
         </span>`
      : order.status === 'dispatched'
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-600"></span> Dispatched
         </span>`
      : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Not Completed
         </span>`;

    return `
      <tr class="hover:bg-neutral-50/80 transition ${isComp ? 'opacity-85' : 'bg-white'}">
        <td class="py-4 px-4 align-top font-mono">
          <div class="font-bold text-neutral-950">${order.order_reference}</div>
          <div class="text-[10px] text-neutral-400 mt-0.5">${formatDate(order.created_at)}</div>
          <div class="text-[10px] text-neutral-500 mt-1">${order.tracking_number}</div>
        </td>
        <td class="py-4 px-4 align-top">
          <div class="font-bold text-neutral-900 text-xs">${order.customer_name}</div>
          <div class="text-neutral-500 text-[11px] mt-0.5">📞 <a href="tel:${order.customer_phone}" class="hover:underline">${order.customer_phone}</a></div>
          <div class="text-neutral-500 text-[11px]">✉️ <a href="mailto:${order.customer_email}" class="hover:underline">${order.customer_email}</a></div>
        </td>
        <td class="py-4 px-4 align-top">
          <div class="font-bold text-neutral-950">${order.product_name}</div>
          <div class="text-xs text-neutral-600 mt-0.5">
            Qty: <strong class="font-bold text-neutral-900">${order.quantity}</strong> • Color: ${order.color}
          </div>
          ${order.personalization ? `<div class="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">✨ ${order.personalization}</div>` : ''}
        </td>
        <td class="py-4 px-4 align-top max-w-xs">
          <div class="text-neutral-700 leading-relaxed text-[11px]">${order.delivery_address}</div>
          ${order.delivery_notes ? `<div class="text-[10px] text-neutral-500 italic mt-1">Note: "${order.delivery_notes}"</div>` : ''}
        </td>
        <td class="py-4 px-4 align-top text-center whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="py-4 px-4 align-top text-right whitespace-nowrap space-x-1">
          <button 
            type="button" 
            onclick="toggleOrderCompleted('${order.order_reference}')" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${isComp ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'}"
          >
            ${isComp ? '↩️ Re-open' : '✓ Mark Completed'}
          </button>
          <button 
            type="button" 
            onclick="viewOrderDetail('${order.order_reference}')" 
            class="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition"
          >
            Details
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleOrderCompleted(orderRef) {
  const order = allOrders.find(o => o.order_reference === orderRef);
  if (!order) return;

  const newStatus = (order.is_completed || order.status === 'completed') ? 'in_crafting' : 'completed';
  const newIsCompleted = newStatus === 'completed';

  order.status = newStatus;
  order.is_completed = newIsCompleted;

  // Update Supabase
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('orders')
        .update({ status: newStatus, is_completed: newIsCompleted })
        .eq('order_reference', orderRef);
    } catch (e) {}
  }

  // Update local server
  try {
    await fetch(`/api/orders/${orderRef}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderRef, status: newStatus, isCompleted: newIsCompleted })
    });
  } catch (e) {}

  updateMetricCards();
  renderOrdersTable();
  showAdminToast(`Order ${orderRef} updated to ${newStatus}`);
}

function viewOrderDetail(orderRef) {
  const order = allOrders.find(o => o.order_reference === orderRef);
  if (!order) return;

  const modal = document.getElementById('order-detail-modal');
  const content = document.getElementById('order-detail-content');
  if (!modal || !content) return;

  const isComp = order.is_completed || order.status === 'completed';

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <span class="text-xs uppercase tracking-wider text-neutral-400 font-bold">Order Details</span>
          <h3 class="text-xl font-bold text-neutral-950 font-mono">${order.order_reference}</h3>
        </div>
        <div>
          ${isComp 
            ? '<span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Completed</span>'
            : '<span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">Not Completed</span>'}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="p-4 bg-[#FAF8F5] rounded-xl border border-neutral-200 space-y-1.5">
          <div class="font-bold text-neutral-900">Customer Details</div>
          <div>Name: <strong>${order.customer_name}</strong></div>
          <div>Phone: <a href="tel:${order.customer_phone}" class="underline font-bold">${order.customer_phone}</a></div>
          <div>Email: <a href="mailto:${order.customer_email}" class="underline">${order.customer_email}</a></div>
          <div class="pt-1">Address: <span class="font-medium">${order.delivery_address}</span></div>
        </div>

        <div class="p-4 bg-[#FAF8F5] rounded-xl border border-neutral-200 space-y-1.5">
          <div class="font-bold text-neutral-900">Item & Craft Details</div>
          <div>Product: <strong>${order.product_name}</strong></div>
          <div>Quantity: <strong>${order.quantity}</strong></div>
          <div>Color: <strong>${order.color}</strong></div>
          <div>Personalization: <em>${order.personalization || 'None'}</em></div>
          <div>Special Notes: <em>${order.delivery_notes || 'None'}</em></div>
        </div>
      </div>

      <div class="pt-4 border-t border-neutral-200 flex items-center justify-between">
        <button 
          type="button" 
          onclick="toggleOrderCompleted('${order.order_reference}'); closeOrderDetailModal();" 
          class="px-5 py-2.5 rounded-xl font-bold text-xs ${isComp ? 'bg-neutral-200 text-neutral-800' : 'bg-emerald-600 text-white'}"
        >
          ${isComp ? 'Re-open Order' : 'Mark as Completed'}
        </button>
        <button 
          type="button" 
          onclick="closeOrderDetailModal()" 
          class="px-5 py-2.5 bg-neutral-950 text-white rounded-xl font-bold text-xs"
        >
          Close
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeOrderDetailModal() {
  const modal = document.getElementById('order-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// -------------------------------------------------------------
// 4. PRODUCTS MANAGEMENT (ADD, EDIT, UPLOAD PICTURES, DELETE)
// -------------------------------------------------------------
async function loadProducts() {
  let loaded = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        loaded = data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          categoryLabel: p.category_label || p.categoryLabel,
          image: p.image,
          tag: p.tag,
          stock: p.stock,
          stockStatus: p.stock_status || p.stockStatus,
          stockAlert: p.stock_alert || p.stockAlert,
          description: p.description,
          colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        }));
      }
    } catch (e) {}
  }

  if (loaded.length === 0) {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        if (json.products) loaded = json.products;
      }
    } catch (e) {}
  }

  allProducts = loaded;
  const bNav = document.getElementById('badge-nav-products');
  if (bNav) bNav.textContent = allProducts.length;

  populateProductDropdowns();
  renderProductsGrid();
}

function populateProductDropdowns() {
  const filterSelect = document.getElementById('admin-product-filter');
  const manualSelect = document.getElementById('manual-product-select');

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">All Products</option>' + 
      allProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  if (manualSelect) {
    manualSelect.innerHTML = allProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}

function renderProductsGrid() {
  const grid = document.getElementById('admin-products-grid');
  if (!grid) return;

  grid.innerHTML = allProducts.map(p => `
    <div class="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col justify-between">
      <div class="relative aspect-[4/3] bg-neutral-100 overflow-hidden group">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div class="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          ${p.tag || p.categoryLabel}
        </div>
        <div class="absolute bottom-3 left-3 bg-white/95 text-neutral-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-neutral-200">
          Stock: ${p.stock} units
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="text-[10px] uppercase font-bold text-neutral-400 mb-1">${p.categoryLabel}</div>
          <h3 class="font-bold text-base text-neutral-950 mb-1 leading-snug">${p.name}</h3>
          <p class="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-4">${p.description}</p>
        </div>

        <div class="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span class="text-xs text-emerald-700 font-semibold">${p.stockStatus}</span>
          <button 
            type="button" 
            onclick="openProductModal('${p.id}')" 
            class="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            ✏️ Edit Product
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const delBtn = document.getElementById('btn-delete-product');
  if (!modal) return;

  document.getElementById('form-product').reset();

  if (productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;
    title.textContent = `Edit "${p.name}"`;
    if (delBtn) delBtn.classList.remove('hidden');

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-tag').value = p.tag || '';
    document.getElementById('prod-stock').value = p.stock || 5;
    document.getElementById('prod-stockStatus').value = p.stockStatus || 'In Stock / Available';
    document.getElementById('prod-description').value = p.description || '';
    document.getElementById('prod-image-url').value = p.image || '';
    document.getElementById('prod-image-preview').src = p.image || '/images/cloud-clutch.jpeg';

    const colorStr = (p.colors || []).map(c => `${c.name}:${c.hex}`).join(', ');
    document.getElementById('prod-colors').value = colorStr;

    const featStr = (p.features || []).join('\n');
    document.getElementById('prod-features').value = featStr;
  } else {
    title.textContent = 'Add New Product';
    if (delBtn) delBtn.classList.add('hidden');
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-image-preview').src = '/images/cloud-clutch.jpeg';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Picture upload file reader
function handleImageFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    document.getElementById('prod-image-preview').src = base64;
    document.getElementById('prod-image-url').value = base64;

    // Send to upload API
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, filename: file.name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          document.getElementById('prod-image-url').value = data.url;
          document.getElementById('prod-image-preview').src = data.url;
        }
      }
    } catch (err) {}
  };
  reader.readAsDataURL(file);
}

async function saveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('prod-id').value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const tag = document.getElementById('prod-tag').value.trim();
  const stock = parseInt(document.getElementById('prod-stock').value, 10) || 5;
  const stockStatus = document.getElementById('prod-stockStatus').value.trim();
  const description = document.getElementById('prod-description').value.trim();
  const image = document.getElementById('prod-image-url').value.trim() || '/images/cloud-clutch.jpeg';
  const colorsRaw = document.getElementById('prod-colors').value.trim();
  const featuresRaw = document.getElementById('prod-features').value.trim();

  const colors = colorsRaw
    ? colorsRaw.split(',').map((c, idx) => {
        const parts = c.split(':');
        return { name: parts[0]?.trim() || 'Custom', hex: parts[1]?.trim() || '#FAF7F2', default: idx === 0 };
      })
    : [{ name: 'Default', hex: '#FAF7F2', default: true }];

  const features = featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : ['100% Artisan Handmade'];

  const categoryLabel = category === 'clothes' ? 'Knitwear & Clothes' : category === 'gifts' ? 'Gift & Accessories' : 'Signature Knot Bags';

  const productData = {
    id: id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    name,
    category,
    categoryLabel,
    image,
    tag: tag || 'Handcrafted',
    stock,
    stockStatus,
    stockAlert: `${stock} pieces ready to dispatch`,
    description,
    colors,
    features
  };

  // 1. Supabase insert/update
  if (supabaseClient) {
    try {
      await supabaseClient.from('products').upsert({
        id: productData.id,
        name: productData.name,
        category: productData.category,
        category_label: productData.categoryLabel,
        image: productData.image,
        tag: productData.tag,
        stock: productData.stock,
        stock_status: productData.stockStatus,
        stock_alert: productData.stockAlert,
        description: productData.description,
        colors: JSON.stringify(productData.colors),
        features: JSON.stringify(productData.features)
      });
    } catch (e) {}
  }

  // 2. Server API
  try {
    const method = id ? 'PUT' : 'POST';
    await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
  } catch (e) {}

  closeProductModal();
  await loadProducts();
  showAdminToast(`Product "${productData.name}" saved successfully!`);
}

async function deleteCurrentProduct() {
  const id = document.getElementById('prod-id').value;
  if (!id) return;

  if (!confirm(`Are you sure you want to delete this product? It will be removed from your storefront.`)) return;

  if (supabaseClient) {
    try { await supabaseClient.from('products').delete().eq('id', id); } catch (e) {}
  }

  try {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
  } catch (e) {}

  closeProductModal();
  await loadProducts();
  showAdminToast('Product removed');
}

// -------------------------------------------------------------
// 5. CUSTOMER ENQUIRIES
// -------------------------------------------------------------
async function loadEnquiries() {
  let loaded = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) loaded = data;
    } catch (e) {}
  }

  if (loaded.length === 0) {
    try {
      const res = await fetch('/api/enquiries');
      if (res.ok) {
        const json = await res.json();
        if (json.enquiries) loaded = json.enquiries;
      }
    } catch (e) {}
  }

  allEnquiries = loaded;
  const bNav = document.getElementById('badge-nav-enquiries');
  const newCount = allEnquiries.filter(e => e.status === 'new').length;
  if (bNav) bNav.textContent = newCount;

  renderEnquiriesTable();
}

function renderEnquiriesTable() {
  const tbody = document.getElementById('enquiries-table-body');
  const emptyState = document.getElementById('enquiries-empty-state');
  if (!tbody) return;

  if (allEnquiries.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = allEnquiries.map(enq => `
    <tr class="hover:bg-neutral-50/80 transition">
      <td class="py-4 px-4 align-top font-mono">
        <div class="font-bold text-neutral-950">${enq.id}</div>
        <div class="text-[10px] text-neutral-400 mt-0.5">${formatDate(enq.created_at)}</div>
      </td>
      <td class="py-4 px-4 align-top">
        <div class="font-bold text-neutral-950">${enq.customer_name || enq.name}</div>
        <div class="text-neutral-500 text-[11px]">✉️ <a href="mailto:${enq.customer_email || enq.email}" class="hover:underline">${enq.customer_email || enq.email}</a></div>
        ${enq.customer_phone || enq.phone ? `<div class="text-neutral-500 text-[11px]">📞 ${enq.customer_phone || enq.phone}</div>` : ''}
      </td>
      <td class="py-4 px-4 align-top font-semibold text-neutral-900">${enq.subject}</td>
      <td class="py-4 px-4 align-top max-w-md">
        <div class="text-neutral-700 leading-relaxed text-xs">${enq.message}</div>
      </td>
      <td class="py-4 px-4 align-top text-center whitespace-nowrap">
        ${enq.status === 'replied'
          ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">Replied</span>'
          : '<span class="px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full">New Message</span>'}
      </td>
      <td class="py-4 px-4 align-top text-right whitespace-nowrap space-x-1">
        <a 
          href="mailto:${enq.customer_email || enq.email}?subject=${encodeURIComponent('Re: ' + enq.subject)}" 
          onclick="markEnquiryReplied('${enq.id}')" 
          class="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold inline-block"
        >
          Reply by Email
        </a>
      </td>
    </tr>
  `).join('');
}

async function markEnquiryReplied(id) {
  const enq = allEnquiries.find(x => x.id === id);
  if (enq) enq.status = 'replied';

  if (supabaseClient) {
    try { await supabaseClient.from('enquiries').update({ status: 'replied' }).eq('id', id); } catch (e) {}
  }
  try {
    await fetch('/api/enquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'replied' })
    });
  } catch (e) {}

  renderEnquiriesTable();
}

// -------------------------------------------------------------
// 6. WEBSITE SETTINGS & CONTENT
// -------------------------------------------------------------
async function loadSettings() {
  let loaded = {};

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('site_settings').select('*');
      if (!error && Array.isArray(data)) {
        data.forEach(row => {
          loaded[row.key] = row.value;
        });
      }
    } catch (e) {}
  }

  if (Object.keys(loaded).length === 0) {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.settings) loaded = json.settings;
      }
    } catch (e) {}
  }

  siteSettings = loaded;
  populateSettingsForm();
}

function populateSettingsForm() {
  const map = {
    'cfg-announcement': siteSettings.announcement || '✨ Discounts available sometimes for newsletter subscribers!',
    'cfg-heroHeadline': siteSettings.heroHeadline || siteSettings.hero_headline || 'Handmade Knot with Love',
    'cfg-heroSubheadline': siteSettings.heroSubheadline || siteSettings.hero_subheadline || 'Borse fatte a mano all\'uncinetto. Knot-by-knot handcrafted bags & heirloom clothes directly for your everyday rhythm.',
    'cfg-phone': siteSettings.phone || siteSettings.phone_number || '3319565982',
    'cfg-email': siteSettings.email || siteSettings.email_address || 'fabianojessica6@gmail.com',
    'cfg-hours': siteSettings.hours || siteSettings.service_hours || 'Open 24/7, 6 days a week, 365 days a year',
    'cfg-instagram': siteSettings.instagram || siteSettings.instagram_handle || '@knotyourbag',
    'cfg-aboutQuote': siteSettings.aboutQuote || siteSettings.founder_quote_it || 'È un marchio che rappresenta un negozio di borse fatte a mano all\'uncinetto. L\'ho scelto perché secondo me è un bel marchio che riesce a far capire cosa vende l\'artigiano ovvero il gomitolo e l\'uncinetto.',
    'cfg-aboutQuote2': siteSettings.aboutQuote2 || siteSettings.founder_quote_it_2 || 'Inoltre ritengo che l\'artigianato sia un ottimo settore poco conosciuto su cui costruire qualcosa.',
    'cfg-aboutAuthor': siteSettings.aboutAuthor || siteSettings.founder_author || 'Jessica Fabiano'
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

async function saveSiteSettings(event) {
  event.preventDefault();

  const updates = {
    announcement: document.getElementById('cfg-announcement').value.trim(),
    heroHeadline: document.getElementById('cfg-heroHeadline').value.trim(),
    heroSubheadline: document.getElementById('cfg-heroSubheadline').value.trim(),
    phone: document.getElementById('cfg-phone').value.trim(),
    email: document.getElementById('cfg-email').value.trim(),
    hours: document.getElementById('cfg-hours').value.trim(),
    instagram: document.getElementById('cfg-instagram').value.trim(),
    aboutQuote: document.getElementById('cfg-aboutQuote').value.trim(),
    aboutQuote2: document.getElementById('cfg-aboutQuote2').value.trim(),
    aboutAuthor: document.getElementById('cfg-aboutAuthor').value.trim()
  };

  // 1. Supabase save
  if (supabaseClient) {
    try {
      const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
      await supabaseClient.from('site_settings').upsert(rows);
    } catch (e) {}
  }

  // 2. Local/Vercel server save
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (e) {}

  siteSettings = { ...siteSettings, ...updates };
  showAdminToast('Website content saved & updated on live website! ✨');
}

// -------------------------------------------------------------
// 7. MANUAL ORDER MODAL
// -------------------------------------------------------------
function openNewOrderModal() {
  const modal = document.getElementById('new-order-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeNewOrderModal() {
  const modal = document.getElementById('new-order-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveNewManualOrder(event) {
  event.preventDefault();
  const name = document.getElementById('manual-name').value.trim();
  const phone = document.getElementById('manual-phone').value.trim();
  const email = document.getElementById('manual-email').value.trim();
  const address = document.getElementById('manual-address').value.trim();
  const productId = document.getElementById('manual-product-select').value;
  const quantity = parseInt(document.getElementById('manual-quantity').value, 10) || 1;
  const color = document.getElementById('manual-color').value.trim() || 'Milky White';

  const payload = {
    fullName: name,
    phone,
    email,
    deliveryAddress: address,
    productId,
    quantity,
    color,
    personalization: color,
    notes: 'Manual artisan order'
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      closeNewOrderModal();
      await loadOrders();
      showAdminToast(`Manual order ${data.order.orderId} created!`);
    }
  } catch (e) {
    alert('Failed to save manual order');
  }
}

// -------------------------------------------------------------
// 8. SUPABASE MODAL & HELPERS
// -------------------------------------------------------------
function openSupabaseModal() {
  const modal = document.getElementById('supabase-modal');
  if (!modal) return;
  document.getElementById('cfg-supabase-url').value = localStorage.getItem('supabase_url') || '';
  document.getElementById('cfg-supabase-key').value = localStorage.getItem('supabase_key') || '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSupabaseModal() {
  const modal = document.getElementById('supabase-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function saveSupabaseConfig() {
  const url = document.getElementById('cfg-supabase-url').value.trim();
  const key = document.getElementById('cfg-supabase-key').value.trim();
  if (!url || !key) {
    alert('Please provide your Supabase URL and Anon Key.');
    return;
  }
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  initSupabaseClient();
  closeSupabaseModal();
  loadAllData();
}

function clearSupabaseConfig() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  supabaseClient = null;
  initSupabaseClient();
  closeSupabaseModal();
  loadAllData();
}

function showAdminToast(msg) {
  const toast = document.getElementById('admin-toast');
  const msgEl = document.getElementById('admin-toast-message');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3500);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}
