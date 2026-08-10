const S = {
  page: 'upgrade', me: null, inventory: [], catalog: [], cases: [], drops: [], online: 0,
  tab: 'inventory', from: null, to: null, chance: null, boost: 10, spinning: false,
  opening: null, activeCase: null, rouletteItems: [], caseResult: null,
  authModal: false, ageAccepted: false, termsAccepted: false,
  chat: false, brand: 'КЕЙСЕР', telegram: 'https://t.me/'
};

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, match => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[match]));
const money = cents => cents == null
  ? '—'
  : (Number(cents) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
const safeColor = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#74ffca';
const rarityStyle = item => `style="--rarity:${safeColor(item?.rarityColor)}"`;
const image = (src, alt = '') => src
  ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">`
  : '';
const art = item => `<div class="art" ${rarityStyle(item)}>${image(item?.icon || item?.itemIcon, item?.name || item?.itemName || '')}</div>`;
const sourceName = source => String(source || '').startsWith('upgrade') ? 'АПГРЕЙД' : 'КЕЙС';

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(json.error || `HTTP ${response.status}`);
  return json;
}

async function boot() {
  try {
    const [config, me, drops, online, catalog, cases] = await Promise.all([
      api('/api/config'), api('/api/me'), api('/api/live-drops'), api('/api/online'),
      api('/api/catalog'), api('/api/cases')
    ]);
    S.brand = config.brand;
    S.telegram = config.telegram;
    S.me = me;
    S.drops = drops;
    S.online = online.online;
    S.catalog = catalog;
    S.cases = cases.cases || [];
    if (me.authenticated) {
      const inventory = await api('/api/inventory');
      S.inventory = inventory.items || [];
    }
    render();
    listen();
  } catch (error) {
    console.error(error);
    render();
    toast('Не удалось загрузить данные');
  }
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
}

function updateOnline() {
  const element = document.querySelector('[data-online]');
  if (element) element.textContent = S.online;
}

function steamIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-9.78 8h4.16a6 6 0 1 1-.02 4H2.2A10 10 0 1 0 12 2Zm-3.4 9.15a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm5.4-4.05a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>`;
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
  const balance = S.me?.authenticated ? money(S.me.user.balanceCents) : '0,00 ₽';
  return `<header class="top">
    <div class="brand"><img src="/chunks/logo.svg" alt=""><span>${esc(S.brand)}</span></div>
    <nav class="nav">
      <button class="${S.page === 'cases' || S.page === 'case' ? 'active' : ''}" onclick="go('cases')">КЕЙСЫ</button>
      <button class="${S.page === 'inventory' ? 'active' : ''}" onclick="go('inventory')">ИНВЕНТАРЬ</button>
      <button class="${S.page === 'upgrade' ? 'active' : ''}" onclick="go('upgrade')">АПГРЕЙДЫ</button>
      <button class="${S.page === 'rewards' ? 'active' : ''}" onclick="go('rewards')">НАГРАДЫ</button>
      <button class="${S.page === 'steal' ? 'active' : ''}" onclick="go('steal')">STEAL</button>
    </nav>
    <div class="actions">
      <a class="telegram" href="${esc(S.telegram)}" target="_blank" rel="noopener">${telegramIcon()}</a>
      <div class="balance">Баланс <b>${balance}</b></div>
      ${S.me?.authenticated
        ? `<button class="steam account-button" onclick="logout()">${S.me.user.avatar ? image(S.me.user.avatar, '') : ''}<span>ВЫЙТИ</span></button>`
        : `<button class="steam" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>`}
    </div>
  </header>`;
}

function sideItem(item) {
  return `<div class="side-item skin-item" ${rarityStyle(item)}>
    ${art(item)}
    <div class="side-item-copy">
      <b class="side-price">${money(item.priceCents)}</b>
      <div class="item-name">${esc(item.weapon || item.name)}</div>
      <div class="item-skin">${esc(item.skin || item.marketName)}</div>
      <div class="item-rarity">${esc(item.rarity)}</div>
    </div>
    <i class="skin-rarity-line"></i>
  </div>`;
}

function sidebar() {
  const items = S.tab === 'hot'
    ? S.inventory.filter(item => Number(item.rarityRank) >= 4)
    : S.inventory;
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
  return `<span class="skin-price">${money(item.priceCents)}</span>`;
}
function rarityLine() {
  return '<i class="skin-rarity-line"></i>';
}
function skinCard(item, options = {}) {
  const tag = options.button ? 'button' : 'div';
  const attrs = options.onclick ? ` onclick="${options.onclick}"` : '';
  const className = options.className || 'card';
  return `<${tag} class="${className} skin-card" ${rarityStyle(item)}${attrs}>
    ${priceTag(item)}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>${rarityLine()}
  </${tag}>`;
}
function pickCard(item, side) {
  const id = side === 'from' ? item.assetid : item.catalogId;
  return `<button class="pick-card skin-card" ${rarityStyle(item)} onclick="choose('${esc(id)}','${side}')">
    ${priceTag(item)}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}
  </button>`;
}
function selected(item) {
  return item
    ? `<div class="selected skin-item" ${rarityStyle(item)}>
        ${art(item)}
        <div class="selected-info"><strong>${esc(item.weapon || item.name)}</strong><span>${esc(item.skin || item.marketName || '')}</span><small>${esc(item.rarity || '')}</small><b>${money(item.priceCents)}</b></div>
        ${rarityLine()}
      </div>`
    : '<div class="selected empty">Выбранный предмет появится здесь</div>';
}

function loginRequired(title, text) {
  return `<div class="login-box"><h1>${esc(title)}</h1><p class="sub">${esc(text)}</p>
    <button class="steam" style="margin:20px auto 0" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>
  </div>`;
}

function upgradePage() {
  if (!S.me?.authenticated) return loginRequired('АПГРЕЙДЫ', 'Войдите в аккаунт. Для апгрейда используются только предметы из инвентаря сайта.');
  const inventory = S.inventory;
  const minimumPrice = S.from ? Math.ceil(S.from.priceCents * (1 + S.boost / 100)) : 0;
  const targets = S.from ? S.catalog.filter(item => item.priceCents >= minimumPrice) : [];
  const chance = S.chance == null ? 0 : S.chance;
  const boostButtons = [10, 30, 50, 75].map(value => `<button class="${S.boost === value ? 'active' : ''}" onclick="setBoost(${value})">${value}%</button>`).join('');
  return `<section class="upgrid">
      <div class="panel"><div class="title">ВЫБЕРИТЕ <b>&nbsp;ПРЕДМЕТ ДЛЯ ИСПОЛЬЗОВАНИЯ</b></div>
        ${selected(S.from)}
        <div class="pick">${inventory.length ? inventory.map(item => pickCard(item, 'from')).join('') : '<div class="pick-empty">Сначала откройте кейс</div>'}</div>
      </div>
      <div class="wheelbox">
        <div class="wheelhead"><span>ШАНС АПГРЕЙДА</span><b>${chance}%</b></div>
        <div class="wheel-stage"><div class="wheel ${S.spinning ? 'spin' : ''}" style="--chance:${chance}%;--angle:${S.spinning ? '1440deg' : '0deg'}">
          <img class="wheel-logo" src="/chunks/logo.svg" alt=""><div class="wheelcenter"><strong>${chance}%</strong><span>${chance ? 'расчёт по стоимости' : 'выберите предметы'}</span></div>
        </div><i class="pointer" aria-hidden="true"></i></div>
        <div class="boost-label">УВЕЛИЧИТЬ СТОИМОСТЬ ЦЕЛИ</div><div class="boost-buttons">${boostButtons}</div>
        <button class="upgrade" ${!S.from || !S.to || S.spinning ? 'disabled' : ''} onclick="upgrade()">
          <img class="upgrade-icon" src="/chunks/upgrade.svg" alt="">${S.spinning ? 'АПГРЕЙД...' : 'АПГРЕЙД'}
        </button>
        <div class="under">${S.from && S.to ? `${money(S.from.priceCents)} → ${money(S.to.priceCents)}` : S.from ? `Цель от ${money(minimumPrice)}` : 'Выберите предмет слева и цель справа'}</div>
      </div>
      <div class="panel target-preview-panel"><div class="title">ВЫБРАННАЯ <b>&nbsp;ЦЕЛЬ АПГРЕЙДА</b></div>
        ${selected(S.to)}
        <div class="target-preview-hint">ЦЕЛЬ ВЫБИРАЕТСЯ ТОЛЬКО В РАЗДЕЛЕ «ЦЕЛИ АПГРЕЙДА» НИЖЕ</div>
      </div>
    </section>
    <section class="lower">
      <div class="panel"><div class="title">▣ &nbsp;<b>МОИ ПРЕДМЕТЫ</b></div><div class="grid">${inventory.slice(0, 8).map(item => skinCard(item, { button: true, onclick: `choose('${item.assetid}','from')` })).join('')}</div></div>
      <div class="panel"><div class="title">⌃ &nbsp;<b>ЦЕЛИ АПГРЕЙДА</b></div><div class="grid">${targets.slice(0, 8).map(item => skinCard(item, { button: true, onclick: `choose('${item.catalogId}','to')` })).join('')}</div></div>
    </section>
    ${dropsSection()}`;
}

function dropsSection() {
  return `<section class="panel feed"><div class="title">🔥 &nbsp;<b>ПОСЛЕДНИЕ УДАЧИ</b><span style="margin-left:auto">${S.drops.length ? 'LIVE' : 'ПОКА СОБЫТИЙ НЕТ'}</span></div>
    <div class="feedgrid">${S.drops.length
      ? S.drops.slice(0, 12).map(drop => {
          const item = { name: drop.itemName, weapon: String(drop.itemName).split(' | ')[0], skin: String(drop.itemName).split(' | ')[1] || '', icon: drop.itemIcon, priceCents: drop.priceCents, rarity: drop.rarity, rarityColor: drop.rarityColor };
          return `<div class="drop skin-item" ${rarityStyle(item)}>${priceTag(item)}${art(item)}<strong>${esc(drop.userName)}</strong><small>${esc(drop.itemName)} · ${sourceName(drop.source)}</small>${rarityLine()}</div>`;
        }).join('')
      : '<div class="empty feed-empty"><h2>Пока никто ничего не выиграл</h2><p>Здесь появятся реальные открытия кейсов и удачные апгрейды.</p></div>'}
    </div>
  </section>`;
}

function inventoryItemCard(item) {
  return `<div class="inventory-item-wrap">${skinCard(item)}<div class="inventory-actions"><button class="sell-item" onclick="sellItem('${item.assetid}')">ПРОДАТЬ ${money(item.priceCents)}</button><button class="upgrade-item" onclick="sendToUpgrade('${item.assetid}')">В АПГРЕЙД</button></div></div>`;
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
      ${caseIcon(caseData)}<h2>${esc(caseData.name)}</h2><b>${caseData.priceCents ? money(caseData.priceCents) : 'БЕСПЛАТНО'}</b>
      <button onclick="selectCase('${esc(caseData.id)}')" ${!caseData.available ? 'disabled' : ''}>${caseData.available ? 'КУПИТЬ' : 'УЖЕ ОТКРЫТ'}</button>
    </article>`).join('')}</div>`;
}
function rouletteCard(item) {
  return `<div class="roulette-card" ${rarityStyle(item)}>${priceTag(item)}${art(item)}<strong>${esc(item.weapon || item.name)}</strong><small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}</div>`;
}
function caseDetailPage() {
  if (!S.me?.authenticated) return loginRequired('КЕЙС', 'Войдите через Steam, чтобы открыть кейс.');
  const caseData = S.cases.find(item => item.id === S.activeCase) || S.cases[0];
  if (!caseData) return '<div class="empty"><h2>Кейс не найден</h2></div>';
  const insufficient = caseData.priceCents > Number(S.me.user.balanceCents);
  const disabled = !!S.opening || !caseData.available || insufficient;
  const buttonText = S.opening ? 'ОТКРЫВАЕМ...' : !caseData.available ? 'УЖЕ ОТКРЫТ' : insufficient ? 'НЕДОСТАТОЧНО СРЕДСТВ' : caseData.priceCents ? `КУПИТЬ ЗА ${money(caseData.priceCents)}` : 'КУПИТЬ БЕСПЛАТНО';
  const roulette = S.rouletteItems.length ? `<div class="case-roulette"><i class="roulette-pointer"></i><div class="case-roll-track">${S.rouletteItems.map(rouletteCard).join('')}</div></div>` : '';
  const result = S.caseResult ? `<div class="case-result"><span>ВЫПАЛО</span>${skinCard(S.caseResult, { className: 'case-result-item' })}<button onclick="sendToUpgrade('${S.caseResult.assetid}')">В АПГРЕЙД</button><button onclick="go('inventory')">В ИНВЕНТАРЬ</button></div>` : '';
  return `<button class="case-back" onclick="go('cases')">← ВСЕ КЕЙСЫ</button>
    <section class="case-detail">
      <h1>${esc(caseData.name)}</h1>${caseIcon(caseData, true)}
      <div class="case-detail-price">${caseData.priceCents ? money(caseData.priceCents) : 'БЕСПЛАТНО'}</div>
      <button class="case-buy-button" ${disabled ? 'disabled' : ''} onclick="openCase('${esc(caseData.id)}')">${buttonText}</button>
      ${roulette}${result}
      <div class="case-loot"><h2>СОДЕРЖИМОЕ</h2><div class="case-items case-items-detail">${caseContents(caseData)}</div></div>
    </section>`;
}

function weeklySlot() {
  return `<div class="weekly-slot" aria-hidden="true"><img src="/chunks/question.svg" alt=""></div>`;
}
function topDropCard(drop) {
  const item = { name: drop.itemName, weapon: String(drop.itemName).split(' | ')[0], skin: String(drop.itemName).split(' | ')[1] || '', icon: drop.itemIcon, priceCents: drop.priceCents, rarity: drop.rarity, rarityColor: drop.rarityColor };
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
        <div class="auth-check-row" onclick="toggleConsent('age')"><button type="button" role="checkbox" aria-checked="${S.ageAccepted}" class="auth-checkbox ${S.ageAccepted ? 'checked' : ''}">${check(S.ageAccepted)}</button><span>Подтверждаю, что мне больше 18 лет</span></div>
        <div class="auth-check-row" onclick="toggleConsent('terms')"><button type="button" role="checkbox" aria-checked="${S.termsAccepted}" class="auth-checkbox ${S.termsAccepted ? 'checked' : ''}">${check(S.termsAccepted)}</button><span>Принимаю <a href="/tos.html" onclick="event.stopPropagation()" target="_blank">правила и условия</a> использования сайта</span></div>
        <button class="auth-steam-button" ${ready ? '' : 'disabled'} onclick="confirmSteamLogin()"><span>ВОЙТИ ЧЕРЕЗ STEAM</span>${steamIcon()}</button>
      </div>
    </div>
  </div>`;
}

