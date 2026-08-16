const S = {
  page: 'upgrade', me: null, inventory: [], inventoryFeed: [], catalog: [], cases: [], drops: [], online: 0,
  tab: 'inventory', from: null, to: null, chance: null, boost: 30, addBalance: 0, turbo: false, spinning: false,
  opening: null, activeCase: null, rouletteItems: [], caseResult: null, upgradeResult: null, caseReveal: false, pointerAngle: 0,
  authModal: false, ageAccepted: false, termsAccepted: false,
  profile: null, profileTab: 'items', settingsOpen: false, settings: null,
  paymentOpen: false, paymentTab: 'card', paymentAmount: 500, paymentMethod: 0, paymentCurrency: 'RUB', currencyOpen: false,
  sellMode: false, sellSelected: new Set(), sortBy: 'new', sortOpen: false,
  targetSearch: '', targetMin: '', targetMax: '', targetPage: 1,
  footerLang: 'RU', footerLangOpen: false,
  globalStats: { totalPlayers: 0, casesOpened: 0, upgradesMade: 0 },
  chat: false, chatEmail: '', chatEmailReady: false, brand: 'КЕЙСЕР', telegram: 'https://t.me/'
};

const CURRENCIES = [
  { code: 'RUB', symbol: '₽', name: 'Российский рубль', flag: '🇷🇺' },
  { code: 'USD', symbol: '$', name: 'Доллар США', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Евро', flag: '🇪🇺' },
  { code: 'UAH', symbol: '₴', name: 'Гривна', flag: '🇺🇦' },
  { code: 'KZT', symbol: '₸', name: 'Тенге', flag: '🇰🇿' },
  { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', flag: '🇧🇾' }
];
const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map(item => [item.code, item]));

const LANGS = [
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'UA', name: 'Українська', flag: '🇺🇦' },
  { code: 'KZ', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'BY', name: 'Беларуская', flag: '🇧🇾' }
];
const FLAG_CODES = { RU: 'ru', EN: 'gb', UA: 'ua', KZ: 'kz', BY: 'by' };
function flagIcon(code) {
  const lang = LANGS.find(item => item.code === code);
  const emoji = lang ? lang.flag : '';
  const cc = FLAG_CODES[code] || String(code || '').toLowerCase();
  return `<span class="lang-flag" data-emoji="${emoji}"><img src="https://flagcdn.com/w40/${cc}.png" alt="${esc(code)}" loading="lazy" onerror="var f=this.parentElement;if(f)f.textContent=f.dataset.emoji||'';"></span>`;
}

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, match => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[match]));
const money = cents => cents == null
  ? '—'
  : (Number(cents) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const coinImg = '<img class="coin-mini" src="/chunks/coin.svg" alt="">';
const coinPrice = cents => cents == null ? '—' : `${money(cents)}${coinImg}`;
const safeColor = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#74ffca';
const rarityStyle = item => `style="--rarity:${safeColor(item?.rarityColor)}"`;
const bust = src => (typeof src === 'string' && src.includes('/static/items/') && !src.includes('?'))
  ? `${src}?v=2`
  : src;
const image = (src, alt = '', local = '') => src
  ? `<img src="${esc(bust(src))}" alt="${esc(alt)}" loading="lazy" decoding="async"${local ? ` data-fb="${esc(bust(local))}"` : ''} onerror="if(this.dataset.fb){const fb=this.dataset.fb;this.dataset.fb='';this.onerror=null;this.src=fb}else{this.onerror=null;this.classList.add('img-failed')}">`
  : '';
const avatarImage = user => user?.avatar
  ? `<img src="${esc(user.avatar)}" alt="${esc(user.name || 'Профиль')}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/chunks/logo.svg'">`
  : '<img src="/chunks/logo.svg" alt="Профиль">';
const art = item => `<div class="art" ${rarityStyle(item)}>${image(item?.icon || item?.itemIcon, item?.name || item?.itemName || '', item?.localIcon || '')}</div>`;

function coinIcon(size = '1.6rem', color = '#FFA800') {
  return `<svg class="coin-icon" style="width:${size};height:${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="1.6"/>
    <circle cx="12" cy="12" r="6.4" fill="none" stroke="${color}" stroke-width="1.4" opacity=".55"/>
    <path d="M12 7.8v8.4M9.6 9.6h3.2a1.7 1.7 0 0 1 0 3.4h-2.4a1.7 1.7 0 0 0 0 3.4h3.2" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function plusIcon(size = '2rem', color = '#FFA800') {
  return `<svg class="plus-icon" style="width:${size};height:${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function turboIcon(on) {
  return `<svg class="tool-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.4255 2.24994C16.2665 2.24994 16.8295 3.04794 16.6375 3.81294L16.5885 3.96594L14.4905 9.34994H17.0005C17.9855 9.34994 18.5325 10.4039 18.1005 11.2039L18.0005 11.3599L10.5305 21.4069C9.9905 22.1319 8.9095 21.6309 9.0035 20.8019L9.7885 13.8919H7.0005C6.0935 13.8919 5.5135 12.9679 5.8455 12.1569L5.8505 12.1459L9.7565 3.01794C9.85142 2.79082 10.0113 2.59678 10.216 2.46015C10.4208 2.32353 10.6613 2.2504 10.9075 2.24994H15.4255Z" fill="${on ? '#FFA800' : 'currentColor'}"/></svg>`;
}
function soundIcon(on) {
  const color = on ? '#83D8FF' : 'currentColor';
  const opacity = on ? 1 : .3;
  return `<svg class="tool-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="opacity:${opacity}">
    <path d="M13.5 4.05995C13.5 2.72395 11.884 2.05495 10.94 2.99995L6.44001 7.49995H4.50801C3.36701 7.49995 2.19001 8.16395 1.84801 9.40495C1.61598 10.2504 1.49893 11.1232 1.50001 12C1.50001 12.898 1.62101 13.768 1.85001 14.595C2.19101 15.835 3.36801 16.5 4.50901 16.5H6.43901L10.939 21C11.884 21.945 13.5 21.276 13.5 19.94V4.05995Z" fill="${color}"/>
    <path d="M18.584 5.10595C18.7246 4.9655 18.9153 4.88661 19.114 4.88661C19.3128 4.88661 19.5034 4.9655 19.644 5.10595C23.452 8.91295 23.452 15.086 19.644 18.894C19.5018 19.0264 19.3138 19.0986 19.1195 19.0951C18.9252 19.0917 18.7398 19.013 18.6024 18.8756C18.465 18.7382 18.3863 18.5528 18.3828 18.3585C18.3794 18.1642 18.4515 17.9761 18.584 17.834C19.3502 17.0679 19.958 16.1583 20.3727 15.1573C20.7873 14.1563 21.0007 13.0834 21.0007 12C21.0007 10.9165 20.7873 9.84358 20.3727 8.84257C19.958 7.84157 19.3502 6.93205 18.584 6.16595C18.4436 6.02533 18.3647 5.8347 18.3647 5.63595C18.3647 5.4372 18.4436 5.24658 18.584 5.10595Z" fill="${color}"/>
    <path d="M15.9322 7.75695C16.0019 7.68725 16.0846 7.63197 16.1756 7.59425C16.2666 7.55652 16.3642 7.53711 16.4627 7.53711C16.5612 7.53711 16.6588 7.55652 16.7498 7.59425C16.8409 7.63197 16.9236 7.68725 16.9932 7.75695C17.5505 8.31411 17.9925 8.97559 18.2941 9.70361C18.5957 10.4316 18.7509 11.2119 18.7509 11.9999C18.7509 12.788 18.5957 13.5683 18.2941 14.2963C17.9925 15.0243 17.5505 15.6858 16.9932 16.2429C16.8517 16.3795 16.6622 16.455 16.4656 16.4532C16.2689 16.4514 16.0808 16.3724 15.9418 16.2333C15.8029 16.0942 15.7241 15.9061 15.7224 15.7094C15.7208 15.5128 15.7965 15.3233 15.9332 15.1819C16.3511 14.7641 16.6825 14.268 16.9087 13.722C17.1348 13.1761 17.2512 12.5909 17.2512 11.9999C17.2512 11.409 17.1348 10.8238 16.9087 10.2779C16.6825 9.73189 16.3511 9.23581 15.9332 8.81795C15.7928 8.67732 15.7139 8.4867 15.7139 8.28795C15.7139 8.0892 15.7928 7.89857 15.9332 7.75795L15.9322 7.75695Z" fill="${color}"/>
  </svg>`;
}
function chevronIcon() {
  return `<svg class="chevron-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(json.error || `HTTP ${response.status}`);
  return json;
}

function shuffleCatalog(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function boot() {
  try {
    const [config, me, drops, online, catalog, cases, stats] = await Promise.all([
      api('/api/config'), api('/api/me'), api('/api/live-drops'), api('/api/online'),
      api('/api/catalog'), api('/api/cases'), api('/api/stats')
    ]);
    S.brand = config.brand;
    S.telegram = config.telegram;
    S.me = me;
    S.drops = drops;
    S.online = online.online;
    S.catalog = shuffleCatalog(catalog);
    S.cases = cases.cases || [];
    S.globalStats = stats;
    S.turbo = localStorage.getItem('keyser-turbo') === '1';
    if (me.authenticated) {
      const [inventory, profile] = await Promise.all([api('/api/inventory'), api('/api/profile')]);
      S.inventory = inventory.items || [];
      S.inventoryFeed = inventory.feed || inventory.items || [];
      S.profile = profile;
    }
    render();
    listen();
    preloadArtwork();
  } catch (error) {
    console.error(error);
    render();
    toast('Не удалось загрузить данные', 'error');
  }
}

function preloadArtwork() {
  const urls = [];
  for (const item of (S.catalog || []).slice(0, 72)) if (item.icon) urls.push(bust(item.icon));
  for (const item of S.inventory || []) if (item.icon || item.itemIcon) urls.push(bust(item.icon || item.itemIcon));
  const seen = new Set();
  const unique = urls.filter(url => (seen.has(url) ? false : (seen.add(url), true)));
  let index = 0;
  const batch = () => {
    const end = Math.min(index + 6, unique.length);
    for (; index < end; index++) {
      const im = new Image();
      im.src = unique[index];
    }
    if (index < unique.length) setTimeout(batch, 120);
  };
  setTimeout(batch, 400);
}

function listen() {
  const events = new EventSource('/api/events');
  events.addEventListener('online', event => {
    S.online = JSON.parse(event.data).online;
    updateOnline();
  });
  events.addEventListener('drop', event => {
    const drop = JSON.parse(event.data);
    if (!S.drops.some(item => item.id === drop.id)) S.drops.unshift(drop);
    S.drops = S.drops.slice(0, 30);
    if (S.page === 'rewards' || S.page === 'upgrade') render();
  });
  events.addEventListener('notify', event => {
    try {
      const n = JSON.parse(event.data);
      toast(n.title ? `${n.title}: ${n.body}` : n.body);
    } catch (_) {}
  });
  fetch('/api/notifications').then(r => r.json()).then(data => {
    const list = (data && data.notifications) || [];
    const seen = new Set(JSON.parse(localStorage.getItem('keyser-seen-notifications') || '[]'));
    for (const n of list) {
      if (n.audience === 'guests' && S.me?.authenticated) continue;
      if (n.audience === 'authenticated' && !S.me?.authenticated) continue;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      toast(n.title ? `${n.title}: ${n.body}` : n.body);
    }
    localStorage.setItem('keyser-seen-notifications', JSON.stringify([...seen].slice(-50)));
  }).catch(() => {});
  document.addEventListener('click', event => {
    if (!document.body.contains(event.target)) return;
    let changed = false;
    if (!event.target.closest('.footer-language') && S.footerLangOpen) { S.footerLangOpen = false; changed = true; }
    if (!event.target.closest('.currency-select') && S.currencyOpen) { S.currencyOpen = false; changed = true; }
    if (!event.target.closest('.profile-sort') && S.sortOpen) { S.sortOpen = false; changed = true; }
    if (changed) render();
  });
}

function updateOnline() {
  const elements = document.querySelectorAll?.('[data-online],[data-footer-online]') || [];
  for (const element of elements) element.textContent = S.online;
}

function steamIcon() {
  return '<img class="steam-icon" src="/chunks/steamIcon.svg" alt="" aria-hidden="true">';
}

function telegramIcon() {
  return `<img class="chunk-icon telegram-icon" src="/chunks/telegramIcon.svg" alt="Telegram">`;
}
function onlineIcon() {
  const phase = -(Date.now() % 1600);
  return `<svg class="live-drop-online-icon" style="--online-phase:${phase}ms" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path class="live-drop-online-icon__stem" d="M13.998 9.9209C15.3785 9.92116 16.498 11.0403 16.498 12.4209C16.4979 13.4448 15.8813 14.3235 15 14.71V26H13V14.7119C12.1162 14.3266 11.4981 13.4466 11.498 12.4209C11.498 11.0402 12.6173 9.9209 13.998 9.9209Z" fill="#83D8FF"/>
    <path class="live-drop-online-icon__arc live-drop-online-icon__arc--primary" d="M9.74278 16.728C8.90367 15.8889 8.33222 14.8198 8.10071 13.6559C7.8692 12.492 7.98802 11.2856 8.44215 10.1893C8.89627 9.09289 9.66531 8.15582 10.652 7.49653C11.6387 6.83725 12.7987 6.48535 13.9854 6.48535C15.1721 6.48535 16.3321 6.83725 17.3188 7.49653C18.3055 8.15582 19.0746 9.09289 19.5287 10.1893C19.9828 11.2856 20.1016 12.492 19.8701 13.6559C19.6386 14.8198 19.0672 15.8889 18.2281 16.728" stroke="#83D8FF" stroke-width="1.5" stroke-linecap="round"/>
    <path class="live-drop-online-icon__arc live-drop-online-icon__arc--secondary" d="M7.21757 19.1531C5.88897 17.8245 4.98419 16.1317 4.61763 14.2889C4.25107 12.4461 4.4392 10.536 5.15823 8.80005C5.87727 7.06416 7.0949 5.58046 8.65717 4.53659C10.2194 3.49271 12.0562 2.93555 13.9351 2.93555C15.814 2.93555 17.6507 3.49271 19.213 4.53659C20.7753 5.58046 21.9929 7.06416 22.7119 8.80005C23.431 10.536 23.6191 12.4461 23.2525 14.2889C22.886 16.1317 21.9812 17.8245 20.6526 19.1531" stroke="#83D8FF" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function header() {
  const balance = S.me?.authenticated ? coinPrice(S.me.user.balanceCents) : null;
  return `<header class="top">
    <div class="brand"><img src="/chunks/logo.svg" alt=""><span>${esc(S.brand)}</span></div>
    <nav class="nav">
      <button class="${S.page === 'cases' || S.page === 'case' ? 'active' : ''}" onclick="go('cases')">КЕЙСЫ</button>
      <button class="${S.page === 'upgrade' ? 'active' : ''}" onclick="go('upgrade')">АПГРЕЙДЫ</button>
      <button class="${S.page === 'rewards' ? 'active' : ''}" onclick="go('rewards')">НАГРАДЫ</button>
      <button class="${S.page === 'steal' ? 'active' : ''}" onclick="go('steal')">STEAL</button>
    </nav>
    <div class="actions">
      <a class="telegram" href="${esc(S.telegram)}" target="_blank" rel="noopener">${telegramIcon()}</a>
      ${S.me?.authenticated ? `<div class="balance header-balance"><span>Баланс</span><b>${balance}</b><button onclick="openPayment()" aria-label="Пополнить баланс">+</button></div>` : ''}
      ${S.me?.authenticated && (S.me.user.role === 'admin' || S.me.user.role === 'support')
        ? `<a class="admin-link ${S.me.user.role === 'support' ? 'is-support' : ''}" href="/admin" title="${S.me.user.role === 'support' ? 'Панель поддержки' : 'Админ-панель'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 3v5.4c0 4.4-3 8.3-7.5 9.6-4.5-1.3-7.5-5.2-7.5-9.6V6L12 3Z"/><path d="M9.2 12.2l2 2 3.6-3.9"/></svg><span>ПАНЕЛЬ</span></a>` : ''}
      ${S.me?.authenticated
        ? `<button id="notification-trigger" class="notification-trigger" type="button" onclick="openNotifications()" aria-label="Уведомления"><img src="/chunks/notificationIcon.svg" alt=""></button>
           <button id="profile-trigger" class="profile-trigger" type="button" onclick="go('profile')" aria-label="${esc(S.me.user.name || 'Личный профиль')}">${avatarImage(S.me.user)}</button>`
        : `<button class="steam auth-login-button" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>`}
    </div>
  </header>`;
}

function sideItem(item) {
  const player = S.me?.user;
  const avatar = player?.avatar
    ? `<img src="${esc(player.avatar)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/chunks/logo.svg'">`
    : '<img src="/chunks/logo.svg" alt="">';
  const gone = item.status && item.status !== 'active';
  const badge = item.status === 'sold' ? 'ПРОДАНО' : item.status === 'used' ? 'В АПГРЕЙДЕ' : '';
  return `<div class="side-item skin-item${gone ? ' side-item-gone' : ''}" ${rarityStyle(item)}>
    ${badge ? `<span class="side-item-badge">${badge}</span>` : ''}
    ${art(item)}
    <div class="side-item-copy">
      <div class="item-name-row">
        <span class="item-name">${esc(item.weapon || item.name)}</span>
        ${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}
      </div>
      <div class="item-skin">${esc(item.skin || item.marketName)}</div>
      <div class="item-rarity">${esc(item.rarity)}</div>
    </div>
    <div class="side-player">${avatar}<span>${esc(player?.name || 'Игрок')}</span></div>
    <i class="skin-rarity-line"></i>
  </div>`;
}

function sidebar() {
  const feed = (S.inventoryFeed && S.inventoryFeed.length) ? S.inventoryFeed : S.inventory;
  const items = S.tab === 'hot'
    ? feed.filter(item => Number(item.rarityRank) >= 4)
    : feed;
  return `<aside class="sidebar">
    <div class="side-head">
      <div class="site-online">
        ${onlineIcon()}<b data-online>${S.online}</b><span>ONLINE</span>
      </div>
      <div class="side-tabs">
        <button class="${S.tab === 'inventory' ? 'active' : ''}" onclick="sideTab('inventory')" title="Предметы сайта">▦</button>
        <button class="${S.tab === 'hot' ? 'active' : ''}" onclick="sideTab('hot')" title="От засекреченного">🔥</button>
      </div>
    </div>
    <div class="side-list">
      ${items.length
        ? items.map(sideItem).join('')
        : `<div class="side-empty">${S.me?.authenticated
            ? (S.tab === 'hot' ? 'Нет предметов редкости «Засекреченное» или выше' : 'Откройте кейс — предмет появится здесь')
            : 'Авторизуйтесь, чтобы увидеть инвентарь сайта'}</div>`}
    </div>
  </aside>`;
}

function priceTag(item) {
  return `<span class="skin-price">${coinPrice(item.priceCents)}</span>`;
}
function rarityLine() {
  return '<i class="skin-rarity-line"></i>';
}
function skinCard(item, options = {}) {
  const tag = options.button ? 'button' : 'div';
  const attrs = options.onclick ? ` onclick="${options.onclick}"` : '';
  const className = options.className || 'card';
  return `<${tag} class="${className} skin-card" ${rarityStyle(item)}${attrs}>
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>${rarityLine()}
  </${tag}>`;
}
function pickCard(item, side) {
  const id = side === 'from' ? item.assetid : item.catalogId;
  return `<button class="pick-card skin-card" ${rarityStyle(item)} onclick="choose('${esc(id)}','${side}')">
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}
  </button>`;
}
function bigSelected(item) {
  return `<div class="selected-big skin-item" ${rarityStyle(item)}>
    <div class="selected-big-art">${image(item?.icon || item?.itemIcon, item?.name || item?.itemName || '', item?.localIcon || '')}</div>
    <div class="selected-big-info">
      <strong>${esc(item.weapon || item.name)}</strong>
      <span>${esc(item.skin || item.marketName || '')}</span>
      <small>${esc(item.rarity || '')}</small>
      <div class="selected-big-price"><b>${coinPrice(item.priceCents)}</b>${item.wear ? `<em>${esc(item.wear)}</em>` : ''}</div>
    </div>
  </div>`;
}

function loginRequired(title, text) {
  return `<div class="login-box"><h1>${esc(title)}</h1><p class="sub">${esc(text)}</p>
    <button class="steam" style="margin:20px auto 0" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>
  </div>`;
}

function upgradePage() {
  if (!S.me?.authenticated) return loginRequired('АПГРЕЙДЫ', 'Войдите в аккаунт. Для апгрейда используются только предметы из инвентаря сайта.');
  const inventory = S.inventory;
  const baseValue = (S.from ? Number(S.from.priceCents) : 0) + S.addBalance;
  const minimumPrice = S.from ? boostMinimumPrice(baseValue, S.boost) : 0;
  const query = S.targetSearch.trim().toLowerCase();

  const userMin = S.targetMin === '' ? 0 : Number(S.targetMin) * 100;
  const minTarget = Math.max(minimumPrice, Number.isFinite(userMin) ? userMin : 0);
  const maxTarget = S.targetMax === '' ? Infinity : Number(S.targetMax) * 100;
  const targets = S.catalog.filter(item => item.priceCents >= minTarget && item.priceCents <= maxTarget && (!query || `${item.weapon} ${item.skin} ${item.name}`.toLowerCase().includes(query)));
  const pageSize = 16;
  let pageCount = Math.max(1, Math.ceil(targets.length / pageSize));
  if (S.targetPage > pageCount) S.targetPage = pageCount;
  const pageTargets = targets.slice((S.targetPage - 1) * pageSize, S.targetPage * pageSize);
  const chance = clampChance(S.chance);
  const chanceText = formatChance(S.chance);
  const boostOptions = [['30%', 30], ['50%', 50], ['75%', 75], ['x2', 200], ['x5', 500], ['x10', 1000]];
  const boostButtons = boostOptions.map(([label, value]) => `<button class="${S.boost === value ? 'active' : ''}" ${S.from ? '' : 'disabled'} onclick="setBoost(${value})">${label}</button>`).join('');
  const balanceCents = Number(S.me.user.balanceCents || 0);
  const balanceR = (balanceCents / 100).toFixed(2);
  const addR = (S.addBalance / 100).toFixed(2);
  const rangeProgress = balanceCents > 0 ? Math.min(100, S.addBalance / balanceCents * 100) : 0;
  const soundOn = localStorage.getItem('keyser-sound') !== '0';
  const turboOn = S.turbo;
  const fromLabel = S.from ? `${money(S.from.priceCents)}${S.addBalance ? ` + ${money(S.addBalance)}` : ''}` : '';
  const leftEmpty = '<div class="selected-big empty">Выбранный предмет появится здесь</div>';
  return `<section class="upgrid">
      <div class="source-col">
        <div class="panel-tools">
          <button type="button" aria-label="Turbo mode" aria-pressed="${turboOn}" title="Turbo mode" onclick="toggleTurbo()">${turboIcon(turboOn)}</button>
          <button type="button" aria-label="Sound" aria-pressed="${soundOn}" title="Звук" onclick="toggleSoundBtn()">${soundIcon(soundOn)}</button>
        </div>
        <div class="panel"><div class="title">ВЫБЕРИТЕ <b>&nbsp;ПРЕДМЕТ ДЛЯ ИСПОЛЬЗОВАНИЯ</b></div>
          ${S.from ? bigSelected(S.from) : leftEmpty}
        </div>
        <div class="add-balance-bar">
          <div class="add-balance-title">${coinIcon('2rem', '#9AA29F')}<span>Добавить баланс</span></div>
          <div class="add-balance-mid"><div class="ab-value">${coinIcon('1.6rem')}<b>${money(S.addBalance)}</b></div>
            <input class="add-balance-range" type="range" min="0" max="${balanceR}" step="0.01" value="${addR}" style="--range-progress:${rangeProgress}%" oninput="setAddBalance(this.value)" ${balanceCents > 0 ? '' : 'disabled'}>
          </div>
          <div class="add-balance-max"><span>Макс.</span><div>${coinIcon('1.6rem', '#9AA29F')}<b>${money(balanceCents)}</b></div></div>
        </div>
      </div>
      <div class="wheelbox${S.spinning ? ' is-spinning' : ''}">
        <div class="wheelhead"><span>ШАНС АПГРЕЙДА</span><b>${chanceText}</b></div>
        <div class="wheel-stage"><div class="wheel${S.spinning ? ' is-spinning' : ''}" style="--chance:${chance}%;--chance-half:${(chance / 2).toFixed(3)}%">
          <img class="spinner-ring spinner-ring-2" src="/chunks/spinner-group-2.webp" alt="" aria-hidden="true">
          <img class="spinner-ring spinner-ring-1" src="/chunks/spinner-group-1.webp" alt="" aria-hidden="true">
          <img class="spinner-center" src="/chunks/spinner-group-3.webp" alt="" aria-hidden="true">
          <img class="spinner-logo" src="/chunks/logo.svg" alt="" aria-hidden="true">
          <div class="wheelcenter"><strong>${chanceText}</strong><span>${S.chance == null ? 'выберите предметы' : 'шанс апгрейда'}</span></div>
        </div><div class="pointer-orbit" style="--angle:${Number(S.pointerAngle) || 0}deg" aria-hidden="true"><img class="pointer" src="/chunks/spinner-arrow.webp" alt=""></div></div>
        <button class="upgrade" ${!S.from || !S.to || S.spinning ? 'disabled' : ''} onclick="upgrade()">
          <img class="upgrade-icon" src="/chunks/upgrade.svg" alt="">${S.spinning ? 'АПГРЕЙД...' : 'АПГРЕЙД'}
        </button>
        <div class="under">${S.from && S.to ? `${fromLabel} → ${money(S.to.priceCents)}` : S.from ? `Цель от ${money(minimumPrice)}` : 'Выберите предмет слева и цель справа'}</div>
      </div>
      <div class="target-col">
        <div class="panel target-preview-panel"><div class="title">ВЫБРАННАЯ <b>&nbsp;ЦЕЛЬ АПГРЕЙДА</b></div>
          ${S.to ? bigSelected(S.to) : leftEmpty}
        </div>
        <div class="boost-row"><div class="boost-label">УВЕЛИЧИТЬ СТОИМОСТЬ ЦЕЛИ</div><div class="boost-buttons">${boostButtons}</div></div>
      </div>
    </section>
    <section class="lower upgrade-lists">
      <div class="panel upgrade-list-panel"><div class="upgrade-list-head"><div><img src="/chunks/inventary.svg" alt=""><b>МОИ ПРЕДМЕТЫ</b></div></div><div class="upgrade-list-body">${inventory.length ? `<div class="grid upgrade-items-grid">${inventory.map(item => skinCard(item, { button: true, onclick: `choose('${item.assetid}','from')` })).join('')}</div>` : '<div class="upgrade-list-empty"><strong>Ваш инвентарь пуст</strong><span>Открой свой первый кейс</span><button onclick="go(\'cases\')"><img src="/chunks/cases.svg" alt="">ОТКРЫТЬ КЕЙС</button></div>'}</div></div>
      <div class="panel upgrade-list-panel"><div class="upgrade-list-head"><div><img src="/chunks/upgrade.svg" alt=""><b>ВЫБРАТЬ ПРЕДМЕТ</b></div><div class="target-filters"><input id="target-min" value="${esc(S.targetMin)}" placeholder="От" inputmode="decimal" oninput="applyTargetFilters()"><input id="target-max" value="${esc(S.targetMax)}" placeholder="До" inputmode="decimal" oninput="applyTargetFilters()"><input id="target-search" value="${esc(S.targetSearch)}" placeholder="Поиск" oninput="applyTargetFilters()"><button onclick="applyTargetFilters()" aria-label="Поиск">⌕</button></div></div><div class="upgrade-list-body">${pageTargets.length ? `<div class="grid upgrade-items-grid target-items-grid">${pageTargets.map(item => skinCard(item, { button: true, onclick: `choose('${item.catalogId}','to')` })).join('')}</div>` : '<div class="upgrade-list-empty"><strong>Предметы не найдены</strong><span>Измените фильтры или выберите исходный предмет</span></div>'}${pageCount > 1 ? `<div class="target-pager"><button ${S.targetPage <= 1 ? 'disabled' : ''} onclick="setTargetPage(${S.targetPage - 1})" aria-label="Предыдущая страница">‹</button><button ${S.targetPage >= pageCount ? 'disabled' : ''} onclick="setTargetPage(${S.targetPage + 1})" aria-label="Следующая страница">›</button></div>` : ''}</div></div>
    </section>`;
}
function inventoryItemCard(item) {
  const selected = S.sellMode && S.sellSelected.has(String(item.assetid));
  const selectable = S.sellMode
    ? `<button class="sell-check ${selected ? 'on' : ''}" onclick="toggleSellItem('${item.assetid}')" aria-label="Выбрать предмет">${selected ? '✓' : ''}</button>`
    : '';
  return `<div class="inventory-item-wrap ${S.sellMode ? 'sell-mode' : ''} ${selected ? 'sell-picked' : ''}">${selectable}${skinCard(item, S.sellMode ? { onclick: `toggleSellItem('${item.assetid}')` } : {})}<div class="inventory-actions"><button class="sell-item" onclick="sellItem('${item.assetid}')">ПРОДАТЬ ${money(item.priceCents)}</button><button class="upgrade-item" onclick="sendToUpgrade('${item.assetid}')">В АПГРЕЙД</button></div></div>`;
}
function sellBar() {
  if (!S.sellMode) return '';
  const count = S.sellSelected.size;
  const total = S.inventory.filter(item => S.sellSelected.has(String(item.assetid))).reduce((sum, item) => sum + Number(item.priceCents || 0), 0);
  return `<div class="sell-bar">
    <button class="sell-bar-all" onclick="sellSelectAll()">${count === S.inventory.length ? 'СНЯТЬ ВСЕ' : 'ВЫБРАТЬ ВСЕ'}</button>
    <span class="sell-bar-info">Выбрано: <b>${count}</b> на <b>${coinPrice(total)}</b></span>
    <button class="sell-bar-confirm" ${count ? '' : 'disabled'} onclick="sellSelectedItems()">ПРОДАТЬ ВЫБРАННЫЕ</button>
  </div>`;
}
function toggleSellMode() {
  S.sellMode = !S.sellMode;
  S.sellSelected.clear();
  render();
}
function toggleSellItem(id) {
  const key = String(id);
  if (S.sellSelected.has(key)) S.sellSelected.delete(key);
  else S.sellSelected.add(key);
  render();
}
function sellSelectAll() {
  if (S.sellSelected.size === S.inventory.length) S.sellSelected.clear();
  else S.inventory.forEach(item => S.sellSelected.add(String(item.assetid)));
  render();
}
async function sellSelectedItems() {
  if (!S.sellSelected.size) return;
  const items = S.inventory.filter(item => S.sellSelected.has(String(item.assetid)));
  const total = items.reduce((sum, item) => sum + Number(item.priceCents || 0), 0);
  if (!confirm(`Продать выбранные предметы (${items.length} шт.) за ${money(total)}?`)) return;
  let sold = 0;
  let amount = 0;
  for (const item of items) {
    try {
      const result = await api(`/api/inventory/${encodeURIComponent(item.assetid)}/sell`, { method: 'POST' });
      sold++;
      amount += Number(result.amountCents || 0);
    } catch (error) {  }
  }
  S.sellMode = false;
  S.sellSelected.clear();
  await refreshAccount();
  S.from = null; S.to = null; S.chance = null;
  render();
  toast(sold ? `Продано: ${sold} шт. на ${money(amount)}` : 'Не удалось продать', sold ? '' : 'error');
}
function inventoryPage() {
  if (!S.me?.authenticated) return loginRequired('ИНВЕНТАРЬ', 'Войдите через Steam, чтобы увидеть предметы, полученные на сайте. Steam-инвентарь сюда не загружается.');
  if (!S.inventory.length) return `<h1 class="page-title">Инвентарь сайта</h1><p class="sub">Здесь хранятся только предметы из кейсов и апгрейдов сайта.</p>
    <div class="panel empty"><h2>У вас нет предметов</h2><p>Откройте стартовый кейс — выпавший скин появится здесь.</p><button class="cta" onclick="go('cases')">ОТКРЫТЬ КЕЙС</button></div>`;
  return `<h1 class="page-title">Инвентарь сайта</h1><p class="sub">Только предметы, полученные из кейсов и апгрейдов. Инвентарь Steam не используется.</p>
    <div class="panel inventory-panel"><div class="grid inventory-grid">${S.inventory.map(inventoryItemCard).join('')}</div></div>`;
}

function caseContents(caseData) {
  return caseData.contents.map(item => skinCard(item, { className: 'case-content-item' })).join('');
}
function caseIcon(caseData, large = false) {
  return `<div class="case-visual ${large ? 'case-visual-large' : ''}"><div class="case-cube ${caseData.id === 'starter' ? 'case-cube-starter' : ''}"><i></i><i></i><i></i></div></div>`;
}
function casesPage() {
  if (!S.me?.authenticated) return loginRequired('КЕЙСЫ', 'Войдите в аккаунт. Выпавшие скины будут сохранены в инвентаре сайта, а не в Steam.');
  return `<h1 class="page-title">Кейсы</h1><p class="sub">Выберите кейс. Содержимое и анимация открытия находятся на его странице.</p>
    <div class="case-shop-grid">${S.cases.map(caseData => `<article class="case-shop-card ${caseData.id === 'starter' ? 'starter-case' : ''}">
      ${caseIcon(caseData)}<h2>${esc(caseData.name)}</h2><b>${caseData.priceCents ? coinPrice(caseData.priceCents) : 'БЕСПЛАТНО'}</b>
      <button onclick="selectCase('${esc(caseData.id)}')" ${!caseData.available ? 'disabled' : ''}>${caseData.available ? 'КУПИТЬ' : 'УЖЕ ОТКРЫТ'}</button>
    </article>`).join('')}</div>`;
}
function rouletteCard(item) {
  return `<div class="roulette-card" ${rarityStyle(item)}>${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}<strong>${esc(item.weapon || item.name)}</strong><small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}</div>`;
}
function caseDetailPage() {
  if (!S.me?.authenticated) return loginRequired('КЕЙС', 'Войдите через Steam, чтобы открыть кейс.');
  const caseData = S.cases.find(item => item.id === S.activeCase) || S.cases[0];
  if (!caseData) return '<div class="empty"><h2>Кейс не найден</h2></div>';
  const insufficient = caseData.priceCents > Number(S.me.user.balanceCents);
  const disabled = !!S.opening || !caseData.available || insufficient;
  const missingCents = caseData.priceCents - Number(S.me.user.balanceCents);
  const buyButton = !insufficient
    ? `<button class="case-buy-button" ${disabled ? 'disabled' : ''} onclick="openCase('${esc(caseData.id)}')">${S.opening ? 'ОТКРЫВАЕМ...' : !caseData.available ? 'УЖЕ ОТКРЫТ' : caseData.priceCents ? `КУПИТЬ ЗА ${coinPrice(caseData.priceCents)}` : 'КУПИТЬ БЕСПЛАТНО'}</button>`
    : `<div class="insufficient-box">
        <div class="insufficient-head"><span>Не хватает</span><b>${money(missingCents)}</b>${coinIcon('2rem')}</div>
        <span class="insufficient-text">Недостаточно средств для открытия кейса</span>
        <button type="button" class="insufficient-btn" onclick="openPayment()">Пополнить баланс${plusIcon('2.2rem')}</button>
      </div>`;
  const roulette = S.rouletteItems.length ? `<div class="case-roulette"><i class="roulette-pointer"></i><div class="case-roll-track">${S.rouletteItems.map(rouletteCard).join('')}</div></div>` : '';
  const result = S.caseResult && !S.caseReveal ? `<div class="case-result"><span>ВЫПАЛО</span>${skinCard(S.caseResult, { className: 'case-result-item' })}<button onclick="sendToUpgrade('${S.caseResult.assetid}')">В АПГРЕЙД</button><button onclick="openInventory()">В ИНВЕНТАРЬ</button></div>` : '';
  return `<button class="case-back" onclick="go('cases')">← ВСЕ КЕЙСЫ</button>
    <section class="case-detail">
      <h1>${esc(caseData.name)}</h1>${caseIcon(caseData, true)}
      <div class="case-detail-price">${caseData.priceCents ? coinPrice(caseData.priceCents) : 'БЕСПЛАТНО'}</div>
      ${buyButton}
      ${roulette}${result}
      <div class="case-loot"><h2>СОДЕРЖИМОЕ</h2><div class="case-items case-items-detail">${caseContents(caseData)}</div></div>
    </section>`;
}

function weeklySlot() {
  return `<div class="weekly-slot" aria-hidden="true"><img src="/chunks/question.svg" alt=""></div>`;
}
function topDropCard(drop) {
  const item = { name: drop.itemName, weapon: String(drop.itemName).split(' | ')[0], skin: String(drop.itemName).split(' | ')[1] || '', icon: drop.itemIcon, localIcon: drop.localIcon || '', priceCents: drop.priceCents, rarity: drop.rarity, rarityColor: drop.rarityColor };
  return `<div class="top-drop-card skin-item" ${rarityStyle(item)}>${priceTag(item)}${art(item)}<strong>${esc(item.weapon)}</strong><small>${esc(item.skin)}</small>${rarityLine()}</div>`;
}
function rewardsPage() {
  const rewardDrops = S.drops.filter(drop => drop.source === 'reward');
  return `<h1 class="weekly-page-title">НАГРАДЫ</h1>
    <section class="weekly-panel">
      <img class="weekly-bg" src="/chunks/bg.webp" alt="" aria-hidden="true">
      <div class="weekly-content">
        <div class="weekly-slots">${weeklySlot().repeat(4)}</div>
        <div class="weekly-copy">
          <h2>ЕЖЕНЕДЕЛЬНЫЙ НАБОР</h2>
          <div class="weekly-ribbon"><span>РАЗБЛОКИРУЙ НАГРАДЫ</span></div>
          <p>Пополняй баланс и играй на сайте, чтобы разблокировать награды.<br>Еженедельный дроп обновляется каждые 7 дней.</p>
          ${S.me?.authenticated
            ? '<button class="weekly-button" onclick="go(\'cases\')">ОТКРЫТЬ КЕЙСЫ</button>'
            : '<button class="weekly-button" onclick="login()">АВТОРИЗОВАТЬСЯ</button>'}
        </div>
      </div>
    </section>
    <section class="top-drops-panel">
      <div class="top-drops-title">ТОП ДРОП</div>
      <div class="top-drops-track">${rewardDrops.length ? rewardDrops.slice(0, 12).map(topDropCard).join('') : '<div class="top-drops-empty">Здесь появятся только предметы из еженедельных наград</div>'}</div>
    </section>`;
}

function stealPage() {
  return `<h1 class="page-title">STEAL A SKIN</h1><p class="sub">События создаются только после реального дропа на сайте.</p>
    <div class="steal"><div class="stealhero"><h2>STEAL A SKIN</h2><div class="empty"><h2>Нет активного события</h2><p>Когда появится дорогой дроп, здесь будет окно STEAL.</p></div></div>
    <div class="stealside"><h3>Правила</h3><div class="rule"><b>15 секунд</b>Время на STEAL.</div><div class="rule"><b>3–5%</b>Комиссия задаётся сервером.</div><div class="rule"><b>PvP</b>Победитель определяется сервером.</div></div></div>`;
}

function profileEmptyState(title, subtitle, buttonText, action) {
  return `<div class="profile-tab-empty"><div class="pte-copy"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></div><button onclick="${action}"><img src="/chunks/cases.svg" alt=""><span>${esc(buttonText)}</span></button></div>`;
}
function sortIconSVG() {
  return '<svg class="profile-sort-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function profileSortButton() {
  const options = [
    ['new', 'По новизне'],
    ['price-desc', 'По цене (дорогие)'],
    ['price-asc', 'По цене (дешёвые)'],
    ['rarity', 'По редкости']
  ];
  const label = (options.find(o => o[0] === S.sortBy) || options[0])[1];
  return `<div class="profile-sort">
    <button type="button" class="profile-sort-btn" onclick="toggleProfileSort(event)">${sortIconSVG()}<span>${esc(label)}</span><i class="profile-sort-chev ${S.sortOpen ? 'open' : ''}">${chevronIcon()}</i></button>
    ${S.sortOpen ? `<div class="profile-sort-menu">${options.map(o => `<button type="button" class="${o[0] === S.sortBy ? 'active' : ''}" onclick="setProfileSort('${o[0]}')"><span>${esc(o[1])}</span>${o[0] === S.sortBy ? '<i>✓</i>' : ''}</button>`).join('')}</div>` : ''}
  </div>`;
}
function sortList(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (S.sortBy === 'price-desc') return arr.sort((a, b) => Number(b.priceCents || 0) - Number(a.priceCents || 0));
  if (S.sortBy === 'price-asc') return arr.sort((a, b) => Number(a.priceCents || 0) - Number(b.priceCents || 0));
  if (S.sortBy === 'rarity') return arr.sort((a, b) => Number(b.rarityRank || 0) - Number(a.rarityRank || 0));
  return arr;
}
function toggleProfileSort(event) {
  event.stopPropagation();
  S.sortOpen = !S.sortOpen;
  render();
}
function setProfileSort(key) {
  S.sortBy = key;
  S.sortOpen = false;
  render();
}
function historyCard(item) {
  const status = item.status === 'sold' ? 'ПРОДАНО' : item.status === 'used' ? 'ИСПОЛЬЗОВАНО' : '';
  const icon = item.icon || item.localIcon || '';
  const img = icon ? `<img src="${esc(bust(icon))}" alt="" loading="lazy" onerror="this.onerror=null;this.classList.add('img-failed')">` : '';
  return `<div class="profile-history-card skin-card" ${rarityStyle(item)}>
    <div class="art">${img}</div>
    <strong>${esc(item.weapon || item.name || '')}</strong>
    <small>${esc(item.skin || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>
    ${status ? `<em class="history-status">${status}</em>` : ''}
    <span class="skin-price">${coinPrice(item.priceCents)}</span>${rarityLine()}
  </div>`;
}
function upgradeSlot(data, fallbackName) {
  const item = data || {};
  const weapon = item.weapon || String(item.name || fallbackName || '').split(' | ')[0] || '';
  const skin = item.skin || String(item.name || '').split(' | ')[1] || '';
  return `<div class="upg-slot skin-item" ${rarityStyle(item)}>
    <span class="skin-price">${coinPrice(item.priceCents)}</span>
    ${art(item)}
    <strong>${esc(weapon)}</strong>
    <small>${esc(skin)}</small>
    <i class="skin-rarity-line"></i>
  </div>`;
}
function upgradeCard(row) {
  const won = !!row.won;
  const from = row.from || { name: row.fromName, icon: row.fromIcon, priceCents: row.fromPriceCents };
  const to = row.to || { name: row.toName, icon: row.toIcon, priceCents: row.toPriceCents };
  const chance = Number(row.chance || 0);
  const title = to.weapon || String(to.name || '').split(' | ')[0] || 'Апгрейд';
  return `<div class="profile-upgrade-card ${won ? 'won' : 'lost'}">
    <div class="upg-head">${esc(title)}</div>
    <div class="upg-body">
      ${upgradeSlot(from, row.fromName)}
      <span class="upg-arrow" aria-hidden="true">›</span>
      ${upgradeSlot(to, row.toName)}
    </div>
    <div class="upg-foot">
      <span class="upg-chance">Шанс ${chance.toFixed(2)}%</span>
      <em class="upg-result">${won ? 'Выигрыш' : 'Проигрыш'}</em>
    </div>
  </div>`;
}
const ROLE_LABELS = { admin: 'Администратор', support: 'Поддержка' };
function roleBadge(role) {
  const label = ROLE_LABELS[role];
  if (!label) return '';
  return `<span class="role-badge role-${esc(role)}">${label}</span>`;
}
function profilePage() {
  if (!S.me?.authenticated) return loginRequired('ЛИЧНЫЙ ПРОФИЛЬ', 'Авторизуйтесь через Steam, чтобы открыть профиль.');
  const profile = S.profile || { user: S.me.user, balanceCents: S.me.user.balanceCents, withdrawnCents: 0, activeItems: S.inventory.length, bestDrop: null, stats: {}, history: [], upgrades: [] };
  const user = profile.user || S.me.user;
  const avatar = avatarImage(user);
  const best = profile.bestDrop
    ? `<div class="profile-best-item">${skinCard(profile.bestDrop, { className: 'profile-best-skin' })}<span>Лучший предмет в инвентаре</span></div>`
    : '<div class="profile-best-empty"><img class="best-empty-img" src="/chunks/steamBg.webp" alt=""><span>Отобразится<br>после первой игры</span></div>';
  let content = '';
  if (S.profileTab === 'items') {
    const items = sortList(S.inventory);
    content = items.length ? `${sellBar()}<div class="profile-items-grid">${items.map(inventoryItemCard).join('')}</div>` : '<div class="profile-empty">У ВАС НЕТ ПРЕДМЕТОВ</div>';
  } else if (S.profileTab === 'history') {
    const history = sortList(profile.history || []);
    content = history.length ? `<div class="profile-items-grid profile-history-grid">${history.map(historyCard).join('')}</div>` : profileEmptyState('История предметов отсутствует', 'Откройте кейс или совершите апгрейд — результаты появятся здесь', 'Открыть кейс', "go('cases')");
  } else {
    const upgrades = (profile.upgrades || []).slice();
    content = upgrades.length ? `<div class="profile-upgrades-grid">${upgrades.map(upgradeCard).join('')}</div>` : profileEmptyState('История апгрейдов пуста', 'У пользователя пока нет завершенных апгрейдов', 'Перейти к апгрейду', "go('upgrade')");
  }
  const sellBtn = S.sellMode
    ? '<button class="profile-sell-all sell-cancel" onclick="toggleSellMode()">ОТМЕНА</button>'
    : '<button class="profile-sell-all" onclick="toggleSellMode()">ПРОДАТЬ ВСЕ</button>';
  return `<section class="profile-page">
    <div class="profile-summary-grid">
      <article class="profile-user-card">
        <div class="profile-identity">${avatar}<div><h1>${esc(user.name || 'Игрок')}</h1><span>ID: ${esc(user.steamid || user.id || '')}</span>${roleBadge(user.role)}</div><div class="profile-tools"><a href="https://steamcommunity.com/profiles/${esc(user.steamid || '')}" target="_blank" rel="noopener" aria-label="Steam">${steamIcon()}</a><button onclick="openSettings()" title="Настройки"><img src="/chunks/settingIcon.svg" alt="Настройки"></button><button onclick="logout()" title="Выйти"><img src="/chunks/exitIconGray.svg" alt="Выйти"></button></div></div>
        <div class="profile-balance-label">Баланс</div><div class="profile-balance"><strong>${coinPrice(profile.balanceCents)}</strong><button type="button" onclick="openPayment()" aria-label="Пополнить баланс">+</button></div>
        <div class="profile-mini-stats"><div><b>${profile.stats?.casesOpened || 0}</b><span>Кейсы</span></div><div><b>${profile.stats?.upgradesMade || 0}</b><span>Апгрейды</span></div><div><b>${profile.stats?.soldItems || 0}</b><span>Продажи</span></div></div>
      </article>
      <article class="profile-best-card"><h2>Лучший дроп</h2>${best}</article>
      <div class="profile-side-column"><article class="profile-withdraw"><span class="withdrawn-label">Выведено</span><div class="withdrawn-amount"><b>${(Number(profile.withdrawnCents || 0) / 100).toFixed(2)}</b><img src="/chunks/coin.svg" alt="₽"></div><span class="withdrawn-count">${profile.activeItems || 0} предмета</span><img class="withdrawn-bg" src="/chunks/steamBg.webp" alt="" aria-hidden="true"></article><article class="profile-coupon"><input placeholder="Персональный купон"><button>ПРИМЕНИТЬ</button></article></div>
    </div>
    <div class="profile-toolbar"><div class="profile-tabs"><button class="${S.profileTab === 'items' ? 'active' : ''}" onclick="setProfileTab('items')">ПРЕДМЕТЫ</button><button class="${S.profileTab === 'history' ? 'active' : ''}" onclick="setProfileTab('history')">ИСТОРИЯ</button><button class="${S.profileTab === 'upgrades' ? 'active' : ''}" onclick="setProfileTab('upgrades')">АПГРЕЙДЫ</button></div><div class="profile-toolbar-right">${profileSortButton()}${sellBtn}</div></div>
    <div class="profile-content">${content}</div>
  </section>`;
}
function siteFooter() {
  const stats = S.globalStats || {};
  const count = value => Number(value || 0).toLocaleString('ru-RU');
  return `<footer class="site-footer">
    <div class="footer-mobile-head"><div><img src="/chunks/logo.svg" alt=""><b>${esc(S.brand)}</b></div><a href="${esc(S.telegram)}" target="_blank" rel="noopener">${telegramIcon()}</a></div>
    <div class="footer-divider footer-mobile-divider"></div>
    <div class="footer-main">
      <div class="footer-brand"><div><img src="/chunks/logo.svg" alt=""><b>${esc(S.brand)}</b></div><p>Улучшай и собирай собственный инвентарь CS2.</p></div>
      <div class="footer-column footer-contacts"><div><b>ПОДДЕРЖКА</b><a href="mailto:support@caser.gg">support@caser.gg</a></div><div><b>СОТРУДНИЧЕСТВО</b><a href="mailto:marketing@caser.gg">marketing@caser.gg</a></div></div>
      <div class="footer-column"><b>НАВИГАЦИЯ</b><button onclick="openInventory()">Инвентарь</button><button onclick="go('cases')">Кейсы</button><button onclick="go('upgrade')">Апгрейды</button><button onclick="go('rewards')">Награды</button></div>
      <div class="footer-column"><b>ОБЩИЕ ПОЛОЖЕНИЯ</b><a href="/tos.html">Пользовательское соглашение</a><a href="/tos.html">Политика конфиденциальности</a><a href="/tos.html">Политика использования Cookie</a><a href="/tos.html">Политика AML/KYC</a><a href="/tos.html">Контакты</a></div>
      <div class="footer-language"><div class="lang-select">
        <button type="button" onclick="toggleFooterLang()">${flagIcon(S.footerLang)}<b>${esc(S.footerLang)}</b><i class="lang-chevron ${S.footerLangOpen ? 'open' : ''}">${chevronIcon()}</i></button>
        ${S.footerLangOpen ? `<div class="lang-menu">${LANGS.map(item => `<button type="button" class="${item.code === S.footerLang ? 'active' : ''}" onclick="setFooterLang('${item.code}')">${flagIcon(item.code)}<b>${esc(item.name)}</b>${item.code === S.footerLang ? '<i class="lang-check">✓</i>' : ''}</button>`).join('')}</div>` : ''}
      </div></div>
    </div>
    <div class="footer-company"><div><b>${esc(S.brand)} © 2026</b><p>Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.</p><span>Не аффилировано с Valve Corp.</span></div><div class="footer-payments"><b>mastercard</b><b>VISA</b></div></div>
    <div class="footer-divider"></div>
    <div class="footer-stats">
      <div><img src="/chunks/online.svg" alt=""><b data-footer-online>${count(S.online)}</b><span>Онлайн</span></div><i></i>
      <div><img src="/chunks/allGamers.svg" alt=""><b>${count(stats.totalPlayers)}</b><span>Всего игроков</span></div><i></i>
      <div><img src="/chunks/cases.svg" alt=""><b>${count(stats.casesOpened)}</b><span>Открыто кейсов</span></div><i></i>
      <div><img src="/chunks/upgrade.svg" alt=""><b>${count(stats.upgradesMade)}</b><span>Сделано апгрейдов</span></div>
    </div>
  </footer>`;
}

function authConsentModal() {
  const ready = S.ageAccepted && S.termsAccepted;
  const check = value => value ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.2 3.1 3.1L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
  return `<div class="auth-consent-overlay">
    <div class="auth-consent" role="dialog" aria-modal="true" aria-label="Авторизация">
      <button class="auth-close" onclick="closeAuthModal()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button>
      <div class="auth-hero">
        <div class="auth-hero-shade"></div><img class="auth-logo" src="/chunks/logo.svg" alt="">
        <div class="auth-heading"><h2>АВТОРИЗАЦИЯ</h2><p>Для доступа к сервису примите условия пользования и авторизуйтесь через Steam.</p></div>
      </div>
      <div class="auth-consent-body">
        <div class="auth-check-row" onclick="toggleConsent('age')"><button type="button" role="checkbox" data-consent="age" aria-checked="${S.ageAccepted}" class="auth-checkbox ${S.ageAccepted ? 'checked' : ''}">${check(S.ageAccepted)}</button><span>Подтверждаю, что мне больше 18 лет</span></div>
        <div class="auth-check-row" onclick="toggleConsent('terms')"><button type="button" role="checkbox" data-consent="terms" aria-checked="${S.termsAccepted}" class="auth-checkbox ${S.termsAccepted ? 'checked' : ''}">${check(S.termsAccepted)}</button><span>Принимаю <a href="/tos.html" onclick="event.stopPropagation()" target="_blank">правила и условия</a> использования сайта</span></div>
        <button class="auth-steam-button" data-auth-submit ${ready ? '' : 'disabled'} onclick="confirmSteamLogin()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>
      </div>
    </div>
  </div>`;
}

function settingsModal() {
  const settings = S.settings || { nickname: S.me?.user?.name || '', tradeLink: '', privacy: 'private', streamerMode: false };
  const options = [
    ['private', 'Приватный', 'Только вы будете видеть информацию Steam-профиля. Профиль скрыт от парсер-ботов и посторонних пользователей.'],
    ['friends', 'Доступен только для друзей', 'Информацию профиля смогут видеть авторизованные пользователи из списка друзей.'],
    ['public', 'Публичный', 'Все пользователи смогут видеть информацию вашего профиля.']
  ];
  return `<div class="settings-overlay" role="presentation">
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-label="Настройки">
      <button class="settings-close" onclick="closeSettings()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button>
      <div class="settings-title"><img src="/chunks/settingIcon.svg" alt=""><h2>НАСТРОЙКИ</h2></div>
      <div class="settings-scroll">
        <label class="settings-field"><span>Никнейм</span><input id="settings-nickname" maxlength="32" value="${esc(settings.nickname)}" placeholder="Никнейм"></label>
        <label class="settings-field"><span>Трейд-ссылка</span><div class="settings-trade"><input id="settings-trade" value="${esc(settings.tradeLink)}" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."><button type="button" id="copy-trade-btn" onclick="copyTradeLink()" title="Копировать"><img id="copy-icon" src="/chunks/copyIcon.svg" alt="Копировать"><img id="copy-success" src="/chunks/success.svg" alt="Скопировано" style="display:none"></button></div><a href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url" target="_blank" rel="noreferrer">Узнать свою ссылку</a></label>
        <section class="settings-privacy"><h3>Приватность Steam</h3>${options.map(([value, title, text]) => `<button type="button" data-privacy="${value}" class="settings-privacy-option ${settings.privacy === value ? 'active' : ''}" onclick="selectPrivacy('${value}')"><i><b></b></i><span><strong>${title}</strong><small>${text}</small></span></button>`).join('')}</section>
        <section class="settings-streamer"><div><h3>Режим стримера</h3><p>Скрывает личную информацию и баланс для безопасности во время стрима</p></div><button type="button" class="settings-switch ${settings.streamerMode ? 'active' : ''}" aria-pressed="${settings.streamerMode}" onclick="toggleStreamerMode()"><i></i></button></section>
      </div>
      <button class="settings-save" onclick="saveSettings()">СОХРАНИТЬ И ЗАКРЫТЬ</button>
    </div>
  </div>`;
}

function paymentModal() {
  const methods = S.paymentTab === 'card'
    ? [['КАРТА', 'РЕКОМЕНДУЕМ'], ['СБП', ''], ['GIFT CARD', ''], ['БАНКОВСКИЙ ПЕРЕВОД', '']]
    : S.paymentTab === 'crypto'
      ? [['USDT', 'РЕКОМЕНДУЕМ'], ['BITCOIN', ''], ['ETHEREUM', '']]
      : [['ДЕПОЗИТ СКИНАМИ', 'РЕКОМЕНДУЕМ'], ['TRADE OFFER', '']];
  return `<div class="payment-overlay"><div class="payment-dialog" role="dialog" aria-modal="true" aria-label="Пополнение баланса">
    <header><h2>ПОПОЛНЕНИЕ БАЛАНСА</h2><button onclick="closePayment()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button></header>
    <div class="payment-tabs"><button class="${S.paymentTab === 'card' ? 'active' : ''}" onclick="setPaymentTab('card')"><i>▰</i>КАРТОЙ</button><button class="${S.paymentTab === 'crypto' ? 'active' : ''}" onclick="setPaymentTab('crypto')"><i>₿</i>КРИПТОЙ</button><button class="${S.paymentTab === 'skins' ? 'active' : ''}" onclick="setPaymentTab('skins')"><i>◆</i>СКИНАМИ</button></div>
    <div class="payment-body"><div class="payment-currency"><span>Выберите валюту пополнения</span><div class="currency-select">
      <button type="button" onclick="toggleCurrencyMenu()">${esc(S.paymentCurrency)}<i class="currency-chevron ${S.currencyOpen ? 'open' : ''}">${chevronIcon()}</i></button>
      ${S.currencyOpen ? `<div class="currency-menu">${CURRENCIES.map(item => `<button type="button" class="${item.code === S.paymentCurrency ? 'active' : ''}" onclick="setPaymentCurrency('${item.code}')"><span>${item.flag}</span><b>${esc(item.name)}</b><i>${item.code}</i>${item.code === S.paymentCurrency ? '<em>✓</em>' : ''}</button>`).join('')}</div>` : ''}
    </div></div><div class="payment-methods">${methods.map(([name, badge], index) => `<button class="${S.paymentMethod === index ? 'active' : ''}" onclick="selectPaymentMethod(${index})">${badge ? `<small>${badge}</small>` : ''}<b>${name}</b></button>`).join('')}</div></div>
    <div class="payment-bottom"><div class="payment-amount-head"><span>СУММА ПОПОЛНЕНИЯ</span><div>${[500,1000,2500,5000].map(amount => `<button class="${S.paymentAmount === amount ? 'active' : ''}" onclick="setPaymentAmount(${amount})">${amount.toLocaleString('ru-RU')}</button>`).join('')}</div></div>
      <label class="payment-amount"><span><input id="payment-amount" type="number" min="50" max="100000" value="${S.paymentAmount}"><b>${CURRENCY_BY_CODE[S.paymentCurrency]?.symbol || '₽'}</b></span><small>мин. 50</small></label>
      <div class="payment-promo"><span>◇</span><input id="payment-promo" placeholder="Введите промокод"><button onclick="applyPaymentPromo()">ПРИМЕНИТЬ</button></div>
      <button class="payment-submit" onclick="submitPayment()">ПОПОЛНИТЬ</button><p>Если после оплаты прошло более 30 минут, а баланс на сайте не пополнился, напишите нам в техподдержку</p>
    </div>
  </div></div>`;
}

function chatModal() {
  const emailGate = !S.chatEmailReady ? `<div class="support-email-overlay"><div class="support-email-card"><div><h3>Какой адрес вашей электронной почты?</h3><p>Введите свой email, чтобы узнать, когда мы ответим:</p></div><input id="support-email" type="email" autocomplete="email" value="${esc(S.chatEmail)}" placeholder="Введите свой email..."><button onclick="submitSupportEmail()">УСТАНОВИТЬ МОЙ EMAIL</button></div></div>` : '';
  return `<div class="support-chat-window" role="dialog" aria-modal="false" aria-label="Чат поддержки">
    <div class="support-chat-header"><div class="support-agent"><img src="/chunks/logo.svg" alt=""><i></i></div><div><h3>Вопросы? Напишите нам в чат!</h3><span>Наша команда сейчас онлайн</span></div><button onclick="closeChat()" aria-label="Закрыть">×</button></div>
    <div class="support-chat-body" id="chatbody"><div class="support-welcome">Как мы можем вам помочь с ${esc(S.brand)}?</div></div>
    <form class="support-composer" onsubmit="sendChat(event)"><input id="chatinput" maxlength="2000" placeholder="Отправьте сообщение..."><button aria-label="Отправить">➤</button></form>
    ${emailGate}
  </div>`;
}

function pageContent() {
  if (S.page === 'cases') return casesPage();
  if (S.page === 'case') return caseDetailPage();
  if (S.page === 'profile' || S.page === 'inventory') return profilePage();
  if (S.page === 'rewards') return rewardsPage();
  if (S.page === 'steal') return stealPage();
  return upgradePage();
}
function openInventory() {
  S.page = 'profile';
  S.profileTab = 'items';
  render();
}
let lastPageRendered = null;
function render() {
  const app = $('#app');
  const html = header() + `<div class="layout">${sidebar()}<main class="main"><div class="page" data-page="${esc(S.page || '')}">${pageContent()}</div></main></div>${siteFooter()}
    <div class="support"><button onclick="openChat()" aria-label="Поддержка" title="Поддержка"><img src="/chunks/pomosh.webp" alt="Поддержка"></button></div>${S.chat ? chatModal() : ''}${S.authModal ? authConsentModal() : ''}${S.settingsOpen ? settingsModal() : ''}${S.paymentOpen ? paymentModal() : ''}${resultOverlay()}${caseRevealOverlay()}`;
  const pageChanged = S.page !== lastPageRendered;
  lastPageRendered = S.page;
  if (window.morphdom) {
    morphdom(app, `<div class="app-root">${html}</div>`, {
      childrenOnly: true,
      getNodeKey(node) {
        if (node && node.nodeType === 1 && node.id) return node.id;
        return undefined;
      },
      onBeforeElUpdated(fromEl, toEl) {
        if (!fromEl || fromEl.nodeType !== 1 || !toEl) return;
        if (fromEl === document.activeElement && (fromEl.tagName === 'INPUT' || fromEl.tagName === 'TEXTAREA' || fromEl.tagName === 'SELECT')) return false;
        if (S.spinning && fromEl.classList && fromEl.classList.contains('pointer-orbit')) return false;
      }
    });
  } else {
    app.innerHTML = html;
  }
  if (pageChanged) {
    const pageEl = app.querySelector('.page');
    if (pageEl) {
      pageEl.classList.remove('page-enter');
      void pageEl.offsetWidth;
      pageEl.classList.add('page-enter');
    }
  }
  ensureImages();
  if (S.chat) loadChat();
}

let imageFallbackTimer = null;
function ensureImages() {
  if (imageFallbackTimer) clearTimeout(imageFallbackTimer);
  imageFallbackTimer = setTimeout(() => {
    for (const img of document.querySelectorAll('img[data-fb]')) {
      if (img.complete && img.naturalWidth > 0) continue;
      const rect = img.getBoundingClientRect();
      const inView = rect.top < innerHeight && rect.bottom > 0 && rect.right > 0 && rect.left < innerWidth;
      if (!inView) continue;
      const fallback = img.dataset.fb;
      if (fallback) {
        img.dataset.fb = '';
        img.onerror = null;
        img.src = fallback;
      }
    }
  }, 4000);
}

function upgradeBaseValue() {
  return (S.from ? Number(S.from.priceCents) : 0) + Number(S.addBalance || 0);
}
function clampChance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}
function formatChance(value) {
  if (value == null) return '0%';
  const chance = clampChance(value);
  if (chance <= 0) return '0%';
  if (chance >= 100) return '100%';

  return `${Number(chance.toFixed(2))}%`;
}
function recalculateChance() {
  const value = upgradeBaseValue();
  const targetPrice = S.to ? Number(S.to.priceCents) : 0;
  if (!S.from || !S.to || !Number.isFinite(targetPrice) || targetPrice <= 0) { S.chance = null; return; }

  S.chance = clampChance(Math.floor(value / targetPrice * 10000) / 100);
}
function boostMinimumPrice(baseValue, boost) {
  return boost >= 100
    ? Math.ceil(baseValue * boost / 100)
    : Math.ceil(baseValue * 100 / boost);
}
function upgradeTargets() {
  if (!S.from) return [];
  const minimum = boostMinimumPrice(upgradeBaseValue(), S.boost);
  return S.catalog.filter(item => item.priceCents >= minimum).sort((a, b) => a.priceCents - b.priceCents);
}
function choose(id, side) {
  const item = side === 'from'
    ? S.inventory.find(value => String(value.assetid) === String(id))
    : S.catalog.find(value => String(value.catalogId) === String(id));
  if (!item) return;
  if (side === 'from') {
    S.from = item;
    setBoost(S.boost, false);
  } else {
    // Защита от рассинхрона фильтра/состояния: цель должна удовлетворять бусту.
    const baseValue = upgradeBaseValue();
    const minimum = boostMinimumPrice(baseValue, S.boost);
    if (Number(item.priceCents) < minimum) {
      toast('Цель не соответствует выбранному проценту апгрейда', 'error');
      return;
    }
    S.to = item;
  }
  recalculateChance();
  render();
}
function setBoost(value, shouldRender = true) {
  S.boost = Number(value);
  // Смена буста меняет множество доступных целей — сбрасываем постраничку.
  S.targetPage = 1;
  const targets = upgradeTargets();
  S.to = targets[0] || null;
  recalculateChance();
  if (shouldRender) render();
}
function setAddBalance(value) {
  const balanceCents = Number(S.me.user.balanceCents || 0);
  S.addBalance = Math.round(Math.min(Math.max(Number(value) || 0, 0), balanceCents / 100) * 100);
  // Добавление баланса снижает минимальную стоимость цели — сбрасываем страницу.
  S.targetPage = 1;
  // Если выбранная цель больше не удовлетворяет минимому, сбрасываем её.
  if (S.to) {
    const minimum = boostMinimumPrice(upgradeBaseValue(), S.boost);
    if (Number(S.to.priceCents) < minimum) S.to = null;
  }
  recalculateChance();
  render();
}
function applyTargetFilters() {
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  S.targetMin = document.querySelector('#target-min')?.value?.trim() || '';
  S.targetMax = document.querySelector('#target-max')?.value?.trim() || '';
  S.targetSearch = document.querySelector('#target-search')?.value?.trim() || '';
  S.targetPage = 1;
  render();
  if (activeId) {
    const el = typeof document.getElementById === 'function' ? document.getElementById(activeId) : null;
    if (el) {
      el.focus();
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch (_) {}
    }
  }
}
function setTargetPage(page) {
  const pageSize = 16;
  const query = S.targetSearch.trim().toLowerCase();
  const baseValue = upgradeBaseValue();
  const minimumPrice = S.from ? boostMinimumPrice(baseValue, S.boost) : 0;
  const userMin = S.targetMin === '' ? 0 : Number(S.targetMin) * 100;
  const minT = Math.max(minimumPrice, Number.isFinite(userMin) ? userMin : 0);
  const maxT = S.targetMax === '' ? Infinity : Number(S.targetMax) * 100;
  const filtered = S.catalog.filter(item => item.priceCents >= minT && item.priceCents <= maxT && (!query || `${item.weapon} ${item.skin} ${item.name}`.toLowerCase().includes(query)));
  const count = Math.max(1, Math.ceil(filtered.length / pageSize));
  S.targetPage = Math.max(1, Math.min(page, count));
  render();
}
function sendToUpgrade(id) {
  const item = S.inventory.find(value => String(value.assetid) === String(id));
  if (!item) return toast('Предмет уже недоступен');
  S.page = 'upgrade';
  S.from = item;
  setBoost(S.boost, false);
  render();
}
async function sellItem(id) {
  try {
    const result = await api(`/api/inventory/${encodeURIComponent(id)}/sell`, { method: 'POST' });
    await refreshAccount();
    if (S.from && String(S.from.assetid) === String(id)) { S.from = null; S.to = null; S.chance = null; }
    render();
    toast(`Предмет продан за ${money(result.amountCents)}`);
  } catch (error) { toast(error.message, 'error'); }
}

async function refreshAccount() {
  const [me, inventory, cases, drops, profile, stats] = await Promise.all([
    api('/api/me'), api('/api/inventory'), api('/api/cases'), api('/api/live-drops'), api('/api/profile'), api('/api/stats')
  ]);
  S.me = me;
  S.inventory = inventory.items || [];
  S.inventoryFeed = inventory.feed || inventory.items || [];
  S.cases = cases.cases || [];
  S.drops = drops;
  S.profile = profile;
  S.globalStats = stats;
  const balanceCents = Number(S.me?.user?.balanceCents || 0);
  if (S.addBalance > balanceCents) S.addBalance = Math.max(0, balanceCents);
}

function selectCase(caseId) {
  S.activeCase = caseId;
  S.caseResult = null;
  S.rouletteItems = [];
  S.page = 'case';
  render();
}
function buildRoulette(caseData, winner) {
  const pool = caseData.contents;
  const items = Array.from({ length: 48 }, () => pool[Math.floor(Math.random() * pool.length)]);
  items[41] = winner;
  return items;
}
async function openCase(caseId) {
  if (S.opening) return;
  const caseData = S.cases.find(item => item.id === caseId);
  if (!caseData) return;
  S.opening = caseId;
  S.caseResult = null;
  S.rouletteItems = [];
  render();
  try {
    const result = await api('/api/cases/open', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId })
    });
    S.rouletteItems = buildRoulette(caseData, result.item);
    render();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      const track = document.querySelector('.case-roll-track');
      const viewport = document.querySelector('.case-roulette');
      if (track && viewport) {
        const stop = 41 * 178 - viewport.clientWidth / 2 + 84;
        track.style.transform = `translate3d(-${Math.max(0, stop)}px,0,0)`;
        track.classList.add('rolling');
      }
      setTimeout(resolve, 4400);
    })));
    await refreshAccount();
    S.rouletteItems = [];
    S.caseResult = result.item;
    S.caseReveal = true;
  } catch (error) {
    S.rouletteItems = [];
    toast(error.message, 'error');
  } finally {
    S.opening = null;
    render();
    if (S.caseReveal) {
      setTimeout(() => { if (S.caseReveal) { S.caseReveal = false; render(); } }, 6000);
    }
  }
}

