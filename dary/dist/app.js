import { PRODUCTS, filterProducts, calculateSubtotal } from './catalog.js';
import { ORDERS_KEY, acceptOrder, cancelOrder, createOrder } from './orders.js';
import { DEFAULT_LANGUAGE, getDirection, normalizeLanguage, productText, t } from './i18n.js';

const grid = document.querySelector('#product-grid');
const searchInput = document.querySelector('#product-search');
const emptyResults = document.querySelector('#empty-results');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modal-content');
const cartPanel = document.querySelector('#cart-panel');
const scrim = document.querySelector('#scrim');
const toast = document.querySelector('#toast');
let category = 'الكل';
let query = '';
let sortByPrice = false;
let favoritesOnly = false;
let toastTimer;
let cart = readStorage('dary-cart', {});
let favorites = new Set(readStorage('dary-favorites', []));
const SELLER_REQUESTS_KEY = 'dary-seller-requests';
let buyer = readStorage('dary-buyer-session', null);
function readLanguagePreference() {
  try {
    const stored = localStorage.getItem('dary-language');
    if (stored === null) return DEFAULT_LANGUAGE;
    try { return normalizeLanguage(JSON.parse(stored)); } catch { return normalizeLanguage(stored); }
  } catch { return DEFAULT_LANGUAGE; }
}
let language = readLanguagePreference();

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function safeText(value) {
  const element = document.createElement('span'); element.textContent = value; return element.innerHTML;
}
function tr(key, values) { return t(language, key, values); }
function productImage(product, className) {
  return `<img class="${className}" src="${safeText(product.image)}" alt="${safeText(product.name)}" loading="lazy" decoding="async">`;
}
function productCard(product, index) {
  const isFavorite = favorites.has(product.id);
  const item = productText(language, product);
  return `<article class="product-card" data-id="${product.id}" style="--card-index:${index}">
    <div class="product-image-link" data-product="${product.id}">${productImage({ ...product, name: item.name }, 'product-visual')}<span class="product-tag">${safeText(item.badge)}</span><button class="favorite-button ${isFavorite ? 'selected' : ''}" data-favorite="${product.id}" aria-label="${safeText(tr(isFavorite ? 'product.removeFavorite' : 'product.addFavorite'))}" aria-pressed="${isFavorite}">${isFavorite ? '♥' : '♡'}</button></div>
    <div class="product-info"><div class="product-meta"><span>${safeText(item.category)}</span><span>${safeText(item.maker)}</span></div><button class="product-title" data-product="${product.id}">${safeText(item.name)}</button><div class="product-bottom"><span class="product-price">${product.price}<small>${safeText(tr('currency'))} · ${safeText(item.unit)}</small></span><button class="add-button" data-add="${product.id}" aria-label="${safeText(tr('product.addToCart', { name: item.name }))}">+</button></div></div>
  </article>`;
}
function renderProducts() {
  let items = filterProducts(PRODUCTS, category, '');
  if (query.trim()) {
    const term = query.trim().toLocaleLowerCase(language);
    items = items.filter((product) => {
      const item = productText(language, product);
      return `${item.name} ${item.category} ${item.maker}`.toLocaleLowerCase(language).includes(term);
    });
  }
  if (favoritesOnly) items = items.filter((item) => favorites.has(item.id));
  if (sortByPrice) items = [...items].sort((a, b) => a.price - b.price);
  grid.innerHTML = items.map(productCard).join('');
  emptyResults.hidden = items.length > 0;
  grid.hidden = items.length === 0;
  document.querySelectorAll('.category-chip, .phone-filter').forEach((button) => {
    const selected = button.dataset.category === category && !favoritesOnly;
    button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected));
  });
}
function saveCart() { localStorage.setItem('dary-cart', JSON.stringify(cart)); }
function saveFavorites() { localStorage.setItem('dary-favorites', JSON.stringify([...favorites])); }
function toastMessage(message) {
  toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
function renderCart() {
  const quantity = Object.values(cart).reduce((sum, count) => sum + count, 0);
  document.querySelector('#cart-count').textContent = quantity;
  document.querySelector('#panel-cart-count').textContent = `(${quantity})`;
  const lines = Object.entries(cart).map(([id, count]) => ({ product: PRODUCTS.find((item) => item.id === id), count })).filter((line) => line.product);
  document.querySelector('#cart-empty').hidden = lines.length > 0;
  document.querySelector('#cart-summary').hidden = lines.length === 0;
  document.querySelector('#cart-lines').innerHTML = lines.map(({ product, count }) => { const item = productText(language, product); return `<div class="cart-line">${productImage({ ...product, name: item.name }, 'cart-thumb')}<div><h3>${safeText(item.name)}</h3><small>${product.price} ${safeText(tr('currency'))} · ${safeText(item.unit)}</small><div class="quantity"><button data-quantity="${product.id}" data-delta="-1" aria-label="${safeText(tr('cart.decrease'))}">−</button><span>${count}</span><button data-quantity="${product.id}" data-delta="1" aria-label="${safeText(tr('cart.increase'))}">+</button></div></div><span class="cart-line-price">${product.price * count} ${safeText(tr('currencyShort'))}</span></div>`; }).join('');
  document.querySelector('#cart-total').textContent = `${calculateSubtotal(cart).toLocaleString(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-MA')} ${tr('currency')}`;
}
function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
  document.title = tr('meta.title');
  document.querySelector('meta[name="description"]').content = tr('meta.description');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = tr(element.dataset.i18n);
    if (element.hasAttribute('data-i18n-html')) element.innerHTML = value;
    else element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    for (const mapping of element.dataset.i18nAttr.split(',')) {
      const [attribute, key] = mapping.split(':');
      if (attribute && key) element.setAttribute(attribute.trim(), tr(key.trim()));
    }
  });
  document.querySelector('#language-select').value = language;
  const localizedCity = tr('city.tanTan');
  document.querySelector('#chosen-city').textContent = localizedCity;
  document.querySelector('#sidebar-city').textContent = localizedCity;
  renderProducts(); renderCart();
}
function changeLanguage(value) {
  language = normalizeLanguage(value);
  localStorage.setItem('dary-language', JSON.stringify(language));
  applyLanguage();
}
function openCart() {
  if (!buyer) { closeCart(); openBuyerAccess('cart'); return; }
  cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden', 'false'); scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('open'));
}
function closeCart() { cartPanel.classList.remove('open'); cartPanel.setAttribute('aria-hidden', 'true'); scrim.classList.remove('open'); setTimeout(() => { if (!cartPanel.classList.contains('open')) scrim.hidden = true; }, 240); }
function showModal(content) { modalContent.innerHTML = content; if (!modal.open) modal.showModal(); }
function closeModal() { if (modal.open) modal.close(); }
function openProduct(id) {
  const product = PRODUCTS.find((item) => item.id === id); if (!product) return;
  const item = productText(language, product);
  showModal(`<p class="section-kicker"><span></span> ${safeText(item.maker)} · ${safeText(tr('city.tanTan'))}</p>${productImage({ ...product, name: item.name }, 'product-modal-image')}<h2>${safeText(item.name)}</h2><p>${safeText(item.description)}</p><div class="modal-price">${product.price} ${safeText(tr('currency'))} <span>· ${safeText(item.unit)}</span></div><div class="demo-note">${tr('product.demoNote')}</div><button class="button button-green modal-add" data-add="${product.id}" style="width:100%;margin-top:14px">${tr('product.add')} <span>←</span></button>`);
}
function openAccount() {
  if (buyer) { openBuyerHome(); return; }
  showModal(`<p class="section-kicker"><span></span> ${tr('account.welcome')}</p><h2>${tr('account.choose')}</h2><p>${tr('account.chooseDescription')}</p><div class="account-role-list"><button class="account-role" data-account-role="buyer"><strong>${tr('account.buyer')}</strong><span>${tr('account.buyerDescription')}</span><i>←</i></button><button class="account-role" data-account-role="seller"><strong>${tr('account.seller')}</strong><span>${tr('account.sellerDescription')}</span><i>←</i></button></div><div class="demo-note">${tr('account.demoNote')}</div>`);
}
function openBuyerAccess(next = 'home') {
  showModal(`<p class="section-kicker"><span></span> ${tr('buyer.title')}</p><h2>${tr('buyer.login')}</h2><p>${tr('buyer.description')}</p><form class="modal-form buyer-access-form" data-next="${next}"><label>${tr('field.email')}<input name="email" type="email" placeholder="name@example.com" required value="${safeText(buyer?.email || '')}"></label><label>${tr('field.phone')}<input name="phone" type="tel" placeholder="06 00 00 00 00" required pattern="[0-9+ ()-]{8,18}" value="${safeText(buyer?.phone || '')}"></label><button class="button button-green">${tr('buyer.continue')} <span>←</span></button></form><div class="demo-note">${tr('buyer.savedNote')}</div>`);
}
function openSellerAccess() {
  showModal(`<p class="section-kicker"><span></span> ${tr('seller.title')}</p><h2>${tr('seller.loginOrJoin')}</h2><p>${tr('seller.description')}</p><form class="modal-form seller-access-form"><label>${tr('seller.fullName')}<input name="name" autocomplete="name" required></label><label>${tr('seller.address')}<input name="address" autocomplete="street-address" required></label><label>${tr('field.email')}<input name="email" type="email" placeholder="name@example.com" required></label><label>${tr('field.phone')}<input name="phone" type="tel" placeholder="06 00 00 00 00" required pattern="[0-9+ ()-]{8,18}"></label><button class="button button-green">${tr('seller.continue')} <span>←</span></button></form><div class="demo-note">${tr('seller.localNote')}</div>`);
}
function openSeller() {
  showModal(`<p class="section-kicker"><span></span> ${tr('seller.signupTitle')}</p><h2>${tr('seller.registerKitchen')}</h2><p>${tr('seller.signupDescription')}</p><form class="modal-form demo-form"><label>${tr('seller.kitchenName')}<input required placeholder="${tr('seller.kitchenPlaceholder')}"></label><label>${tr('seller.offer')}<select><option>${tr('seller.moroccanDishes')}</option><option>${tr('seller.sweets')}</option><option>${tr('seller.breakfast')}</option></select></label><label>${tr('seller.contact')}<input type="tel" placeholder="${tr('seller.optional')}"></label><button class="button button-green">${tr('seller.savePreview')} <span>←</span></button></form><div class="demo-note">${tr('seller.noSaveNote')}</div>`);
}
const dashboardData = {
  seller: { title: 'sellerDashboard.title', stats: [['dashboard.newOrders', '—'], ['dashboard.activeDishes', '—'], ['dashboard.reviews', '—']], rows: [['product.tagine', 'makers.draft'], ['product.vegetableTagine', 'makers.draft'], ['makers.kitchenStatus', 'dashboard.waitingApproval']] },
  courier: { title: 'courierDashboard.title', stats: [['dashboard.available', '—'], ['dashboard.inDelivery', '—'], ['dashboard.completedToday', '—']], rows: [['dashboard.sampleOrder', 'city.tanTan'], ['dashboard.coverageArea', 'dashboard.toBeDefined'], ['dashboard.accountStatus', 'dashboard.previewOnly']] },
  admin: { title: 'adminDashboard.title', stats: [['dashboard.kitchens', '—'], ['dashboard.products', '—'], ['dashboard.totalOrders', '—']], rows: [['dashboard.tanTanMarket', 'dashboard.marketSetup'], ['dashboard.sellerData', 'dashboard.unlinked'], ['dashboard.platformStatus', 'dashboard.localDemo']] },
};
function renderSellerOrders(sellerEmail) {
  const orders = readStorage(ORDERS_KEY, []).filter((order) => order.status !== 'cancelled');
  if (!orders.length) return `<h3>${tr('dashboard.orderQueue')}</h3><div class="dash-row"><span>${tr('dashboard.noNewOrders')}</span><span>—</span></div>`;
  return `<h3>${tr('dashboard.orderQueue')}</h3>${orders.map((order) => {
    const status = order.status === 'accepted'
      ? (order.acceptedBy === sellerEmail ? tr('dashboard.acceptedByYou') : tr('dashboard.acceptedByOther'))
      : tr('dashboard.waiting');
    const products = order.items.map((item) => `${safeText(productText(language, PRODUCTS.find((p) => p.id === item.id) || { ...item, category: '', maker: '', unit: '', description: '', badge: '' }).name)} × ${item.quantity}`).join(', ');
    return `<div class="dash-row order-row"><span><b>${safeText(order.id)}</b><br>${products}<br>${safeText(order.customer.name)} · ${safeText(order.customer.phone)}<br>${safeText(order.customer.address)} · ${order.total} ${tr('currency')}</span>${order.status === 'awaiting-seller' ? `<button class="button button-green accept-order" data-order-id="${safeText(order.id)}">${tr('dashboard.accept')}</button>` : `<span>${status}</span>`}</div>`;
  }).join('')}`;
}
function openDashboard(role, sellerEmail = '') {
  const data = dashboardData[role]; if (!data) return;
  const requests = role === 'admin' ? readStorage(SELLER_REQUESTS_KEY, []) : [];
  const approvals = role === 'admin' ? `<h3>${tr('seller.requestTitle')}</h3>${requests.length ? requests.map((request) => `<div class="dash-row"><span><b>${tr('dashboard.requestName')}:</b> ${safeText(request.name || '—')}<br><b>${tr('dashboard.requestAddress')}:</b> ${safeText(request.address || '—')}<br>${safeText(request.email)} · ${safeText(request.phone)}</span>${request.status === 'approved' ? `<span>${tr('dashboard.approved')}</span>` : `<button class="approve-seller" data-approve-seller="${safeText(request.email)}">${tr('dashboard.approve')}</button>`}</div>`).join('') : `<div class="dash-row"><span>${tr('seller.requestEmpty')}</span><span>—</span></div>`}` : '';
  const sellerOrders = role === 'seller' ? renderSellerOrders(sellerEmail) : '';
  showModal(`<p class="section-kicker"><span></span> ${tr('dashboard.preview')}</p><h2>${tr(data.title)}</h2><div class="dashboard-tabs"><button class="active" data-tab="overview">${tr('dashboard.overview')}</button><button data-tab="orders">${tr('dashboard.orders')}</button><button data-tab="settings">${tr('dashboard.settings')}</button></div><div class="demo-note">${tr('dashboard.localNote')}</div><div class="dash-stat-grid">${data.stats.map(([label,value]) => `<div class="dash-stat"><small>${tr(label)}</small><b>${value}</b></div>`).join('')}</div><div class="dash-list">${data.rows.map(([label,value]) => `<div class="dash-row"><span>${tr(label)}</span><span>${tr(value)}</span></div>`).join('')}${role === 'seller' ? sellerOrders : approvals}</div>`);
  modalContent.querySelectorAll('.dashboard-tabs button').forEach((button) => button.addEventListener('click', () => {
    modalContent.querySelectorAll('.dashboard-tabs button').forEach((tab) => tab.classList.remove('active')); button.classList.add('active');
    const rows = modalContent.querySelector('.dash-list');
    if (button.dataset.tab === 'overview') rows.innerHTML = data.rows.map(([label,value]) => `<div class="dash-row"><span>${tr(label)}</span><span>${tr(value)}</span></div>`).join('');
    else if (button.dataset.tab === 'orders') rows.innerHTML = role === 'seller' ? renderSellerOrders(sellerEmail) : `<div class="dash-row"><span>${tr('dashboard.orderPreviewEmpty')}</span><span>${tr('dashboard.noOrderData')}</span></div>`;
    else rows.innerHTML = `<div class="dash-row"><span>${tr('dashboard.settingsLabel')}</span><span>${tr('dashboard.experimental')}</span></div>`;
  }));
  modalContent.querySelectorAll('[data-approve-seller]').forEach((button) => button.addEventListener('click', () => {
    const sellerRequests = readStorage(SELLER_REQUESTS_KEY, []);
    const request = sellerRequests.find((item) => item.email === button.dataset.approveSeller);
    if (!request) return;
    request.status = 'approved'; localStorage.setItem(SELLER_REQUESTS_KEY, JSON.stringify(sellerRequests));
    openDashboard('admin'); toastMessage(tr('dashboard.approvedToast'));
  }));
  modalContent.querySelectorAll('[data-order-id]').forEach((button) => button.addEventListener('click', () => {
    const orders = acceptOrder(readStorage(ORDERS_KEY, []), button.dataset.orderId, sellerEmail);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    openDashboard('seller', sellerEmail); toastMessage(tr('dashboard.acceptedToast'));
  }));
}
function openBuyerHome() {
  const orders = readStorage(ORDERS_KEY, []).filter((order) => order.customer.email === buyer.email);
  const rows = orders.length ? orders.map((order) => `<div class="dash-row"><span><b>${safeText(order.id)}</b><br>${order.items.map((item) => `${safeText(productText(language, PRODUCTS.find((p) => p.id === item.id) || { ...item, category: '', maker: '', unit: '', description: '', badge: '' }).name)} × ${item.quantity}`).join(', ')}<br>${order.total} ${tr('currency')} · ${tr('account.cod')}</span><span>${order.status === 'accepted' ? tr('account.orderAccepted') : order.status === 'cancelled' ? tr('account.orderCancelled') : tr('account.orderPending')}</span>${order.status === 'awaiting-seller' ? `<button class="button button-outline cancel-order" data-cancel-order="${safeText(order.id)}">${tr('account.cancelOrder')}</button>` : ''}</div>`).join('') : `<div class="dash-row"><span>${tr('account.noOrders')}</span><span>—</span></div>`;
  showModal(`<p class="section-kicker"><span></span> ${tr('account.buyerHome')}</p><h2>${tr('account.hello')} ${safeText(buyer.phone)}</h2><p>${safeText(buyer.email)}</p><h3>${tr('account.myOrders')}</h3><div class="dash-list">${rows}</div><button class="button button-green" data-open-cart-account>${tr('account.openCart')} <span>←</span></button><button class="button button-outline" data-buyer-logout style="width:100%;margin-top:8px">${tr('account.logout')}</button><div class="demo-note" style="margin-top:12px">${tr('account.localNote')}</div>`);
}
function openCheckout() {
  if (!buyer) { closeCart(); openBuyerAccess('cart'); return; }
  const lines = Object.entries(cart).map(([id, quantity]) => ({ product: PRODUCTS.find((item) => item.id === id), quantity })).filter((line) => line.product);
  if (!lines.length) return;
  showModal(`<p class="section-kicker"><span></span> ${tr('checkout.title')}</p><h2>${tr('checkout.details')}</h2><p>${tr('checkout.description')}</p><form class="modal-form checkout-form"><label>${tr('checkout.name')}<input name="name" required autocomplete="name" placeholder="${tr('checkout.name')}"></label><label>${tr('field.email')}<input name="email" type="email" required value="${safeText(buyer.email)}" autocomplete="email"></label><label>${tr('field.phone')}<input name="phone" type="tel" required pattern="[0-9+ ()-]{8,18}" value="${safeText(buyer.phone)}" autocomplete="tel"></label><label>${tr('checkout.address')}<textarea name="address" required rows="2" placeholder="${tr('checkout.addressPlaceholder')}"></textarea></label><label>${tr('checkout.note')}<textarea name="note" rows="2" placeholder="${tr('checkout.notePlaceholder')}"></textarea></label><div class="demo-note">${tr('checkout.total')}: <b>${calculateSubtotal(cart).toLocaleString(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-MA')} ${tr('currency')}</b> · ${tr('checkout.cod')}</div><button class="button button-green">${tr('checkout.confirm')} <span>←</span></button></form>`);
}
function openCity() {
  showModal(`<p class="section-kicker"><span></span> ${tr('city.title')}</p><h2>${tr('city.chooseTitle')}</h2><p>${tr('city.description')}</p><form class="modal-form city-form"><label>${tr('city.label')}<select id="city-select"><option>${tr('city.tanTan')}</option><option disabled>${tr('city.laayoune')}</option><option disabled>${tr('city.guelmim')}</option></select></label><button class="button button-green">${tr('city.confirm')} <span>←</span></button></form>`);
}
function applyCategory(value) {
  category = value; favoritesOnly = false; query = ''; searchInput.value = ''; renderProducts();
  document.querySelector('#market').scrollIntoView({ behavior: 'smooth' });
}

