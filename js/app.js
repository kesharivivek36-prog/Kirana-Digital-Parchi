/**
 * Digital Parchi - Kirana Grocery Web Application
 * Main Application Logic
 */

// Storage Key
const STORAGE_KEY = 'kirana_digital_parchi_orders_v1';
const SOUND_SETTING_KEY = 'kirana_digital_parchi_sound';

// State Variables
let currentOrders = [];
let currentView = 'customer'; // 'customer' | 'dashboard'
let currentGroceryInputMode = 'text'; // 'text' | 'builder'
let currentDynamicItems = [];
let currentFilter = 'active'; // 'all' | 'active' | 'pending' | 'packing' | 'ready' | 'completed'
let searchQuery = '';
let activeReadyOrderId = null;
let soundEnabled = true;
let audioCtx = null;

// ============================================================================
// 1. INITIALIZATION & STORAGE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Load Sound Preference
  const savedSound = localStorage.getItem(SOUND_SETTING_KEY);
  if (savedSound !== null) {
    soundEnabled = savedSound === 'true';
  }
  updateSoundUI();

  // Load Orders from LocalStorage
  loadOrdersFromStorage();

  // Attach Input Listeners
  initTextareaCounter();

  // Listen for Cross-Tab Storage Changes
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadOrdersFromStorage(false);
      showToast('Dashboard auto-synced from another tab', 'info');
    }
  });

  // Render initial icons
  lucide.createIcons();
});

/**
 * Loads orders from localStorage or seeds initial demo data
 */
function loadOrdersFromStorage(saveIfMissing = true) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentOrders = JSON.parse(raw);
    } else {
      currentOrders = typeof INITIAL_MOCK_ORDERS !== 'undefined' ? [...INITIAL_MOCK_ORDERS] : [];
      if (saveIfMissing && currentOrders.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
      }
    }
  } catch (err) {
    console.error('Error loading orders from localStorage:', err);
    currentOrders = typeof INITIAL_MOCK_ORDERS !== 'undefined' ? [...INITIAL_MOCK_ORDERS] : [];
  }

  updateDashboardUI();
}

/**
 * Saves current orders array to localStorage and updates UI
 */
function saveOrdersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
    updateDashboardUI();
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    showToast('Failed to save order to local storage', 'error');
  }
}

/**
 * Resets demo data to initial mock orders
 */
function resetDemoData() {
  if (confirm('Are you sure you want to reset orders back to demo data?')) {
    currentOrders = typeof INITIAL_MOCK_ORDERS !== 'undefined' ? JSON.parse(JSON.stringify(INITIAL_MOCK_ORDERS)) : [];
    saveOrdersToStorage();
    playChime(600, 800);
    showToast('Demo orders reloaded successfully!', 'success');
  }
}

// ============================================================================
// 2. VIEW SWITCHING & NAVIGATION
// ============================================================================

function switchView(viewName) {
  currentView = viewName;
  const customerView = document.getElementById('customer-view');
  const dashboardView = document.getElementById('dashboard-view');
  const navCustBtn = document.getElementById('nav-customer-btn');
  const navDashBtn = document.getElementById('nav-dashboard-btn');
  const quickBannerText = document.getElementById('quick-banner-text');
  const quickSwitchBtn = document.getElementById('quick-switch-btn');

  if (viewName === 'customer') {
    customerView.classList.remove('hidden');
    dashboardView.classList.add('hidden');

    // Button states
    navCustBtn.className = "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white text-emerald-700 shadow-sm";
    navDashBtn.className = "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900";

    quickBannerText.innerHTML = `You are on the <strong>Customer Order Page</strong>. Submit an order, then switch to the <strong>Shopkeeper Dashboard</strong> to view & process it!`;
    quickSwitchBtn.innerHTML = `Switch to Dashboard &rarr;`;
  } else {
    customerView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    // Button states
    navCustBtn.className = "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900";
    navDashBtn.className = "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white text-emerald-700 shadow-sm";

    quickBannerText.innerHTML = `You are on the <strong>Shopkeeper Dashboard</strong>. Process incoming orders, mark them ready, print slips, and send SMS alerts.`;
    quickSwitchBtn.innerHTML = `&larr; Switch to Customer Order`;

    // Re-render dashboard
    renderDashboard();
  }

  lucide.createIcons();
}

function toggleBetweenViews() {
  switchView(currentView === 'customer' ? 'dashboard' : 'customer');
}

// ============================================================================
// 3. CUSTOMER ORDER FORM LOGIC
// ============================================================================

/**
 * Toggles between WhatsApp-style free textarea and Dynamic Item Builder
 */
function setGroceryInputMode(mode) {
  currentGroceryInputMode = mode;
  const tabText = document.getElementById('tab-whatsapp-mode');
  const tabBuilder = document.getElementById('tab-builder-mode');
  const modeText = document.getElementById('grocery-mode-text');
  const modeBuilder = document.getElementById('grocery-mode-builder');

  if (mode === 'text') {
    tabText.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-emerald-700 shadow-sm flex items-center space-x-1.5 transition-all";
    tabBuilder.className = "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition-all";
    modeText.classList.remove('hidden');
    modeBuilder.classList.add('hidden');
  } else {
    tabBuilder.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-emerald-700 shadow-sm flex items-center space-x-1.5 transition-all";
    tabText.className = "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition-all";
    modeBuilder.classList.remove('hidden');
    modeText.classList.add('hidden');
  }
  lucide.createIcons();
}

