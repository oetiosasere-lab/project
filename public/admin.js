// knotyourbag — Seller Admin Dashboard Application Logic
let allOrders = [];
let currentTab = 'all';
let searchQuery = '';
let productFilter = 'all';
let supabaseClient = null;

// Initial demonstration orders that mirror supabase_schema.sql
const DEMO_ORDERS = [
  {
    order_reference: 'KYB-10842',
    tracking_number: 'TRACK-KNB-84201',
    customer_name: 'Elena Valenti',
    customer_phone: '3319565982',
    customer_email: 'elena.valenti@example.com',
    delivery_address: 'Via Monte Napoleone 14, Milan, Italy',
    product_id: 'cloud-clutch',
    product_name: 'The Cloud Knitted Clutch',
    quantity: 1,
    color: 'Milky White',
    personalization: 'Gold initials EV embroidered on tag',
    delivery_notes: 'Please gift wrap with ivory tissue',
    status: 'in_crafting',
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    order_reference: 'KYB-29401',
    tracking_number: 'TRACK-KNB-94012',
    customer_name: 'Sophie Mercier',
    customer_phone: '+33 6 12 34 56 78',
    customer_email: 'sophie.m@example.com',
    delivery_address: '24 Rue de Rivoli, Paris, France',
    product_id: 'baby-cardigan-set',
    product_name: 'Heirloom Baby Cardigan & Booties',
    quantity: 1,
    color: 'Pastel Blue',
    personalization: 'Size 3-6 months, wooden buttons',
    delivery_notes: 'Leave with building concierge',
    status: 'completed',
    is_completed: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    order_reference: 'KYB-38519',
    tracking_number: 'TRACK-KNB-51923',
    customer_name: 'Jessica Thornton',
    customer_phone: '+44 20 7946 0912',
    customer_email: 'jess.thornton@example.com',
    delivery_address: '72 Kensington High St, London, UK',
    product_id: 'indigo-knot',
    product_name: 'The Burano Deep Indigo Knot',
    quantity: 2,
    color: 'Deep Indigo',
    personalization: 'Custom 45cm strap length',
    delivery_notes: 'Ring bell twice upon delivery',
    status: 'pending',
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    order_reference: 'KYB-48190',
    tracking_number: 'TRACK-KNB-19034',
    customer_name: 'Marco Bellini',
    customer_phone: '3319565982',
    customer_email: 'marco.bellini@example.com',
    delivery_address: 'Piazza Navona 8, Rome, Italy',
    product_id: 'coastline-tote',
    product_name: 'The Coastline Bicolor Tote',
    quantity: 1,
    color: 'Espresso & Milk',
    personalization: 'Standard edition',
    delivery_notes: 'Fragile packaging requested',
    status: 'completed',
    is_completed: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    order_reference: 'KYB-59203',
    tracking_number: 'TRACK-KNB-20345',
    customer_name: 'Hannah Schmidt',
    customer_phone: '+49 30 123456',
    customer_email: 'hannah.schmidt@example.com',
    delivery_address: 'Friedrichstraße 42, Berlin, Germany',
    product_id: 'pearl-dew-barrel',
    product_name: 'The Pearl Dew Barrel Bag',
    quantity: 1,
    color: 'Pearl White',
    personalization: 'Extra reinforcement on handle base',
    delivery_notes: 'Deliver between 10am-4pm',
    status: 'dispatched',
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initSupabaseClient();
  await loadOrders();
});

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

      // Listen for realtime orders if supported
      subscribeToRealtimeOrders();
    } catch (e) {
      console.error('Supabase init error:', e);
    }
  } else {
    if (dot) {
      dot.classList.remove('bg-emerald-500');
      dot.classList.add('bg-amber-400');
    }
    if (text) text.textContent = 'Supabase: Demo Mode';
  }
}