let pointerRaf = null;
let pointerCurrent = 0;

function applyPointerAngle(deg) {
  S.pointerAngle = Math.round(deg * 100) / 100;
  const orbit = document.querySelector('.pointer-orbit');
  if (orbit) orbit.style.setProperty('--angle', S.pointerAngle + 'deg');
}

function startPointerSpin() {
  if (pointerRaf) cancelAnimationFrame(pointerRaf);
  let last = performance.now();
  const step = now => {
    if (!S.spinning) { pointerRaf = null; return; }
    const dt = Math.min(64, now - last);
    last = now;

    pointerCurrent += dt * 0.54;
    applyPointerAngle(pointerCurrent);
    pointerRaf = requestAnimationFrame(step);
  };
  pointerRaf = requestAnimationFrame(step);
}

function pointerLanding(won, chance) {
  const value = clampChance(chance);
  const half = value * 1.8;
  const rand = (min, max) => min + Math.random() * (max - min);
  const margin = 1.2;
  let target;
  if (won) {
    const inner = Math.max(0, half - margin);
    target = inner > 0 ? rand(-inner, inner) : 0;
  } else {
    const lossHalf = Math.max(0, 180 - half - margin);
    target = lossHalf > 0 ? 180 + rand(-lossHalf, lossHalf) : 180;
  }
  target = ((target % 360) + 360) % 360;

  const current = ((pointerCurrent % 360) + 360) % 360;
  let delta = target - current;
  while (delta <= 0) delta += 360;
  return pointerCurrent + 4 * 360 + delta;
}