/**
 * Parses a single line of grocery text into { name, quantity }
 * Supports formats like:
 *   "Aashirvaad Atta - 5Kg"
 *   "1. Aashirvaad Atta - 5 Kg"
 *   "Maggi 2-Minute Noodles - 4 packs"
 *   "Tata Salt : 1 packet"
 */
function parseGroceryLine(line) {
  let cleaned = line.replace(/^\s*(\d+[\.\)\-:]|\*|-)\s*/, '').trim();
  if (!cleaned) {
    return { name: '', quantity: '' };
  }

  // Prefer splitting on spaced separator (" - ", " – ", " — ", " : ") so hyphenated names like "2-Minute" stay intact
  const spacedMatch = cleaned.match(/^(.*?)\s+[-–—:]\s+(.+)$/);
  if (spacedMatch) {
    return {
      name: spacedMatch[1].trim(),
      quantity: spacedMatch[2].trim()
    };
  }

  // Fallback: split on the last hyphen/dash/colon
  const lastSepMatch = cleaned.match(/^(.*?)[\s]*[-–—:][\s]*([^-–—:]+)$/);
  if (lastSepMatch && lastSepMatch[1].trim()) {
    return {
      name: lastSepMatch[1].trim(),
      quantity: lastSepMatch[2].trim()
    };
  }

  // Fallback: detect trailing quantity (e.g. "Aashirvaad Atta 5Kg")
  const trailingQtyMatch = cleaned.match(/^(.+?)\s+(\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|l|ltr|litre|litres|ml|packet|packets|pkt|pkts|pack|packs|pc|pcs|piece|pieces|box|boxes|pouch|pouches|bottle|bottles|dozen|unit|units))$/i);
  if (trailingQtyMatch) {
    return {
      name: trailingQtyMatch[1].trim(),
      quantity: trailingQtyMatch[2].trim()
    };
  }

  return {
    name: cleaned,
    quantity: '1 unit'
  };
}

/**
 * Renders the structured 3-column grocery parchi from #grocery-text-input
 */
function renderStructuredParchiFromTextarea() {
  const textarea = document.getElementById('grocery-text-input');
  const rowsContainer = document.getElementById('parchi-items-rows');
  const countLabel = document.getElementById('text-line-count');
  const nextNumLabel = document.getElementById('parchi-next-num');

  if (!textarea || !rowsContainer) return;

  const lines = textarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (countLabel) {
    countLabel.textContent = `${lines.length} item${lines.length === 1 ? '' : 's'} detected`;
  }
  if (nextNumLabel) {
    nextNumLabel.textContent = `${lines.length + 1}.`;
  }

  if (lines.length === 0) {
    rowsContainer.innerHTML = `
      <div class="py-6 text-center text-slate-400 text-sm">
        Your parchi is empty. Type an item below or paste your grocery list.
      </div>
    `;
    return;
  }

  let html = '';
  lines.forEach((line, idx) => {
    const parsed = parseGroceryLine(line);
    html += `
      <div class="parchi-item-row cursor-pointer" onclick="toggleRawParchiEditor()" title="Click to edit grocery parchi">
        <span class="parchi-col-num">${idx + 1}.</span>
        <span class="parchi-col-name">${escapeHtml(parsed.name)}</span>
        <span class="parchi-col-qty">${escapeHtml(parsed.quantity)}</span>
      </div>
    `;
  });

  rowsContainer.innerHTML = html;
}

/**
 * Handles typing a single item or line in the bottom parchi quick input
 */
function handleParchiInlineKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const input = event.target;
    const val = input.value.trim();
    if (!val) return;

    const textarea = document.getElementById('grocery-text-input');
    const existingLines = textarea.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsed = parseGroceryLine(val);
    existingLines.push(`${existingLines.length + 1}. ${parsed.name} - ${parsed.quantity}`);
    textarea.value = existingLines.join('\n');
    input.value = '';
    renderStructuredParchiFromTextarea();
  }
}

/**
 * Handles pasting a single or multi-line grocery list directly into the parchi input
 */
function handleParchiInlinePaste(event) {
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  if (!pastedText) return;

  const pastedLines = pastedText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (pastedLines.length >= 1) {
    event.preventDefault();
    const textarea = document.getElementById('grocery-text-input');
    // If pasting multiple lines (a full grocery list), replace the parchi with the pasted list
    if (pastedLines.length > 1) {
      textarea.value = pastedLines.join('\n');
      showToast(`Pasted ${pastedLines.length} grocery items into parchi!`, 'success');
    } else {
      const existing = textarea.value.trim();
      textarea.value = existing ? `${existing}\n${pastedLines[0]}` : pastedLines[0];
    }
    event.target.value = '';
    renderStructuredParchiFromTextarea();
  }
}

/**
 * Toggles the raw multi-line textarea editor for bulk editing
 */
function toggleRawParchiEditor() {
  const wrap = document.getElementById('parchi-raw-editor-wrap');
  const structured = document.getElementById('parchi-structured-container');
  const label = document.getElementById('toggle-raw-parchi-label');
  const textarea = document.getElementById('grocery-text-input');

  if (!wrap || !structured) return;

  const isHidden = wrap.classList.contains('hidden');
  if (isHidden) {
    wrap.classList.remove('hidden');
    structured.classList.add('hidden');
    if (label) label.textContent = 'View Structured Parchi';
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  } else {
    closeRawParchiEditor();
  }
}