// Fetch orders from Supabase (or fallback to Local Storage + Server API + Demo data)
async function loadOrders() {
  let loaded = [];

  // Try fetching directly from Supabase if connected
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        loaded = data;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local server', err);
    }
  }

  // Fallback to Server API /api/orders
  if (loaded.length === 0) {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.orders && json.orders.length > 0) {
          // Normalize server orders to match schema format
          const normalized = json.orders.map(o => ({
            order_reference: o.orderId,
            tracking_number: o.trackingNumber,
            customer_name: o.customer.fullName,
            customer_phone: o.customer.phone,
            customer_email: o.customer.email,
            delivery_address: o.customer.deliveryAddress,
            product_id: o.item.id,
            product_name: o.item.name,
            quantity: o.item.quantity,
            color: o.item.color,
            personalization: o.item.personalization,
            delivery_notes: o.item.notes,
            status: o.status === 'Completed' ? 'completed' : 'in_crafting',
            is_completed: o.status === 'Completed',
            created_at: o.createdAt
          }));
          loaded = normalized;
        }
      }
    } catch (err) {
      console.log('No backend API response, loading local demo state');
    }
  }

  // Check LocalStorage for freshly placed landing page orders
  const localOrdersRaw = localStorage.getItem('kyb_orders');
  let localOrders = [];
  if (localOrdersRaw) {
    try {
      localOrders = JSON.parse(localOrdersRaw);
    } catch (e) {}
  }

  // Merge loaded with demo and local, deduplicating by order_reference
  const combined = [...localOrders, ...loaded, ...DEMO_ORDERS];
  const uniqueMap = new Map();
  combined.forEach(o => {
    if (!uniqueMap.has(o.order_reference)) {
      uniqueMap.set(o.order_reference, o);
    }
  });

  allOrders = Array.from(uniqueMap.values());

  // Update metrics & render
  updateMetricCards();
  renderOrdersTable();
}

// Real-time updates from Supabase Realtime channel
function subscribeToRealtimeOrders() {
  if (!supabaseClient) return;

  try {
    supabaseClient
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        console.log('Realtime order change detected:', payload);
        loadOrders();
      })
      .subscribe();
  } catch (e) {
    console.log('Realtime subscription not active', e);
  }
}

// Render Orders Table
function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  const emptyState = document.getElementById('orders-empty-state');
  if (!tbody) return;

  // Filter based on tab
  let filtered = allOrders;

  if (currentTab === 'not_completed') {
    filtered = filtered.filter(o => !o.is_completed && o.status !== 'completed');
  } else if (currentTab === 'completed') {
    filtered = filtered.filter(o => o.is_completed || o.status === 'completed');
  }

  // Filter based on search input
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

  // Filter based on product
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
    const cleanPhone = (order.customer_phone || '').replace(/[^0-9+]/g, '');

    return `
      <tr class="hover:bg-neutral-50/80 transition-colors ${isComp ? 'bg-emerald-50/20' : ''}">
        
        <!-- 1. Order ID & Date -->
        <td class="py-4 px-4 align-top">
          <div class="font-mono font-extrabold text-xs text-neutral-950">${order.order_reference}</div>
          <div class="text-[10px] text-neutral-400 mt-0.5">${formatDate(order.created_at)}</div>
          <span class="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
            ${order.tracking_number || 'TRACK-PENDING'}
          </span>
        </td>

        <!-- 2. Customer Info -->
        <td class="py-4 px-4 align-top">
          <div class="font-bold text-sm text-neutral-950">${order.customer_name}</div>
          <div class="text-xs text-neutral-600 mt-0.5 flex items-center gap-1">
            <span>📞</span>
            <a href="tel:${cleanPhone}" class="hover:underline hover:text-neutral-950 font-medium">${order.customer_phone}</a>
          </div>
          <div class="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
            <span>✉️</span>
            <a href="mailto:${order.customer_email}" class="hover:underline hover:text-neutral-950">${order.customer_email}</a>
          </div>
        </td>

        <!-- 3. Item & Customization -->
        <td class="py-4 px-4 align-top max-w-xs">
          <div class="font-bold text-xs text-neutral-900">${order.product_name}</div>
          <div class="text-[11px] text-neutral-600 mt-0.5">
            Qty: <strong class="text-neutral-950">${order.quantity}</strong> • Color: <strong>${order.color}</strong>
          </div>
          ${order.personalization ? `
            <div class="mt-1.5 inline-block text-[10px] bg-amber-50 text-amber-900 border border-amber-200/70 rounded-lg px-2 py-0.5 leading-tight">
              🎨 <strong>Custom Note:</strong> ${order.personalization}
            </div>
          ` : ''}
          ${order.delivery_notes && order.delivery_notes !== 'None' ? `
            <div class="text-[10px] text-neutral-500 italic mt-1">📝 &ldquo;${order.delivery_notes}&rdquo;</div>
          ` : ''}
        </td>

        <!-- 4. Delivery Address -->
        <td class="py-4 px-4 align-top text-xs text-neutral-700 max-w-xs leading-relaxed">
          ${order.delivery_address}
        </td>

        <!-- 5. Status Badge & Selector -->
        <td class="py-4 px-4 align-top text-center">
          <div class="mb-2">
            ${getStatusPill(order.status, isComp)}
          </div>
          
          <select 
            onchange="updateOrderStatus('${order.order_reference}', this.value)"
            class="text-[11px] font-semibold px-2 py-1 rounded-lg border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:border-neutral-950 cursor-pointer shadow-sm"
          >
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="in_crafting" ${order.status === 'in_crafting' ? 'selected' : ''}>🧶 In Crafting</option>
            <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>🚚 Dispatched</option>
            <option value="completed" ${isComp ? 'selected' : ''}>✅ Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>

        <!-- 6. Fulfillment Actions -->
        <td class="py-4 px-4 align-top text-right space-y-1.5 whitespace-nowrap">
          
          <!-- One-click Toggle Completed -->
          <button 
            type="button" 
            onclick="toggleOrderCompleted('${order.order_reference}')" 
            class="w-full text-xs font-bold py-1.5 px-3 rounded-xl transition shadow-sm ${
              isComp 
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }"
          >
            ${isComp ? '↩ Re-open' : '✓ Mark Completed'}
          </button>

          <!-- WhatsApp Chat Button -->
          <a 
            href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(order.customer_name)}!%20This%20is%20knotyourbag%20regarding%20your%20handmade%20order%20${order.order_reference}"
            target="_blank" 
            class="block text-center w-full text-[11px] font-bold py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
          >
            💬 WhatsApp Buyer
          </a>

          <!-- Details Button -->
          <button 
            type="button" 
            onclick="openOrderDetailModal('${order.order_reference}')" 
            class="block w-full text-center text-[10px] font-semibold py-1 text-neutral-500 hover:text-neutral-950 hover:underline"
          >
            View Full Slip &rarr;
          </button>
        </td>

      </tr>
    `;
  }).join('');
}