function spinPointerTo(total, duration = 2400) {
  return new Promise(resolve => {
    if (pointerRaf) cancelAnimationFrame(pointerRaf);
    pointerRaf = null;
    const start = pointerCurrent;
    const delta = total - start;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const t = Math.min(1, (now - t0) / duration);
      pointerCurrent = start + delta * ease(t);
      applyPointerAngle(pointerCurrent);
      if (t < 1) pointerRaf = requestAnimationFrame(step);
      else {
        pointerCurrent = total;
        applyPointerAngle(pointerCurrent);
        pointerRaf = null;
        resolve();
      }
    };
    pointerRaf = requestAnimationFrame(step);
  });
}

async function upgrade() {
  if (!S.from || !S.to || S.spinning) return;
  S.spinning = true;
  startPointerSpin();
  render();
  try {
    const result = await api('/api/upgrade', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAssetId: S.from.assetid, toCatalogId: S.to.catalogId, boostPercent: S.boost, addBalanceCents: S.addBalance })
    });

    S.chance = clampChance(result.chance);
    const wheelEl = document.querySelector('.wheel');
    if (wheelEl) {
      wheelEl.style.setProperty('--chance', S.chance + '%');
      wheelEl.style.setProperty('--chance-half', (S.chance / 2).toFixed(3) + '%');
    }
    const headEl = document.querySelector('.wheelhead b');
    if (headEl) headEl.textContent = formatChance(S.chance);
    const centerEl = document.querySelector('.wheelcenter strong');
    if (centerEl) centerEl.textContent = formatChance(S.chance);
    await new Promise(resolve => setTimeout(resolve, S.turbo ? 250 : 700));
    const total = pointerLanding(!!result.won, result.chance);
    await spinPointerTo(total, S.turbo ? 1400 : 2400);
    await refreshAccount();
    S.upgradeResult = {
      won: !!result.won,
      item: result.item || null,
      from: S.from,
      to: S.to
    };
    S.from = null;
    S.to = null;
    S.chance = null;
    S.addBalance = 0;
  } catch (error) {
    S.upgradeResult = null;
    if (pointerRaf) cancelAnimationFrame(pointerRaf);
    pointerRaf = null;
    pointerCurrent = 0;
    applyPointerAngle(0);
    toast(error.message, 'error');
  } finally {
    S.spinning = false;
    render();
    if (S.upgradeResult) {
      setTimeout(() => { if (S.upgradeResult) { S.upgradeResult = null; render(); } }, 8000);
    }
  }
}
function resetPointer() {
  if (pointerRaf) cancelAnimationFrame(pointerRaf);
  pointerRaf = null;
  pointerCurrent = 0;
  applyPointerAngle(0);
}
function closeUpgradeResult() {
  S.upgradeResult = null;
  resetPointer();
  render();
}
function resultCheckIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function resultCrossIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
}
function resultItemBlock(item) {
  if (!item) return '';
  return `<div class="result-item skin-card" ${rarityStyle(item)}>
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name || '')}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>${rarityLine()}
  </div>`;
}
function caseRevealOverlay() {
  if (!S.caseReveal || !S.caseResult) return '';
  const item = S.caseResult;
  return `<div class="result-overlay win" role="dialog" aria-modal="true" aria-label="Выпал предмет">
    <div class="result-card">
      <div class="result-badge">${resultCheckIcon()}</div>
      <h2>ВЫПАЛ ПРЕДМЕТ</h2>
      <p>${esc(item.name)} добавлен в инвентарь сайта</p>
      ${resultItemBlock(item)}
      ${resultParticles()}
      <button class="result-close" onclick="closeCaseReveal()">В ИНВЕНТАРЬ</button>
    </div>
  </div>`;
}
function closeCaseReveal() {
  S.caseReveal = false;
  S.caseResult = null;
  if (S.page === 'case') { S.page = 'inventory'; }
  render();
}
function resultParticles() {
  const colors = ['#1075E0', '#56A8FF', '#1AECFF', '#44C987', '#FFFFFF'];
  const parts = Array.from({ length: 22 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 60;
    const size = 4 + Math.random() * 7;
    const color = colors[i % colors.length];
    return `<i style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--d:${(Math.random() * 0.45).toFixed(2)}s;--dur:${(0.9 + Math.random() * 0.9).toFixed(2)}s;--s:${size.toFixed(1)}px;--c:${color}"></i>`;
  }).join('');
  return `<div class="result-particles" aria-hidden="true">${parts}</div>`;
}
function resultOverlay() {
  const result = S.upgradeResult;
  if (!result) return '';
  const won = result.won;
  const item = won ? result.item : result.from;
  return `<div class="result-overlay ${won ? 'win' : 'lose'}" role="dialog" aria-modal="true" aria-label="${won ? 'Апгрейд успешен' : 'Апгрейд не удался'}">
    <div class="result-card">
      <div class="result-badge">${won ? resultCheckIcon() : resultCrossIcon()}</div>
      <h2>${won ? 'АПГРЕЙД УСПЕШЕН' : 'АПГРЕЙД НЕ УДАЛСЯ'}</h2>
      <p>${won ? 'Новый предмет добавлен в инвентарь сайта' : 'Исходный предмет был использован в апгрейде'}</p>
      ${resultItemBlock(item)}
      ${resultParticles()}
      <button class="result-close" onclick="closeUpgradeResult()">ПРОДОЛЖИТЬ</button>
    </div>
  </div>`;
}