function closeRawParchiEditor() {
  const wrap = document.getElementById('parchi-raw-editor-wrap');
  const structured = document.getElementById('parchi-structured-container');
  const label = document.getElementById('toggle-raw-parchi-label');

  if (wrap) wrap.classList.add('hidden');
  if (structured) structured.classList.remove('hidden');
  if (label) label.textContent = 'Edit / Paste Text';
  renderStructuredParchiFromTextarea();
}

/**
 * In text mode: counts non-empty lines dynamically and syncs structured parchi
 */
function initTextareaCounter() {
  const textarea = document.getElementById('grocery-text-input');
  if (textarea) {
    textarea.addEventListener('input', () => {
      renderStructuredParchiFromTextarea();
    });

    // When pasting multi-line grocery items into the raw textarea, immediately format and show the structured parchi
    textarea.addEventListener('paste', () => {
      setTimeout(() => {
        renderStructuredParchiFromTextarea();
        closeRawParchiEditor();
      }, 40);
    });
  }

  renderStructuredParchiFromTextarea();
}

/**
 * Loads a sample grocery list for quick testing
 */
let sampleIdx = 1;
function loadSampleGroceryTemplate() {
  if (typeof SAMPLE_GROCERY_TEMPLATES !== 'undefined' && SAMPLE_GROCERY_TEMPLATES.length > 0) {
    const template = SAMPLE_GROCERY_TEMPLATES[sampleIdx % SAMPLE_GROCERY_TEMPLATES.length];
    sampleIdx++;
    const textarea = document.getElementById('grocery-text-input');
    textarea.value = template;
    closeRawParchiEditor();
    renderStructuredParchiFromTextarea();
    showToast('Sample grocery list loaded into parchi!', 'info');
  }
}

/**
 * Dynamic Item Builder Actions
 */
function addDynamicItem() {
  const nameInput = document.getElementById('builder-item-name');
  const qtyInput = document.getElementById('builder-item-qty');
  const name = nameInput.value.trim();
  const qty = qtyInput.value.trim() || '1 unit';

  if (!name) {
    showToast('Please enter an item name', 'error');
    nameInput.focus();
    return;
  }

  currentDynamicItems.push({
    id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name: name,
    quantity: qty,
    packed: false
  });

  nameInput.value = '';
  qtyInput.value = '';
  nameInput.focus();

  renderDynamicItemsList();
  showToast(`Added: ${name} (${qty})`, 'success');
}

function quickFillItem(name, qty) {
  document.getElementById('builder-item-name').value = name;
  document.getElementById('builder-item-qty').value = qty;
  addDynamicItem();
}

function removeDynamicItem(index) {
  currentDynamicItems.splice(index, 1);
  renderDynamicItemsList();
}

function clearDynamicItems() {
  if (currentDynamicItems.length === 0) return;
  currentDynamicItems = [];
  renderDynamicItemsList();
  showToast('Item list cleared', 'info');
}