// Return colorful status badge
function getStatusPill(status, isCompleted) {
  if (isCompleted || status === 'completed') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Completed
    </span>`;
  }
  if (status === 'in_crafting') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
      <span class="w-1.5 h-1.5 rounded-full bg-blue-600 pulse-indicator"></span> Handcrafting
    </span>`;
  }
  if (status === 'dispatched') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
      <span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span> Dispatched
    </span>`;
  }
  if (status === 'cancelled') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
      <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Cancelled
    </span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
    <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Pending
  </span>`;
}

// Status Update Handler
async function updateOrderStatus(orderRef, newStatus) {
  const isCompleted = (newStatus === 'completed');
  
  // Update in local array
  const order = allOrders.find(o => o.order_reference === orderRef);
  if (order) {
    order.status = newStatus;
    order.is_completed = isCompleted;
  }

  // Update in Supabase if connected
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({
          status: newStatus,
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('order_reference', orderRef);

      if (error) console.error('Supabase update error:', error);
    } catch (e) {
      console.warn('Could not sync to Supabase:', e);
    }
  }

  // Save to localStorage for demo persistence
  localStorage.setItem('kyb_orders', JSON.stringify(allOrders));

  updateMetricCards();
  renderOrdersTable();
}

// One-click Toggle Completed Handler
async function toggleOrderCompleted(orderRef) {
  const order = allOrders.find(o => o.order_reference === orderRef);
  if (!order) return;

  const willComplete = !order.is_completed;
  const newStatus = willComplete ? 'completed' : 'in_crafting';
  await updateOrderStatus(orderRef, newStatus);
}

// Filter Tabs
function setTabFilter(tab) {
  currentTab = tab;
  
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(t => {
    t.classList.remove('bg-neutral-950', 'text-white');
    t.classList.add('bg-neutral-100', 'text-neutral-700');
  });

  const active = document.getElementById(`tab-${tab}`);
  if (active) {
    active.classList.add('bg-neutral-950', 'text-white');
    active.classList.remove('bg-neutral-100', 'text-neutral-700');
  }

  renderOrdersTable();
}

// Search Handler
function handleSearch(val) {
  searchQuery = val.trim();
  renderOrdersTable();
}

// Product Filter Handler
function handleProductFilter(val) {
  productFilter = val;
  renderOrdersTable();
}