function toggleSoundBtn() {
  const next = localStorage.getItem('keyser-sound') === '0';
  localStorage.setItem('keyser-sound', next ? '1' : '0');
  render();
}
function toggleTurbo() {
  S.turbo = !S.turbo;
  localStorage.setItem('keyser-turbo', S.turbo ? '1' : '0');
  render();
}
function toggleCurrencyMenu() {
  S.currencyOpen = !S.currencyOpen;
  render();
}
function setPaymentCurrency(code) {
  S.paymentCurrency = code;
  S.currencyOpen = false;
  render();
}
function toggleFooterLang() {
  S.footerLangOpen = !S.footerLangOpen;
  render();
}
function setFooterLang(code) {
  S.footerLang = code;
  S.footerLangOpen = false;
  render();
}

function chatDayLabel(ts) {
  const date = new Date(Number(ts));
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (same(date, today)) return 'Сегодня';
  if (same(date, yesterday)) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}
function chatBubbles(rows) {
  let html = '';
  let lastDay = '';
  for (const row of rows) {
    const day = chatDayLabel(row.createdAt);
    if (day !== lastDay) {
      lastDay = day;
      html += `<div class="chat-day-sep"><span>${esc(day)}</span></div>`;
    }
    const time = new Date(Number(row.createdAt)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="chat-line ${row.fromStaff ? 'from-staff' : 'from-me'}">
      <div class="chat-bubble">
        ${row.fromStaff ? '<b class="chat-author">Поддержка</b>' : ''}
        <p>${esc(row.message)}</p>
        <time>${esc(time)}</time>
      </div>
    </div>`;
  }
  return html;
}
async function loadChat() {
  if (!S.chatEmailReady) return;
  if (!S.me?.authenticated) {
    $('#chatbody').innerHTML = '<div class="support-system-message">Авторизуйтесь через Steam, чтобы отправить сообщение оператору.</div>';
    return;
  }
  try {
    const rows = await api('/api/support/messages');
    const body = $('#chatbody');
    body.innerHTML = rows.length
      ? chatBubbles(rows)
      : `<div class="support-welcome">Как мы можем вам помочь с ${esc(S.brand)}?</div>`;
    body.scrollTop = body.scrollHeight;
  } catch (error) {
    $('#chatbody').textContent = error.message;
  }
}
async function sendChat(event) {
  event.preventDefault();
  const input = $('#chatinput');
  const message = input.value.trim();
  if (!message) return;
  try {
    await api('/api/support/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
    });
    input.value = '';
    loadChat();
  } catch (error) { toast(error.message); }
}

function go(page) {
  S.page = page;
  if (page !== 'case') { S.caseResult = null; S.rouletteItems = []; }
  render();
}
function sideTab(tab) { S.tab = tab; render(); }
function setProfileTab(tab) { S.profileTab = tab; render(); }
function login() { S.authModal = true; render(); }
function closeAuthModal() { S.authModal = false; render(); }
function toggleConsent(type) {
  if (type === 'age') S.ageAccepted = !S.ageAccepted;
  if (type === 'terms') S.termsAccepted = !S.termsAccepted;
  const mark = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.2 3.1 3.1L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  for (const key of ['age', 'terms']) {
    const button = document.querySelector(`[data-consent="${key}"]`);
    const checked = key === 'age' ? S.ageAccepted : S.termsAccepted;
    if (button) {
      button.classList.toggle('checked', checked);
      button.setAttribute('aria-checked', String(checked));
      button.innerHTML = checked ? mark : '';
    }
  }
  const submit = document.querySelector('[data-auth-submit]');
  if (submit) submit.disabled = !(S.ageAccepted && S.termsAccepted);
}
function confirmSteamLogin() {
  if (!S.ageAccepted || !S.termsAccepted) return;
  location.href = '/auth/steam';
}
async function logout() { await api('/auth/logout', { method: 'POST' }); location.reload(); }
async function openSettings() {
  try {
    S.settings = await api('/api/settings');
    S.settingsOpen = true;
    render();
  } catch (error) { toast(error.message); }
}
function closeSettings() { S.settingsOpen = false; render(); }
function selectPrivacy(value) {
  if (!S.settings) return;
  S.settings.privacy = value;
  for (const option of document.querySelectorAll?.('[data-privacy]') || []) {
    option.classList.toggle('active', option.dataset.privacy === value);
  }
}
function toggleStreamerMode() {
  if (!S.settings) return;
  S.settings.streamerMode = !S.settings.streamerMode;
  const button = document.querySelector('.settings-switch');
  if (button) {
    button.classList.toggle('active', S.settings.streamerMode);
    button.setAttribute('aria-pressed', String(S.settings.streamerMode));
  }
}
function flashCopySuccess() {
  const copyIcon = document.querySelector('#copy-icon');
  const successIcon = document.querySelector('#copy-success');
  if (!copyIcon || !successIcon) return;
  copyIcon.style.display = 'none';
  successIcon.style.display = 'block';
  setTimeout(() => {
    if (copyIcon) copyIcon.style.display = 'block';
    if (successIcon) successIcon.style.display = 'none';
  }, 1500);
}
function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); return true; }
  catch { return false; }
  finally { area.remove(); }
}
async function copyTradeLink() {
  const value = document.querySelector('#settings-trade')?.value || '';
  if (!value) return toast('Сначала вставьте трейд-ссылку');
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(value); ok = true; }
      catch { ok = legacyCopy(value); }
    } else {
      ok = legacyCopy(value);
    }
  } catch { ok = legacyCopy(value); }
  if (ok) {
    flashCopySuccess();
    toast('Трейд-ссылка скопирована');
  } else {
    toast('Не удалось скопировать ссылку');
  }
}
async function saveSettings() {
  if (!S.settings) return;
  const nickname = document.querySelector('#settings-nickname')?.value?.trim() || '';
  const tradeLink = document.querySelector('#settings-trade')?.value?.trim() || '';
  try {
    const saved = await api('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, tradeLink, privacy: S.settings.privacy, streamerMode: S.settings.streamerMode })
    });
    S.settings = saved;
    if (S.me?.user) S.me.user.name = saved.nickname;
    if (S.profile?.user) S.profile.user.name = saved.nickname;
    S.settingsOpen = false;
    render();
    toast('Настройки сохранены');
  } catch (error) { toast(error.message); }
}
function openPayment() { S.paymentOpen = true; render(); }
function closePayment() { S.paymentOpen = false; render(); }
function setPaymentTab(tab) { S.paymentTab = tab; S.paymentMethod = 0; render(); }
function selectPaymentMethod(index) { S.paymentMethod = Number(index); render(); }
function setPaymentAmount(amount) { S.paymentAmount = Number(amount); render(); }
function applyPaymentPromo() {
  const code = document.querySelector('#payment-promo')?.value?.trim() || '';
  toast(code ? 'Промокод будет проверен платёжным провайдером' : 'Введите промокод');
}
function submitPayment() {
  const amount = Number(document.querySelector('#payment-amount')?.value || S.paymentAmount);
  const symbol = CURRENCY_BY_CODE[S.paymentCurrency]?.symbol || '₽';
  if (!Number.isFinite(amount) || amount < 50) return toast(`Минимальная сумма пополнения — 50 ${symbol}`);
  toast('Платёжный провайдер пока не подключён');
}
async function openChat() {
  try {
    const contact = await api('/api/support/contact');
    const localEmail = typeof localStorage !== 'undefined' ? (localStorage.getItem('keyser-support-email') || '') : '';
    S.chatEmail = contact.email || localEmail;
    S.chatEmailReady = !!S.chatEmail;
  } catch {
    S.chatEmail = '';
    S.chatEmailReady = false;
  }
  S.chat = true;
  render();
}
async function submitSupportEmail() {
  const email = document.querySelector('#support-email')?.value?.trim().toLowerCase() || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return toast('Введите корректный email');
  try {
    if (S.me?.authenticated) await api('/api/support/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    if (typeof localStorage !== 'undefined') localStorage.setItem('keyser-support-email', email);
    S.chatEmail = email;
    S.chatEmailReady = true;
    render();
  } catch (error) { toast(error.message); }
}
function closeChat() { S.chat = false; render(); }
function toast(text, type = '') {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast ${type}">${esc(text)}</div>`;
  setTimeout(() => { root.innerHTML = ''; }, 3200);
}

Object.assign(window, {
  go, sideTab, setProfileTab, choose, setBoost, setAddBalance, applyTargetFilters, setTargetPage, sendToUpgrade, sellItem, toggleSellMode, toggleSellItem, sellSelectAll, sellSelectedItems, toggleProfileSort, setProfileSort, selectCase, openCase, upgrade,
  login, closeAuthModal, toggleConsent, confirmSteamLogin, logout,
  openSettings, closeSettings, selectPrivacy, toggleStreamerMode, copyTradeLink, saveSettings,
  openPayment, closePayment, setPaymentTab, selectPaymentMethod, setPaymentAmount, applyPaymentPromo, submitPayment,
  openChat, submitSupportEmail, closeChat, sendChat,
  toggleTurbo, toggleSoundBtn, toggleCurrencyMenu, setPaymentCurrency, toggleFooterLang, setFooterLang,
  closeUpgradeResult, closeCaseReveal, openInventory
});
if (typeof window.openNotifications !== 'function') {
  window.openNotifications = async () => {
    try {
      const data = await api('/api/notifications');
      const list = (data.notifications || []);
      if (!list.length) { toast('Уведомлений нет'); return; }
      const body = list.slice(0, 10).map(n => `<div style="padding:8px 0;border-bottom:1px solid rgba(86,168,255,.12)"><b style="color:#56A8FF">${esc(n.title)}</b><div style="color:#dce5f1;margin-top:4px">${esc(n.body)}</div></div>`).join('');
      const html = `<div class="notifications-modal" style="position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:rgba(0,0,0,.65);backdrop-filter:blur(3px)" onclick="if(event.target===this)this.remove()"><div style="background:linear-gradient(180deg,#1b2436,#12151f);border:1px solid rgba(86,168,255,.25);border-radius:10px;padding:20px;max-width:480px;width:90%;max-height:80vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.6)"><h3 style="margin:0 0 12px;color:#fff">Уведомления</h3>${body}<button class="upgrade" style="margin-top:14px;width:100%" onclick="this.closest('.notifications-modal').remove()">Закрыть</button></div></div>`;
      document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) { toast(e.message, 'error'); }
  };
}
boot();