function renderDynamicItemsList() {
  const container = document.getElementById('dynamic-items-list');
  const countSpan = document.getElementById('dynamic-items-count');
  countSpan.textContent = currentDynamicItems.length;

  if (currentDynamicItems.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-400 py-6 text-sm">No items added yet. Type an item above and click "Add".</p>`;
    return;
  }

  let html = '<div class="space-y-1">';
  currentDynamicItems.forEach((item, idx) => {
    html += `
      <div class="parchi-item-row group">
        <span class="parchi-col-num">${idx + 1}.</span>
        <span class="parchi-col-name">${escapeHtml(item.name)}</span>
        <span class="parchi-col-qty flex items-center justify-end space-x-2">
          <span>${escapeHtml(item.quantity)}</span>
          <button type="button" onclick="removeDynamicItem(${idx})" class="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove item">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </span>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
  lucide.createIcons();
}

/**
 * Order Type Switcher (Pickup vs Delivery)
 */
function handleOrderTypeChange(type) {
  const pickupCard = document.getElementById('order-type-pickup-card');
  const deliveryCard = document.getElementById('order-type-delivery-card');
  const pickupBox = document.getElementById('pickup-details-box');
  const deliveryBox = document.getElementById('delivery-details-box');
  const deliveryAddrInput = document.getElementById('cust-delivery-address');

  if (type === 'pickup') {
    pickupCard.className = "cursor-pointer border-2 rounded-xl p-4 flex items-start space-x-3 transition-all border-emerald-500 bg-emerald-50/50";
    deliveryCard.className = "cursor-pointer border-2 rounded-xl p-4 flex items-start space-x-3 transition-all border-slate-200 hover:border-slate-300 bg-white";
    pickupBox.classList.remove('hidden');
    deliveryBox.classList.add('hidden');
    deliveryAddrInput.removeAttribute('required');
  } else {
    deliveryCard.className = "cursor-pointer border-2 rounded-xl p-4 flex items-start space-x-3 transition-all border-emerald-500 bg-emerald-50/50";
    pickupCard.className = "cursor-pointer border-2 rounded-xl p-4 flex items-start space-x-3 transition-all border-slate-200 hover:border-slate-300 bg-white";
    pickupBox.classList.add('hidden');
    deliveryBox.classList.remove('hidden');
    deliveryAddrInput.setAttribute('required', 'true');
  }
}

function selectPickupPreset(text) {
  document.getElementById('cust-pickup-time').value = text;
  const buttons = document.querySelectorAll('.pickup-preset-btn');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === text || btn.textContent.includes(text.replace('minutes', 'mins'))) {
      btn.className = "pickup-preset-btn px-3 py-2 rounded-lg text-xs font-medium border border-emerald-500 bg-emerald-100/70 text-emerald-800 transition-all text-center";
    } else {
      btn.className = "pickup-preset-btn px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:border-emerald-500 hover:text-emerald-700 transition-all text-center";
    }
  });
}

/**
 * Customer Form Submission Handler
 */
function handleCustomerOrderSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  const notes = document.getElementById('cust-notes').value.trim();

  // Validate Phone
  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    document.getElementById('cust-phone').focus();
    return;
  }

  // Validate Delivery Address if delivery
  let deliveryAddress = '';
  let pickupTime = '';
  if (orderType === 'delivery') {
    deliveryAddress = document.getElementById('cust-delivery-address').value.trim();
    if (!deliveryAddress) {
      showToast('Please provide your complete delivery address', 'error');
      document.getElementById('cust-delivery-address').focus();
      return;
    }
  } else {
    pickupTime = document.getElementById('cust-pickup-time').value.trim() || 'In 30 mins';
  }

  // Determine Items based on active mode
  let items = [];
  let rawText = '';

  if (currentGroceryInputMode === 'text') {
    rawText = document.getElementById('grocery-text-input').value.trim();
    if (!rawText) {
      showToast('Please write or paste your grocery items list', 'error');
      document.getElementById('grocery-text-input').focus();
      return;
    }

    // Parse lines into item objects
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    items = lines.map((line, idx) => {
      const parsed = parseGroceryLine(line);
      return {
        id: `item-${Date.now()}-${idx}`,
        name: parsed.name,
        quantity: parsed.quantity,
        packed: false
      };
    });
  } else {
    if (currentDynamicItems.length === 0) {
      showToast('Please add at least one grocery item to your list', 'error');
      document.getElementById('builder-item-name').focus();
      return;
    }
    items = JSON.parse(JSON.stringify(currentDynamicItems));
    rawText = items.map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity}`).join('\n');
  }

  // Generate unique Order ID
  const nextNumber = currentOrders.length > 0 
    ? Math.max(...currentOrders.map(o => parseInt(o.id.replace(/\D/g, '') || 1000))) + 1 
    : 1001;
  const newOrderId = `DP-${nextNumber}`;

  // Build New Order Object
  const newOrder = {
    id: newOrderId,
    customerName: name,
    customerPhone: phone,
    orderType: orderType,
    pickupTime: pickupTime,
    deliveryAddress: deliveryAddress,
    specialNotes: notes,
    items: items,
    rawText: rawText,
    status: 'pending',
    billAmount: '',
    createdAt: new Date().toISOString()
  };

  // Add to state and save
  currentOrders.unshift(newOrder);
  saveOrdersToStorage();

  // Play audio chime
  playChime(523.25, 659.25); // C5 -> E5

  // Display Customer Success Modal
  showCustomerSuccessModal(newOrder);

  // Reset Customer Form
  resetCustomerForm();
}

function resetCustomerForm() {
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-phone').value = '';
  document.getElementById('grocery-text-input').value = '';
  document.getElementById('cust-notes').value = '';
  renderStructuredParchiFromTextarea();
  currentDynamicItems = [];
  renderDynamicItemsList();
}

function showCustomerSuccessModal(order) {
  document.getElementById('success-modal-order-id').textContent = `Order #${order.id}`;
  document.getElementById('success-modal-customer-info').textContent = `Thank you, ${order.customerName}! Your grocery list has been sent to the Sharma Kirana counter.`;
  document.getElementById('success-modal-type').textContent = order.orderType === 'pickup' ? 'Store Pickup (दुकान से पिकअप)' : 'Home Delivery (घर पर डिलीवरी)';
  
  if (order.orderType === 'pickup') {
    document.getElementById('success-modal-time-label').textContent = 'Pickup Time:';
    document.getElementById('success-modal-time-val').textContent = order.pickupTime;
  } else {
    document.getElementById('success-modal-time-label').textContent = 'Delivery Address:';
    document.getElementById('success-modal-time-val').textContent = order.deliveryAddress;
  }

  document.getElementById('success-modal-items-count').textContent = `${order.items.length} items`;

  const modal = document.getElementById('customer-success-modal');
  modal.classList.remove('hidden');
  modal.dataset.submittedOrderId = order.id;
  lucide.createIcons();
}

function closeCustomerSuccessModal() {
  document.getElementById('customer-success-modal').classList.add('hidden');
}

function viewSubmittedOrderInDashboard() {
  closeCustomerSuccessModal();
  switchView('dashboard');
  filterOrdersByStatus('all');
}

// ============================================================================
// 4. SHOPKEEPER DASHBOARD LOGIC
// ============================================================================

function updateDashboardUI() {
  updateStatusMetrics();
  renderDashboard();
}