function chatModal() {
  return `<div class="modal" onclick="if(event.target===this)closeChat()"><div class="chat"><div class="chathead"><b>Поддержка</b><button onclick="closeChat()">✕</button></div>
    <div class="chatbody" id="chatbody">Загрузка...</div><form class="chatform" onsubmit="sendChat(event)"><input id="chatinput" maxlength="2000" placeholder="Сообщение..."><button>ОТПРАВИТЬ</button></form></div></div>`;
}

function pageContent() {
  if (S.page === 'cases') return casesPage();
  if (S.page === 'case') return caseDetailPage();
  if (S.page === 'inventory') return inventoryPage();
  if (S.page === 'rewards') return rewardsPage();
  if (S.page === 'steal') return stealPage();
  return upgradePage();
}
function render() {
  $('#app').innerHTML = header() + `<div class="layout">${sidebar()}<main class="main"><div class="page">${pageContent()}</div></main></div>
    <div class="support"><button onclick="openChat()">ПОДДЕРЖКА</button></div>${S.chat ? chatModal() : ''}${S.authModal ? authConsentModal() : ''}`;
  if (S.chat) loadChat();
}

function recalculateChance() {
  S.chance = S.from && S.to
    ? Math.min(95, Math.max(1, Math.floor(Number(S.from.priceCents) / Number(S.to.priceCents) * 10000) / 100))
    : null;
}
function upgradeTargets() {
  if (!S.from) return [];
  const minimum = Math.ceil(S.from.priceCents * (1 + S.boost / 100));
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
  } else S.to = item;
  recalculateChance();
  render();
}
function setBoost(value, shouldRender = true) {
  S.boost = Number(value);
  const targets = upgradeTargets();
  const tierIndex = { 10: 0, 30: 1, 50: 2, 75: 3 }[S.boost] || 0;
  S.to = targets[Math.min(tierIndex, Math.max(0, targets.length - 1))] || null;
  recalculateChance();
  if (shouldRender) render();
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
  } catch (error) { toast(error.message); }
}