grid.addEventListener('click', (event) => {
  const button = event.target.closest('button'); const detail = event.target.closest('[data-product]');
  if (button?.dataset.add) { const id = button.dataset.add; cart[id] = (cart[id] || 0) + 1; saveCart(); renderCart(); toastMessage(tr('toast.addedToCart')); if (modal.open) closeModal(); return; }
  if (button?.dataset.favorite) { const id = button.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); saveFavorites(); renderProducts(); return; }
  if (detail) openProduct(detail.dataset.product);
});
document.querySelector('#cart-lines').addEventListener('click', (event) => {
  const button = event.target.closest('[data-quantity]'); if (!button) return;
  const id = button.dataset.quantity; cart[id] = (cart[id] || 0) + Number(button.dataset.delta);
  if (cart[id] <= 0) delete cart[id]; saveCart(); renderCart();
});
document.querySelector('#search-form').addEventListener('submit', (event) => { event.preventDefault(); query = searchInput.value; renderProducts(); document.querySelector('#market').scrollIntoView({ behavior: 'smooth' }); });
searchInput.addEventListener('input', () => { query = searchInput.value; renderProducts(); });
document.querySelectorAll('.category-chip, .phone-filter').forEach((button) => button.addEventListener('click', () => applyCategory(button.dataset.category)));
document.querySelectorAll('.reset-filter').forEach((button) => button.addEventListener('click', () => { category = 'الكل'; query = ''; favoritesOnly = false; searchInput.value = ''; renderProducts(); }));
document.querySelector('#sort-toggle').addEventListener('click', (event) => { sortByPrice = !sortByPrice; event.currentTarget.innerHTML = `<span class="sort-label">${tr(sortByPrice ? 'market.sort.price' : 'market.sort.near')}</span> <span>${sortByPrice ? '↕' : '⌄'}</span>`; renderProducts(); });
document.querySelector('#cart-open').addEventListener('click', openCart);
document.querySelector('#phone-cart-open').addEventListener('click', openCart);
document.querySelectorAll('.close-button').forEach((button) => button.addEventListener('click', () => { closeModal(); closeCart(); }));
document.querySelector('.close-panel').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
document.querySelector('.checkout-button').addEventListener('click', openCheckout);
document.querySelector('.favorite-open').addEventListener('click', () => { favoritesOnly = !favoritesOnly; category = 'الكل'; query = ''; searchInput.value = ''; renderProducts(); document.querySelector('#market').scrollIntoView({ behavior: 'smooth' }); toastMessage(tr(favoritesOnly ? 'toast.favorites' : 'toast.allDishes')); });
document.querySelector('.search-toggle').addEventListener('click', () => { document.querySelector('#market').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => searchInput.focus(), 450); });
document.querySelectorAll('.city-open').forEach((button) => button.addEventListener('click', openCity));
document.querySelectorAll('[data-open="seller"]').forEach((button) => button.addEventListener('click', openSeller));
document.querySelectorAll('[data-open="seller-dashboard"]').forEach((button) => button.addEventListener('click', openSellerAccess));
document.querySelectorAll('[data-open="account"]').forEach((button) => button.addEventListener('click', openAccount));
document.addEventListener('click', (event) => {
  const role = event.target.closest('[data-account-role]')?.dataset.accountRole;
  if (!role) return;
  if (role === 'buyer') openBuyerAccess();
  else if (role === 'seller') openSellerAccess();
  else openDashboard(role);
});
document.querySelectorAll('[data-open="courier"]').forEach((button) => button.addEventListener('click', () => openDashboard('courier')));
// The operator preview has no public-page link; open it directly with #admin during local review.
window.addEventListener('hashchange', () => { if (window.location.hash === '#admin') openDashboard('admin'); });
document.querySelectorAll('[data-category-link]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); applyCategory(link.dataset.categoryLink); }));
document.querySelectorAll('[data-product-preview]').forEach((item) => item.addEventListener('click', () => openProduct(item.dataset.productPreview)));
document.querySelector('[data-phone-market]').addEventListener('click', () => document.querySelector('#market').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('[data-phone-home]').addEventListener('click', () => document.querySelector('#home').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#modal').addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('click', (event) => { const add = event.target.closest('.modal-add'); if (add) { const id = add.dataset.add; cart[id] = (cart[id] || 0) + 1; saveCart(); renderCart(); closeModal(); toastMessage(tr('toast.addedToCart')); } });
document.addEventListener('submit', (event) => {
  if (event.target.matches('.city-form')) { event.preventDefault(); const city = document.querySelector('#city-select').value; document.querySelector('#chosen-city').textContent = city; document.querySelector('#sidebar-city').textContent = city; closeModal(); toastMessage(tr('city.updated')); }
  if (event.target.matches('.demo-form')) { event.preventDefault(); closeModal(); toastMessage(tr('toast.thanks')); }
  if (event.target.matches('.buyer-access-form')) {
    event.preventDefault();
    buyer = { email: event.target.elements.email.value.trim().toLowerCase(), phone: event.target.elements.phone.value.trim() };
    localStorage.setItem('dary-buyer-session', JSON.stringify(buyer));
    const next = event.target.dataset.next;
    if (next === 'cart') { closeModal(); openCart(); }
    else openBuyerHome();
  }
  if (event.target.matches('.checkout-form')) {
    event.preventDefault();
    const form = event.target;
    const lines = Object.entries(cart).map(([id, quantity]) => ({ product: PRODUCTS.find((item) => item.id === id), quantity })).filter((line) => line.product);
    const items = lines.map(({ product, quantity }) => ({ id: product.id, name: product.name, quantity, price: product.price }));
    const total = calculateSubtotal(cart);
    const note = form.elements.note.value.trim();
    const order = createOrder({
      id: `DARY-${Date.now().toString(36).toUpperCase()}`,
      customer: { name: form.elements.name.value, email: form.elements.email.value, phone: form.elements.phone.value, address: form.elements.address.value },
      items, total,
    });
    order.note = note;
    const orders = readStorage(ORDERS_KEY, []);
    orders.unshift(order); localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    cart = {}; saveCart(); renderCart(); closeCart();
    showModal(`<p class="section-kicker"><span></span> ${tr('checkout.success')}</p><h2>${tr('checkout.waiting')}</h2><p>${tr('checkout.orderNumber')}: <b>${safeText(order.id)}</b></p><p>${tr('checkout.codExplanation')}</p><div class="demo-note">${tr('checkout.localQueue')}</div><button class="button button-green" data-view-buyer-orders>${tr('checkout.track')} <span>←</span></button>`);
  }
  if (event.target.matches('.seller-access-form')) {
    event.preventDefault();
    const name = event.target.elements.name.value.trim();
    const address = event.target.elements.address.value.trim();
    const email = event.target.elements.email.value.trim().toLowerCase();
    const phone = event.target.elements.phone.value.trim();
    const requests = readStorage(SELLER_REQUESTS_KEY, []);
    const existing = requests.find((request) => request.email === email);
    if (existing?.status === 'approved' && existing.phone === phone) { openDashboard('seller', email); return; }
    if (existing?.status === 'approved' && existing.phone !== phone) { toastMessage(tr('seller.badPhone')); return; }
    if (!existing) { requests.push({ name, address, email, phone, status: 'pending' }); localStorage.setItem(SELLER_REQUESTS_KEY, JSON.stringify(requests)); }
    showModal(`<p class="section-kicker"><span></span> ${tr('seller.application')}</p><h2>${tr(existing ? 'seller.pendingTitleExisting' : 'seller.pendingTitle')}</h2><p>${tr('seller.pendingDescription')}</p><div class="demo-note">${tr('seller.pendingNote')}</div><button class="button button-green" data-back-account>${tr('seller.back')} <span>←</span></button>`);
  }
  if (event.target.matches('#tracking-form')) { event.preventDefault(); const code = document.querySelector('#tracking-code').value.trim(); toastMessage(tr(code ? 'toast.notFound' : 'toast.enterNumber')); }
});
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-back-account]')) openAccount();
  if (event.target.closest('[data-open-cart-account]')) { closeModal(); openCart(); }
  if (event.target.closest('[data-buyer-logout]')) { buyer = null; localStorage.removeItem('dary-buyer-session'); openAccount(); }
  if (event.target.closest('[data-view-buyer-orders]')) openBuyerHome();
  const cancelButton = event.target.closest('[data-cancel-order]');
  if (cancelButton && buyer) {
    const orders = cancelOrder(readStorage(ORDERS_KEY, []), cancelButton.dataset.cancelOrder, buyer.email);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); openBuyerHome(); toastMessage(tr('account.cancelled'));
  }
});
document.querySelector('.menu-toggle').addEventListener('click', () => { const nav = document.querySelector('.main-nav'); nav.classList.toggle('open'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(nav.classList.contains('open'))); });
document.querySelector('#language-select').addEventListener('change', (event) => changeLanguage(event.target.value));
document.querySelectorAll('.main-nav a, .main-nav button').forEach((link) => link.addEventListener('click', () => document.querySelector('.main-nav').classList.remove('open')));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCart(); });

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: 0.14 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('in-view'));
}

applyLanguage();