function updateStatusMetrics() {
  const pendingCount = currentOrders.filter(o => o.status === 'pending').length;
  const packingCount = currentOrders.filter(o => o.status === 'packing').length;
  const readyCount = currentOrders.filter(o => o.status === 'ready').length;
  const completedCount = currentOrders.filter(o => o.status === 'completed').length;
  const activeCount = pendingCount + packingCount + readyCount;

  // Stat Cards
  document.getElementById('stat-pending-count').textContent = pendingCount;
  document.getElementById('stat-packing-count').textContent = packingCount;
  document.getElementById('stat-ready-count').textContent = readyCount;
  document.getElementById('stat-completed-count').textContent = completedCount;

  // Nav Pending Badge
  const navBadge = document.getElementById('nav-pending-badge');
  if (pendingCount > 0) {
    navBadge.textContent = `${pendingCount} New`;
    navBadge.classList.remove('hidden');
  } else {
    navBadge.classList.add('hidden');
  }

  // Filter Buttons Counts
  document.getElementById('count-filter-all').textContent = currentOrders.length;
  document.getElementById('count-filter-active').textContent = activeCount;
  document.getElementById('count-filter-pending').textContent = pendingCount;
  document.getElementById('count-filter-packing').textContent = packingCount;
  document.getElementById('count-filter-ready').textContent = readyCount;
  document.getElementById('count-filter-completed').textContent = completedCount;
}

function filterOrdersByStatus(status) {
  currentFilter = status;

  // Update filter buttons styling
  const buttons = document.querySelectorAll('.filter-tab-btn');
  buttons.forEach(btn => {
    btn.className = "filter-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap";
  });

  const activeBtn = document.getElementById(`filter-btn-${status}`);
  if (activeBtn) {
    if (status === 'pending') {
      activeBtn.className = "filter-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white whitespace-nowrap shadow-sm";
    } else if (status === 'packing') {
      activeBtn.className = "filter-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white whitespace-nowrap shadow-sm";
    } else if (status === 'ready') {
      activeBtn.className = "filter-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white whitespace-nowrap shadow-sm";
    } else {
      activeBtn.className = "filter-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white whitespace-nowrap shadow-sm";
    }
  }

  // Update heading
  const headingMap = {
    'all': 'All Store Orders',
    'active': 'Active Incoming Orders (Pending, Packing & Ready)',
    'pending': 'Pending Orders (Needs Packing)',
    'packing': 'Orders Currently Being Packed',
    'ready': 'Ready for Pickup / Out for Delivery',
    'completed': 'Order History (Completed & Delivered)'
  };
  document.getElementById('current-filter-heading').textContent = headingMap[status] || 'Orders Feed';

  renderDashboard();
}

function handleSearchOrders(query) {
  searchQuery = query.toLowerCase().trim();
  renderDashboard();
}

function renderDashboard() {
  const container = document.getElementById('orders-grid-container');
  const emptyState = document.getElementById('no-orders-empty-state');
  const countBadge = document.getElementById('current-orders-count-badge');

  // Filter Orders
  let filtered = currentOrders.filter(order => {
    // Status filter
    if (currentFilter === 'active') {
      if (order.status === 'completed' || order.status === 'cancelled') return false;
    } else if (currentFilter !== 'all') {
      if (order.status !== currentFilter) return false;
    }

    // Search query filter
    if (searchQuery) {
      const matchId = order.id.toLowerCase().includes(searchQuery);
      const matchName = order.customerName.toLowerCase().includes(searchQuery);
      const matchPhone = order.customerPhone.includes(searchQuery);
      const matchItems = order.items.some(i => i.name.toLowerCase().includes(searchQuery));
      return matchId || matchName || matchPhone || matchItems;
    }

    return true;
  });

  countBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  let cardsHtml = '';
  filtered.forEach(order => {
    cardsHtml += createOrderCardHtml(order);
  });

  container.innerHTML = cardsHtml;
  lucide.createIcons();
}

/**
 * Creates HTML for a single order card on the dashboard
 */