async function refreshAccount() {
  const [me, inventory, cases, drops] = await Promise.all([
    api('/api/me'), api('/api/inventory'), api('/api/cases'), api('/api/live-drops')
  ]);
  S.me = me;
  S.inventory = inventory.items || [];
  S.cases = cases.cases || [];
  S.drops = drops;
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
    toast(`${result.item.name} добавлен в инвентарь сайта`);
  } catch (error) {
    S.rouletteItems = [];
    toast(error.message);
  } finally {
    S.opening = null;
    render();
  }
}

async function upgrade() {
  if (!S.from || !S.to || S.spinning) return;
  S.spinning = true;
  render();
  try {
    const result = await api('/api/upgrade', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAssetId: S.from.assetid, toCatalogId: S.to.catalogId, boostPercent: S.boost })
    });
    await new Promise(resolve => setTimeout(resolve, 1200));
    await refreshAccount();
    S.from = null;
    S.to = null;
    S.chance = null;
    toast(result.won ? `${result.item.name} добавлен в инвентарь сайта` : 'Апгрейд не удался — исходный предмет использован');
  } catch (error) {
    toast(error.message);
  } finally {
    S.spinning = false;
    render();
  }
}

async function loadChat() {
  if (!S.me?.authenticated) {
    $('#chatbody').innerHTML = '<div class="empty">Войдите через Steam для чата поддержки.</div>';
    return;
  }
  try {
    const rows = await api('/api/support/messages');
    $('#chatbody').innerHTML = rows.length
      ? rows.map(item => `<div class="msg">${esc(item.message)}</div>`).join('')
      : '<div class="empty">Начните диалог с поддержкой.</div>';
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
function login() { S.authModal = true; render(); }
function closeAuthModal() { S.authModal = false; render(); }
function toggleConsent(type) {
  if (type === 'age') S.ageAccepted = !S.ageAccepted;
  if (type === 'terms') S.termsAccepted = !S.termsAccepted;
  render();
}
function confirmSteamLogin() {
  if (!S.ageAccepted || !S.termsAccepted) return;
  location.href = '/auth/steam';
}
async function logout() { await api('/auth/logout', { method: 'POST' }); location.reload(); }
function openChat() { S.chat = true; render(); }
function closeChat() { S.chat = false; render(); }
function toast(text) {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast">${esc(text)}</div>`;
  setTimeout(() => { root.innerHTML = ''; }, 3200);
}

Object.assign(window, {
  go, sideTab, choose, setBoost, sendToUpgrade, sellItem, selectCase, openCase, upgrade,
  login, closeAuthModal, toggleConsent, confirmSteamLogin, logout, openChat, closeChat, sendChat
});
boot();