// Update Metric Cards & Badge Counts
function updateMetricCards() {
  const total = allOrders.length;
  const completed = allOrders.filter(o => o.is_completed || o.status === 'completed').length;
  const notCompleted = total - completed;
  const totalItems = allOrders.reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 1), 0);

  document.getElementById('stat-total-orders').textContent = total;
  document.getElementById('stat-pending-orders').textContent = notCompleted;
  document.getElementById('stat-completed-orders').textContent = completed;
  document.getElementById('stat-total-items').textContent = totalItems;

  document.getElementById('badge-count-all').textContent = total;
  document.getElementById('badge-count-not-completed').textContent = notCompleted;
  document.getElementById('badge-count-completed').textContent = completed;
}

// Full Order Slip Modal
function openOrderDetailModal(orderRef) {
  const order = allOrders.find(o => o.order_reference === orderRef);
  if (!order) return;

  const modal = document.getElementById('order-detail-modal');
  const content = document.getElementById('order-detail-content');
  if (!modal || !content) return;

  const isComp = order.is_completed || order.status === 'completed';

  content.innerHTML = `
    <div class="border-b border-neutral-200 pb-5 mb-5 flex items-center justify-between">
      <div>
        <span class="text-xs font-mono font-bold uppercase text-neutral-400">Order Reference</span>
        <h3 class="font-extrabold text-2xl text-neutral-950">${order.order_reference}</h3>
        <div class="text-xs text-neutral-500 mt-0.5">Placed on: ${formatDate(order.created_at)}</div>
      </div>
      <div>
        ${getStatusPill(order.status, isComp)}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
      
      <!-- Customer Information -->
      <div class="bg-[#FAF8F5] p-4 rounded-2xl border border-neutral-200">
        <h4 class="font-bold text-xs uppercase tracking-wider text-neutral-950 mb-3">Customer Profile</h4>
        <div class="space-y-2">
          <div><span class="text-neutral-500">Name:</span> <strong class="text-neutral-900">${order.customer_name}</strong></div>
          <div><span class="text-neutral-500">Phone:</span> <a href="tel:${order.customer_phone}" class="font-semibold text-neutral-900 underline">${order.customer_phone}</a></div>
          <div><span class="text-neutral-500">Email:</span> <a href="mailto:${order.customer_email}" class="font-semibold text-neutral-900 underline">${order.customer_email}</a></div>
          <div class="pt-2 border-t border-neutral-200"><span class="text-neutral-500">Delivery Address:</span><div class="font-medium text-neutral-800 leading-relaxed mt-0.5">${order.delivery_address}</div></div>
        </div>
      </div>

      <!-- Item & Customization Request -->
      <div class="bg-[#FAF8F5] p-4 rounded-2xl border border-neutral-200">
        <h4 class="font-bold text-xs uppercase tracking-wider text-neutral-950 mb-3">Handcrafting Specs</h4>
        <div class="space-y-2">
          <div><span class="text-neutral-500">Creation:</span> <strong class="text-neutral-900">${order.product_name}</strong></div>
          <div><span class="text-neutral-500">Quantity:</span> <strong class="text-neutral-900">${order.quantity} item(s)</strong></div>
          <div><span class="text-neutral-500">Selected Color:</span> <strong class="text-neutral-900">${order.color}</strong></div>
          <div><span class="text-neutral-500">Tracking Code:</span> <span class="font-mono font-bold text-neutral-900">${order.tracking_number || 'None'}</span></div>
          <div class="pt-2 border-t border-neutral-200">
            <span class="text-neutral-500">Custom Details & Personalization:</span>
            <div class="p-2 mt-1 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg leading-relaxed">
              ${order.personalization || 'None requested'}
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Actions -->
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
        Done
      </button>
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

// Supabase Setup Modal
function openSupabaseModal() {
  const modal = document.getElementById('supabase-modal');
  if (!modal) return;

  const urlInput = document.getElementById('cfg-supabase-url');
  const keyInput = document.getElementById('cfg-supabase-key');

  if (urlInput) urlInput.value = localStorage.getItem('supabase_url') || '';
  if (keyInput) keyInput.value = localStorage.getItem('supabase_key') || '';

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
    alert('Please provide both your Supabase URL and Anon Key.');
    return;
  }

  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);

  initSupabaseClient();
  closeSupabaseModal();
  loadOrders();
}

function clearSupabaseConfig() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  supabaseClient = null;
  initSupabaseClient();
  closeSupabaseModal();
  loadOrders();
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}