function createOrderCardHtml(order) {
  // Status Badge Configuration
  const statusConfig = {
    pending: {
      badge: '<span class="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1"><i data-lucide="clock" class="w-3 h-3"></i><span>Pending</span></span>',
      cardBorder: 'border-l-4 border-l-amber-500'
    },
    packing: {
      badge: '<span class="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center space-x-1"><i data-lucide="package" class="w-3 h-3"></i><span>Packing</span></span>',
      cardBorder: 'border-l-4 border-l-blue-500'
    },
    ready: {
      badge: '<span class="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1"><i data-lucide="check-circle" class="w-3 h-3"></i><span>Ready for Pickup</span></span>',
      cardBorder: 'border-l-4 border-l-emerald-500'
    },
    completed: {
      badge: '<span class="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1"><i data-lucide="archive" class="w-3 h-3"></i><span>Completed</span></span>',
      cardBorder: 'border-l-4 border-l-slate-400'
    }
  };

  const statusStyle = statusConfig[order.status] || statusConfig.pending;
  const isPickup = order.orderType === 'pickup';
  const timeFormatted = formatTimeAgo(order.createdAt);

  // Items Checklist
  let itemsChecklistHtml = '';
  order.items.forEach((item, idx) => {
    itemsChecklistHtml += `
      <li class="flex items-start justify-between py-1 border-b border-slate-100 last:border-b-0 text-xs">
        <label class="flex items-start space-x-2 cursor-pointer flex-grow select-none pr-2">
          <input type="checkbox" ${item.packed ? 'checked' : ''} 
                 onchange="toggleItemPacked('${order.id}', '${item.id}')"
                 class="item-checkbox mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
          <span class="text-slate-700 font-medium ${item.packed ? 'line-through text-slate-400' : ''}">${escapeHtml(item.name)}</span>
        </label>
        <span class="font-bold text-slate-600 text-[11px] whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">${escapeHtml(item.quantity)}</span>
      </li>
    `;
  });

  return `
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${statusStyle.cardBorder}">
      
      <!-- Card Header: ID, Status, Timestamp -->
      <div>
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-black text-slate-900 text-base">#${order.id}</span>
              ${statusStyle.badge}
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
              <i data-lucide="clock" class="w-3 h-3"></i>
              <span>${timeFormatted}</span>
            </p>
          </div>
          
          <!-- Order Type Badge -->
          <span class="px-2 py-1 rounded-lg text-xs font-bold ${isPickup ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-purple-50 text-purple-800 border border-purple-200'} flex items-center space-x-1">
            <i data-lucide="${isPickup ? 'store' : 'truck'}" class="w-3 h-3"></i>
            <span>${isPickup ? 'Pickup' : 'Delivery'}</span>
          </span>
        </div>

        <!-- Customer Info & Contact Links -->
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-3 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5 font-bold text-slate-800">
              <i data-lucide="user" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>${escapeHtml(order.customerName)}</span>
            </div>
            <div class="flex items-center space-x-2">
              <a href="tel:${order.customerPhone}" class="text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="Call customer">
                <i data-lucide="phone" class="w-3 h-3"></i>
                <span>Call</span>
              </a>
              <a href="https://wa.me/91${order.customerPhone}" target="_blank" class="text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-0.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-200" title="WhatsApp customer">
                <i data-lucide="message-circle" class="w-3 h-3"></i>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
          
          <div class="text-slate-600 flex items-center space-x-1">
            <i data-lucide="smartphone" class="w-3 h-3 text-slate-400"></i>
            <span>+91 ${order.customerPhone}</span>
          </div>

          <!-- Fulfillment detail -->
          ${isPickup 
            ? `<div class="text-slate-600 flex items-center space-x-1">
                 <i data-lucide="calendar" class="w-3 h-3 text-amber-500"></i>
                 <span>Slot: <strong>${escapeHtml(order.pickupTime || 'Ready ASAP')}</strong></span>
               </div>`
            : `<div class="text-slate-600 flex items-start space-x-1">
                 <i data-lucide="map-pin" class="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0"></i>
                 <span class="line-clamp-2">Address: <strong>${escapeHtml(order.deliveryAddress)}</strong></span>
               </div>`
          }

          ${order.specialNotes ? `
            <div class="pt-1 border-t border-slate-200 text-[11px] text-amber-800 italic">
              Note: "${escapeHtml(order.specialNotes)}"
            </div>
          ` : ''}
        </div>

        <!-- Items Checklist (Shopkeeper can tick them off) -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span>Grocery Items List (${order.items.length})</span>
            <span class="text-[10px] text-slate-400 font-normal">Check off as you pack</span>
          </div>
          
          <ul class="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2.5 bg-white divide-y divide-slate-100">
            ${itemsChecklistHtml}
          </ul>
        </div>
      </div>

      <!-- Bill Amount (if entered) -->
      ${order.billAmount ? `
        <div class="mb-3 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
          <span class="text-emerald-800 font-medium">Bill Amount:</span>
          <span class="text-emerald-900 font-extrabold text-sm">₹${order.billAmount}</span>
        </div>
      ` : ''}

      <!-- Bottom Actions: Status Flow & Print/Share -->
      <div class="pt-3 border-t border-slate-100 space-y-2">
        
        <!-- Primary Status Transition Buttons -->
        <div class="grid grid-cols-3 gap-1.5">
          <button onclick="updateOrderStatus('${order.id}', 'pending')" 
                  class="py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${order.status === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-amber-100 text-slate-700'}">
            Pending
          </button>
          
          <button onclick="updateOrderStatus('${order.id}', 'packing')" 
                  class="py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${order.status === 'packing' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-blue-100 text-slate-700'}">
            Packing
          </button>
          
          <!-- Ready Button: Opens the requested SMS modal! -->
          <button onclick="openReadyModal('${order.id}')" 
                  class="py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${order.status === 'ready' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-emerald-100 text-emerald-800'}">
            Ready 🔔
          </button>
        </div>

        <!-- Secondary Actions: Completed, Print, Share -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center space-x-1.5">
            <button onclick="openPrintModal('${order.id}')" class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs flex items-center space-x-1" title="Print Kirana Slip">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span class="font-medium text-xs">Print</span>
            </button>
            <button onclick="openShareModal('${order.id}')" class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs flex items-center space-x-1" title="Share grocery parchi text">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
              <span class="font-medium text-xs">Share</span>
            </button>
          </div>

          <!-- Mark Completed or Delete -->
          <div class="flex items-center space-x-1">
            ${order.status !== 'completed' ? `
              <button onclick="updateOrderStatus('${order.id}', 'completed')" class="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Complete</span>
              </button>
            ` : `
              <button onclick="deleteOrder('${order.id}')" class="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 text-xs" title="Delete from history">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            `}
          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * Toggles an item checked/packed state
 */
function toggleItemPacked(orderId, itemId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  const item = order.items.find(i => i.id === itemId);
  if (item) {
    item.packed = !item.packed;
    saveOrdersToStorage();
  }
}

/**
 * Updates order status directly
 */
function updateOrderStatus(orderId, newStatus) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  order.status = newStatus;
  saveOrdersToStorage();

  if (newStatus === 'completed') {
    playChime(659.25, 880); // E5 -> A5
    showToast(`Order #${orderId} marked as completed!`, 'success');
  } else {
    showToast(`Order #${orderId} status updated to: ${newStatus.toUpperCase()}`, 'info');
  }
}

/**
 * Deletes an order
 */
function deleteOrder(orderId) {
  if (confirm(`Are you sure you want to delete order #${orderId}?`)) {
    currentOrders = currentOrders.filter(o => o.id !== orderId);
    saveOrdersToStorage();
    showToast(`Order #${orderId} deleted`, 'info');
  }
}

// ============================================================================
// 5. "READY FOR PICKUP" MODAL & SMS NOTIFICATION
// ============================================================================

/**
 * Opens the "Ready for Pickup" modal with pre-filled message
 * As requested: "open a small modal with a pre-filled message (e.g., 'Your order is ready. Total bill: ___'). Provide an option to edit this message and a 'Send SMS' button to notify the customer"
 */
function openReadyModal(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  activeReadyOrderId = orderId;

  // Header Details
  document.getElementById('ready-modal-order-subtext').textContent = `Order #${order.id} • ${order.customerName} (+91 ${order.customerPhone})`;

  // Bill Amount input
  const billInput = document.getElementById('ready-modal-bill-input');
  billInput.value = order.billAmount || '';

  // Generate Pre-filled Message
  const messageArea = document.getElementById('ready-modal-message-text');
  messageArea.value = generateReadyMessageText(order, billInput.value);

  // Show Modal
  document.getElementById('ready-pickup-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeReadyModal() {
  document.getElementById('ready-pickup-modal').classList.add('hidden');
  activeReadyOrderId = null;
}

/**
 * Generates the friendly prefilled message
 */
function generateReadyMessageText(order, billAmount) {
  const billStr = billAmount && billAmount.trim().length > 0 ? `₹${billAmount}` : '[Enter Total Bill]';
  
  if (order.orderType === 'pickup') {
    return `Namaste ${order.customerName}! Your grocery order #${order.id} is packed and ready for pickup at Sharma Kirana Store.\nTotal bill: ${billStr}.\nPlease collect it at your convenience. Thank you!`;
  } else {
    return `Namaste ${order.customerName}! Your grocery order #${order.id} is packed and ready for delivery to:\n${order.deliveryAddress}\nTotal bill: ${billStr}.\nOur delivery boy will arrive shortly. Cash/UPI accepted. Thank you!`;
  }
}

function handleBillAmountChange(val) {
  if (!activeReadyOrderId) return;
  const order = currentOrders.find(o => o.id === activeReadyOrderId);
  if (!order) return;

  const messageArea = document.getElementById('ready-modal-message-text');
  messageArea.value = generateReadyMessageText(order, val);
}

function regenerateReadyMessage() {
  if (!activeReadyOrderId) return;
  const order = currentOrders.find(o => o.id === activeReadyOrderId);
  if (!order) return;
  const billInput = document.getElementById('ready-modal-bill-input');
  const messageArea = document.getElementById('ready-modal-message-text');
  messageArea.value = generateReadyMessageText(order, billInput.value);
}

/**
 * Execute Send SMS (Mocked as requested with console.log and visual alert)
 */
function executeSendSMS() {
  if (!activeReadyOrderId) return;
  const order = currentOrders.find(o => o.id === activeReadyOrderId);
  if (!order) return;

  const billValue = document.getElementById('ready-modal-bill-input').value.trim();
  const messageText = document.getElementById('ready-modal-message-text').value.trim();

  // Save bill amount and set status to 'ready'
  order.billAmount = billValue;
  order.status = 'ready';
  saveOrdersToStorage();

  // 1. Console Log Mocked SMS as requested
  console.log("%c📲 [MOCK SMS SENT TO CUSTOMER]", "background: #059669; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
  console.log({
    to: `+91 ${order.customerPhone}`,
    customerName: order.customerName,
    orderId: order.id,
    billAmount: billValue ? `₹${billValue}` : 'Not specified',
    message: messageText,
    timestamp: new Date().toLocaleString()
  });

  // 2. Play notification sound
  playChime(587.33, 880); // D5 -> A5

  // 3. Close Modal & Show Success Toast + Alert
  closeReadyModal();
  showToast(`SMS sent to +91 ${order.customerPhone}! (Check Console)`, 'success');
}

/**
 * Real WhatsApp Link for convenient Kirana store usage
 */
function executeOpenWhatsApp() {
  if (!activeReadyOrderId) return;
  const order = currentOrders.find(o => o.id === activeReadyOrderId);
  if (!order) return;

  const billValue = document.getElementById('ready-modal-bill-input').value.trim();
  const messageText = document.getElementById('ready-modal-message-text').value.trim();

  // Save bill & mark ready
  order.billAmount = billValue;
  order.status = 'ready';
  saveOrdersToStorage();

  const encodedMsg = encodeURIComponent(messageText);
  const waUrl = `https://wa.me/91${order.customerPhone}?text=${encodedMsg}`;
  window.open(waUrl, '_blank');

  closeReadyModal();
  showToast('WhatsApp chat opened!', 'success');
}

// ============================================================================
// 6. PRINT DIGITAL PARCHI RECEIPT
// ============================================================================

function openPrintModal(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  // Populate Printable Slip
  document.getElementById('print-order-id').textContent = order.id;
  document.getElementById('print-order-date').textContent = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('print-customer-name').textContent = order.customerName;
  document.getElementById('print-customer-phone').textContent = `+91 ${order.customerPhone}`;
  document.getElementById('print-order-type').textContent = order.orderType.toUpperCase();

  const locElement = document.getElementById('print-order-location');
  if (order.orderType === 'pickup') {
    locElement.textContent = `Pickup Slot: ${order.pickupTime || 'Within 30 mins'}`;
  } else {
    locElement.textContent = `Delivery: ${order.deliveryAddress}`;
  }

  // Items List
  const itemsContainer = document.getElementById('print-items-list');
  let itemsHtml = '';
  order.items.forEach((item, idx) => {
    itemsHtml += `
      <div class="flex justify-between items-start text-[11px] leading-tight">
        <span>${idx + 1}. ${escapeHtml(item.name)}</span>
        <span class="font-bold pl-2">${escapeHtml(item.quantity)}</span>
      </div>
    `;
  });
  itemsContainer.innerHTML = itemsHtml;

  // Total Bill
  const billTotalEl = document.getElementById('print-total-bill');
  billTotalEl.textContent = order.billAmount ? `₹${parseFloat(order.billAmount).toFixed(2)}` : 'As per weight / counter';

  // Notes
  const notesSec = document.getElementById('print-notes-section');
  if (order.specialNotes) {
    notesSec.classList.remove('hidden');
    document.getElementById('print-notes-text').textContent = order.specialNotes;
  } else {
    notesSec.classList.add('hidden');
  }

  document.getElementById('printable-receipt-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closePrintModal() {
  document.getElementById('printable-receipt-modal').classList.add('hidden');
}

// ============================================================================
// 7. SHARE DIGITAL PARCHI MODAL
// ============================================================================

let currentShareText = '';

function openShareModal(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  const itemsFormatted = order.items.map((it, idx) => `${idx + 1}. ${it.name} - ${it.quantity}`).join('\n');
  const billStr = order.billAmount ? `\n💰 Total Bill: ₹${order.billAmount}` : '';
  const fulfillment = order.orderType === 'pickup' 
    ? `🛍️ Pickup Slot: ${order.pickupTime || 'Ready ASAP'}` 
    : `🛵 Delivery Address: ${order.deliveryAddress}`;

  currentShareText = `🛒 *DIGITAL PARCHI - Sharma Kirana Store*\n` +
    `--------------------------------\n` +
    `📋 Order: #${order.id}\n` +
    `👤 Customer: ${order.customerName} (+91 ${order.customerPhone})\n` +
    `${fulfillment}\n` +
    `--------------------------------\n` +
    `*ITEMS LIST:*\n${itemsFormatted}\n` +
    `--------------------------------` +
    `${billStr}\n` +
    `🙏 Thank you for shopping with us!`;

  document.getElementById('share-parchi-text').value = currentShareText;
  document.getElementById('copy-share-btn-text').textContent = 'Copy to Clipboard';
  document.getElementById('share-order-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeShareModal() {
  document.getElementById('share-order-modal').classList.add('hidden');
}

function copyShareText() {
  const textarea = document.getElementById('share-parchi-text');
  navigator.clipboard.writeText(textarea.value).then(() => {
    document.getElementById('copy-share-btn-text').textContent = 'Copied! ✓';
    showToast('Parchi copied to clipboard!', 'success');
  }).catch(() => {
    textarea.select();
    document.execCommand('copy');
    showToast('Parchi copied!', 'success');
  });
}

function shareViaWhatsApp() {
  const encoded = encodeURIComponent(currentShareText);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

// ============================================================================
// 8. AUDIO CHIME (Web Audio API - No External Files Required)
// ============================================================================

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_SETTING_KEY, soundEnabled.toString());
  updateSoundUI();
  if (soundEnabled) {
    playChime(523.25, 659.25);
    showToast('Sound effects enabled', 'info');
  } else {
    showToast('Sound effects muted', 'info');
  }
}

function updateSoundUI() {
  const icon = document.getElementById('sound-icon');
  if (!icon) return;
  if (soundEnabled) {
    icon.setAttribute('data-lucide', 'volume-2');
    icon.className = 'w-4 h-4 text-emerald-600';
  } else {
    icon.setAttribute('data-lucide', 'volume-x');
    icon.className = 'w-4 h-4 text-slate-400';
  }
  lucide.createIcons();
}

function playChime(freq1 = 523.25, freq2 = 659.25) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // Tone 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (Harmonic pleasant step)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq2, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.debug('Audio play not allowed or supported', e);
  }
}

// ============================================================================
// 9. TOAST NOTIFICATIONS & UTILITIES
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-800 text-white border-emerald-600',
    error: 'bg-red-800 text-white border-red-600',
    info: 'bg-slate-900 text-white border-slate-700'
  };

  const icons = {
    success: 'check-circle-2',
    error: 'alert-circle',
    info: 'bell'
  };

  toast.className = `flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Animate In
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'Recently';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
