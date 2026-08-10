(function () {
'use strict';


const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt = n => (Math.round(n) || 0).toLocaleString('ru-RU') + ' ₽';
const fmtN = n => (Math.round(n) || 0).toLocaleString('ru-RU');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);

function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return 'только что';
  if (s < 60) return s + ' сек назад';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' мин назад';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' ч назад';
  return Math.floor(h / 24) + ' дн назад';
}
const RARITY = {
  blue:   { name: 'Обычный',     color: '#4f7cff', glow: 'rgba(79,124,255,.5)' },
  purple: { name: 'Необычный',   color: '#9b5cff', glow: 'rgba(155,92,255,.5)' },
  pink:   { name: 'Редкий',      color: '#ff4fd8', glow: 'rgba(255,79,216,.5)' },
  red:    { name: 'Мифический',  color: '#ff5252', glow: 'rgba(255,82,82,.5)' },
  gold:   { name: 'Легендарный', color: '#ffb800', glow: 'rgba(255,184,0,.5)' },
  mint:   { name: 'Тайный',      color: '#74ffca', glow: 'rgba(116,255,202,.6)' }
};


const GUNS = {
  ak: [['poly','4,46 22,38 22,60 4,52'],['rect',20,38,24,22,2],['rect',42,40,20,14,3],['rect',44,42,18,4,2],['rect',60,45,32,5,2],['rect',90,44,7,7,1],['poly','36,60 52,60 46,82 38,82'],['rect',24,58,8,14,3]],
  m4: [['rect',2,42,18,12,3],['rect',18,40,22,16,2],['rect',38,42,20,12,2],['rect',56,45,38,4,2],['rect',92,44,5,6,1],['poly','30,56 44,56 40,74 34,74'],['rect',22,56,7,12,3]],
  awp: [['poly','2,44 20,38 20,58 2,52'],['rect',18,40,24,16,2],['rect',26,31,28,13,5],['rect',40,45,52,5,2],['rect',26,56,14,18,2],['rect',22,56,7,12,3]],
  glock: [['rect',20,44,58,12,3],['rect',28,52,36,10,3],['poly','38,60 54,60 46,84 38,84'],['poly','42,58 56,58 52,68 44,68'],['rect',24,41,8,5,2]],
  deagle: [['rect',16,42,66,14,3],['rect',24,52,44,10,3],['poly','36,60 56,60 46,86 36,86'],['poly','42,58 58,58 54,70 45,70']],
  smg: [['rect',2,42,14,12,3],['rect',14,40,24,16,2],['rect',36,42,18,12,2],['rect',52,45,24,4,2],['rect',40,54,8,18,2],['rect',22,56,7,12,3]],
  shotgun: [['poly','2,46 18,40 18,58 2,54'],['rect',16,42,20,14,2],['rect',34,44,16,10,2],['rect',48,45,44,4,2],['rect',26,56,8,13,3]],
  karambit: [['path','M14,70 Q22,30 56,22 Q72,18 68,33 Q62,46 34,60 Q20,68 14,70 Z'],['circle',48,34,5],['rect',6,68,18,11,4]],
  butterfly: [['path','M58,24 Q84,14 88,38 Q80,44 62,40 Q56,34 58,24 Z'],['path','M42,24 Q16,14 12,38 Q20,44 38,40 Q44,34 42,24 Z'],['rect',44,34,12,30,4]],
  gloves: [['rect',14,30,72,42,14],['rect',18,22,16,14,7],['rect',40,20,20,14,7],['rect',64,22,18,14,7],['rect',26,46,10,12,4],['rect',52,46,10,12,4]],
  sticker: [['circle',50,50,34],['path','M50,32 L56,45 L70,46 L60,56 L63,70 L50,62 L37,70 L40,56 L30,46 L44,45 Z']],
  charm: [['path','M50,18 L78,32 L78,60 L50,74 L22,60 L22,32 Z'],['circle',50,46,10]],
  default: [['rect',18,30,64,40,10],['rect',30,44,40,8,4]]
};
function weaponSVG(type, rarity, size) {
  const c = RARITY[rarity] ? RARITY[rarity].color : '#a7a7a7';
  const shapes = GUNS[type] || GUNS.default;
  const g1 = shade(c, 0.28), g2 = shade(c, -0.5), g3 = shade(c, 0.6);
  let body = '';
  shapes.forEach(s => {
    if (s[0] === 'rect') body += `<rect x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="${s[5] || 2}"/>`;
    else if (s[0] === 'poly') body += `<polygon points="${s[1]}"/>`;
    else if (s[0] === 'circle') body += `<circle cx="${s[1]}" cy="${s[2]}" r="${s[3]}"/>`;
    else if (s[0] === 'path') body += `<path d="${s[1]}"/>`;
  });
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wg${rarity}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/>
      </linearGradient>
    </defs>
    <g fill="url(#wg${rarity})" stroke="rgba(0,0,0,.5)" stroke-width="1.5">${body}</g>
  </svg>`;
}
function caseIconSVG(accent, size) {
  const c1 = shade(accent, 0.25), c2 = shade(accent, -0.45), c3 = shade(accent, 0.55);
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cg${accent.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect x="24" y="26" width="52" height="13" rx="4" fill="url(#cg${accent.replace('#','')})" stroke="rgba(0,0,0,.4)"/>
    <rect x="29" y="34" width="42" height="6" rx="3" fill="${c3}" opacity=".55"/>
    <rect x="30" y="42" width="40" height="42" rx="5" fill="url(#cg${accent.replace('#','')})" stroke="rgba(0,0,0,.4)"/>
    <rect x="34" y="47" width="32" height="26" rx="4" fill="rgba(0,0,0,.18)"/>
    <circle cx="50" cy="58" r="5.5" fill="#2f2f2f" stroke="${c3}" stroke-width="1.6"/>
    <rect x="48.2" y="60" width="3.6" height="9" rx="1.8" fill="#2f2f2f" stroke="${c3}" stroke-width="1.2"/>
  </svg>`;
}
function itemIcon(item, size) {
  const c = RARITY[item.rarity].color;
  const img = item.icon
    ? `<img src="${item.icon}" alt="" loading="lazy" onerror="this.outerHTML='${weaponSVG(item.type, item.rarity, 100).replace(/'/g, '&#39;').replace(/"/g, '&quot;')}'"/>`
    : weaponSVG(item.type, item.rarity, 100);
  return `<div style="--c:${c};width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 60%, ${shade(c,0.18)}, transparent 75%)">${img}</div>`;
}
function steamSVG(sz) {
  sz = sz || 17;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-9.9 10.4l4.6 1.9a3.4 3.4 0 0 1 4.2 2.2l2.4 3.5A10 10 0 1 0 12 2zm0 3a7 7 0 0 1 7 7 7 7 0 0 1-8.8 6.8l-.02-.05 1.9-2.8-.5-1.2a5 5 0 0 0-4.9-3.5L5.6 10A7 7 0 0 1 12 5zM8.6 13.6l.9 2.2a2.3 2.3 0 1 0 1.2.2l-1.3-3.1a2.3 2.3 0 0 0-1-4.4 2.3 2.3 0 0 0-2.3 2.7l1.9 2.4zm.6-2.7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7.2-.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm-.6-1.3a.7.7 0 1 1 1.3 0 .7.7 0 0 1-1.3 0z"/></svg>`;
}
function giftSVG() { return `<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="14" width="36" height="10" rx="2" fill="#fff" opacity=".95"/><rect x="10" y="24" width="28" height="18" rx="2" fill="#fff" opacity=".95"/><path d="M24 14v28M6 19h36" stroke="#2f8f63" stroke-width="3"/><path d="M24 14c-6 0-10-4-10-8 4 0 10 3 10 8zM24 14c6 0 10-4 10-8-4 0-10 3-10 8z" fill="#fff"/></svg>`; }
function fireSVG() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-3 5-3 9a4 4 0 0 0 8 0c0-1-.2-2-.6-3 .3 0 .6.1 1 .3.3 1 .1 1.7.1 2.7 0 2-1.5 4-3.5 4S9 13 9 11c0-1 .3-2 .8-3-.8.5-1.3 1.3-1.6 2.2C6.5 9.8 6 8.6 6 7c2-1 4-3 6-5z"/></svg>`; }
function pulseSVG() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>`; }
function boxSVG() { return `<svg viewBox="0 0 50 50" fill="none"><path d="M6 15 25 6l19 9v19L25 44 6 35V15z" fill="#50B28D"/><path d="M6 15l19 9 19-9M25 24v20" stroke="#2c6b52" stroke-width="2"/><path d="M12 18v12l8 4" stroke="#bfffe5" stroke-width="2" fill="none"/></svg>`; }
function collSVG() { return `<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`; }
function soundSVG(on) { return on ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4zm12 3a4 4 0 0 0-2-3.5v7A4 4 0 0 0 16 12z"/></svg>` : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4zm13.6-3.6-1.4 1.4 2.6 2.6-2.6 2.6 1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6 2.6-2.6-1.4-1.4-2.6 2.6-2.6-2.6z"/></svg>`; }
function boltSVG() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>`; }
function supportSVG() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6.1A6 6 0 0 1 12 4a6 6 0 0 1 5.9 3H17a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a8 8 0 0 0-8-8zm-4 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>`; }
function rubSVG() { return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#74ffca" stroke-width="2"/><path d="M9.5 6.5h4.2a2.6 2.6 0 1 1 0 5.2H9.5m0 0v5.8M9.5 14.6h3.4" stroke="#74ffca" stroke-width="1.8" stroke-linecap="round"/></svg>`; }


const S = {
  user: null, cases: [], stats: { online: 0, casesToday: 0, winsToday: 0, topWin: 0 }, view: 'upgrade',
  feed: [], events: {}, battles: {}, openModal: null, mgModal: null, currentBattle: null,
  upg: { itemId: null, balance: 0, targetId: null }, lastOpen: null, pool: []
};
let onlineN = 0, SND = { on: true, vol: 0.6, ctx: null };

async function api(path, body) {
  const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
  const r = await fetch(path, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false) throw new Error(j.error || 'Ошибка сервера');
  return j;
}
function beep(freq, dur, vol) {
  if (!SND.on) return;
  try {
    SND.ctx = SND.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq || 700;
    g.gain.value = (vol == null ? SND.vol : vol) * 0.12;
    o.connect(g); g.connect(SND.ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, SND.ctx.currentTime + (dur || 0.12));
    o.stop(SND.ctx.currentTime + (dur || 0.12));
  } catch (e) {}
}


const app = $('#app');
function render() {
  app.innerHTML = headerHTML() + `<main class="app"><div class="page">${viewHTML()}</div></main>` + footerHTML() + fabHTML();
  afterRender();
}
function afterRender() {
  $$('[data-view-link]').forEach(a => a.classList.toggle('active', a.dataset.viewLink === S.view));
  const burger = $('#burger');
  if (burger) burger.onclick = () => $('#mobileNav').classList.add('open');
  const mnav = $('#mobileNav');
  if (mnav) mnav.onclick = e => { if (e.target.closest('[data-view-link]')) mnav.classList.remove('open'); };
  const ci = $('#chatInput');
  if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ACTIONS['chat-send'](); } });
  const vr = $('#volRange');
  if (vr) vr.addEventListener('input', e => { SND.vol = e.target.value / 100; });
  initScrollbar();
}
function headerHTML() {
  const u = S.user;
  const nav = [['inventory', 'ИНВЕНТАРЬ'], ['upgrade', 'УПГРЕЙДЫ'], ['rewards', 'РЕВАРДЫ'], ['cases', 'КЕЙСЫ']];
  const navLinks = nav.map(([v, t]) => `<a href="#/${v}" data-view-link="${v}" data-action="nav" data-view="${v}">${t}</a>`).join('');
  const freeToday = u && u.rewards && u.rewards.lastClaimDate === new Date().toISOString().slice(0, 10);
  return `<header class="hdr">
    <div class="hdr-corner l"></div>
    <div class="hdr-corner r"></div>
    <div class="hdr-inner">
      <div class="hdr-left">
        <button class="hdr-btn hdr-gift" data-action="nav" data-view="rewards" title="Ежедневная награда">
          <span class="ico">${giftSVG()}</span><span>${freeToday ? 'ПОДАРОК ПОЛУЧЕН' : 'ЗАБИРАЙ ПОДАРОК'}</span>
        </button>
      </div>
      <nav class="hdr-nav">${navLinks}</nav>
      <div class="hdr-right">
        ${u ? `
          <div class="user-chip" id="userChip">
            <span class="uc-av" style="background:${u.color}">${esc(u.name.slice(0, 2).toUpperCase())}</span>
            <span class="uc-nm">${esc(u.name)}</span>
            <div class="user-menu">
              <a href="#/inventory" data-action="nav" data-view="inventory">🎒 Мой инвентарь</a>
              <a href="#/rewards" data-action="nav" data-view="rewards">🎁 Награды</a>
              <button data-action="logout">Выйти</button>
            </div>
          </div>
          <button class="hdr-btn" data-action="deposit">
            <span class="ico">${rubSVG()}</span>
            <span class="hdr-balance" id="balanceNum">${fmt(u.balance)}</span>
          </button>` :
          `<a class="hdr-btn" href="/api/auth/steam" style="text-decoration:none"><span class="ico">${steamSVG(26)}</span><span>ВОЙТИ ЧЕРЕЗ STEAM</span></a>`}
        <button class="burger" id="burger" aria-label="Меню"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </div>
    </div>
  </header>
  <div class="subbar">
    <div class="sub-promo l" data-action="claim-spend" title="Акция дня">
      <span class="sp-ico">${fireSVG()}</span>
      <div><div class="sp-t">ПОТРАТЬ 1000 ₽ — ПОЛУЧИ 500 ₽</div><div class="sp-s" id="spendInfo">${u ? (u.spend.claimed ? 'Бонус получен' : `Потрачено ${fmt(u.spend.spent)} из 1000 ₽`) : 'Войди и участвуй'}</div></div>
      <div class="sp-bar"><i id="spendBar" style="width:${u ? Math.min(100, u.spend.spent / 1000 * 100) : 0}%"></i></div>
    </div>
    <div class="sub-controls">
      <button class="ctl-btn ${SND.on ? 'on' : ''}" id="sndBtn" data-action="snd-toggle" title="Звук">${soundSVG(SND.on)}</button>
      <div class="ctl-vol"><span>${soundSVG(true)}</span><input id="volRange" type="range" min="0" max="100" value="${Math.round(SND.vol * 100)}" title="Громкость"/></div>
      <button class="ctl-btn" data-action="fx-toggle" id="fxBtn" title="Мгновенный режим">${boltSVG()}</button>
    </div>
    <div class="sub-title" id="subTitle">${pageTitle()}</div>
    ${u ? `<div class="sub-promo r" data-action="deposit">
      <span class="sp-ico">${rubSVG()}</span>
      <div><div class="sp-t">БАЛАНС: <span id="subBalance">${fmt(u.balance)}</span></div><div class="sp-s">Бонус за депозит до +20%</div></div>
    </div>` : `<div class="sub-promo r" data-action="login" style="text-decoration:none">
      <span class="sp-ico">${steamSVG(26)}</span>
      <div><div class="sp-t">ВОЙДИ ЧЕРЕЗ STEAM</div><div class="sp-s">Только через Steam · +500 ₽ новичку</div></div>
    </div>`}
  </div>`;
}
function pageTitle() {
  return { cases: 'КЕЙСЫ', upgrade: 'АПГРЕЙДЫ', inventory: 'ИНВЕНТАРЬ', rewards: 'РЕВАРДЫ', support: 'ПОДДЕРЖКА' }[S.view] || 'GGDROP';
}
function footerHTML() {
  return `<footer class="footer">
    <div class="footer-inner">
      <div class="f-brand">
        <div style="font-size:22px;font-weight:700;letter-spacing:2px">GG<b style="color:var(--mint-2)">DROP</b></div>
        <p>GGDROP — современная площадка для апгрейдов и открытия кейсов CS2. Честные шансы, мгновенные выплаты и самая живая лента удачи в рунете.</p>
      </div>
      <div><h4>Разделы</h4><div class="footer-links">
        <a href="#/upgrade" data-action="nav" data-view="upgrade">Апгрейды</a>
        <a href="#/cases" data-action="nav" data-view="cases">Кейсы</a>
        <a href="#/rewards" data-action="nav" data-view="rewards">Награды</a>
        <a href="#/inventory" data-action="nav" data-view="inventory">Инвентарь</a>
      </div></div>
      <div><h4>Помощь</h4><div class="footer-links">
        <a href="#/support" data-action="nav" data-view="support">Поддержка</a>
        <a href="#/support" data-action="nav" data-view="support">Частые вопросы</a>
        <a href="#/support" data-action="nav" data-view="support">Правила</a>
      </div></div>
      <div><h4>Статистика</h4><div class="footer-links">
        <a href="javascript:void(0)">Кейсов сегодня: <b style="color:var(--mint-2)">${fmtN(S.stats.casesToday || 0)}</b></a>
        <a href="javascript:void(0)">Выиграно: <b style="color:var(--mint-2)">${fmt(S.stats.winsToday || 0)}</b></a>
        <a href="javascript:void(0)">Игроков онлайн: <b style="color:var(--mint-2)">${fmtN(onlineN)}</b></a>
      </div></div>
      <div class="f-copy">GGDROP © 2026 · 18+</div>
    </div>
  </footer>`;
}
function fabHTML() {
  return `<button class="fab-support" data-action="nav" data-view="support" title="Поддержка">${supportSVG()}</button>
  <div class="page-scrollbar" id="pgBar"><i></i></div>`;
}
function initScrollbar() {
  const bar = $('#pgBar');
  if (!bar) return;
  const upd = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    bar.querySelector('i').style.height = Math.max(8, p * 100) + '%';
  };
  upd();
  document.addEventListener('scroll', upd, { passive: true });
}


function viewHTML() {
  switch (S.view) {
    case 'cases': return casesView();
    case 'inventory': return inventoryView();
    case 'rewards': return rewardsView();
    case 'support': return supportView();
    default: return upgradeView();
  }
}


function sideHTML() {
  if (S.view === 'cases') return sideFeed();
  if (S.view === 'rewards') return sideStats();
  return sideInventory();
}
function sideInventory() {
  const u = S.user;
  const inv = u ? u.inventory : [];
  return `<aside class="side">
    <div class="side-head">
      <span class="side-chip"><span class="dot"></span>онлайн <span class="n" id="sOnline">${fmtN(onlineN)}</span></span>
      <span class="side-chip"><span class="f">${fireSVG()}</span><span class="n" id="sCases">${fmtN(S.stats.casesToday || 0)}</span></span>
    </div>
    <div class="side-body">
      ${!u ? `<div class="side-empty">Войди через Steam, чтобы увидеть свой инвентарь<br><br>
        <a class="btn btn-mint btn-sm" href="/api/auth/steam" style="text-decoration:none">${steamSVG(14)} ВОЙТИ ЧЕРЕЗ STEAM</a></div>`
      : inv.length ? inv.map(it => `
        <div class="side-row ${S.upg.itemId === it.id ? 'sel' : ''}" data-action="upg-pick-item" data-item="${it.id}" title="Выбрать для апгрейда">
          <div class="sr-ico">${itemIcon(it.item, 64)}</div>
          <div style="min-width:0"><div class="sr-nm">${esc(it.item.name)}</div>
          <div class="sr-sub">${RARITY[it.item.rarity].name}</div></div>
          <div class="sr-pr">${fmt(it.item.price)}</div>
        </div>`).join('')
      : `<div class="side-empty">Инвентарь пуст.<br>Открой кейс — и предмет появится здесь.</div>`}
    </div>
    <div class="side-foot">${u ? `Всего предметов: ${inv.length}` : 'GGDROP · честные апгрейды'}</div>
  </aside>`;
}
function sideFeed() {
  return `<aside class="side">
    <div class="side-head">
      <span class="side-chip"><span class="dot"></span>онлайн <span class="n" id="sOnline">${fmtN(onlineN)}</span></span>
      <span class="side-chip"><span class="f">${fireSVG()}</span><span class="n" id="sCases">${fmtN(S.stats.casesToday || 0)}</span></span>
    </div>
    <div class="side-body" id="feedList">${feedHTML()}</div>
    <div class="side-foot">Удача игроков — в реальном времени</div>
  </aside>`;
}
function sideStats() {
  return `<aside class="side">
    <div class="side-head">
      <span class="side-chip"><span class="dot"></span>онлайн <span class="n" id="sOnline">${fmtN(onlineN)}</span></span>
      <span class="side-chip"><span class="f">${fireSVG()}</span><span class="n" id="sCases">${fmtN(S.stats.casesToday || 0)}</span></span>
    </div>
    <div class="side-body" style="padding:14px">
      <div class="stat-card" style="margin-bottom:10px"><div class="sc-n">${fmt(S.stats.winsToday || 0)}</div><div class="sc-l">ВЫИГРАНО ЗА СЕГОДНЯ</div></div>
      <div class="stat-card"><div class="sc-n" style="color:var(--gold)">${fmt(S.stats.topWin || 0)}</div><div class="sc-l">ТОП-ДРОП ДНЯ</div></div>
    </div>
    <div class="side-foot">Топ-дроп обновляется в реальном времени</div>
  </aside>`;
}


function upgradeView() {
  const u = S.user;
  const selItem = u ? u.inventory.find(x => x.id === S.upg.itemId) : null;
  const inputVal = (selItem ? selItem.item.price : 0) + (S.upg.balance || 0);
  const target = S.upg.targetId ? (S.cases.reduce((a, c) => a.concat(c.contents || []), []).find(x => x.item.id === S.upg.targetId) || {}).item : null;
  updatePool(inputVal);
  const chance = target && inputVal > 0 ? calcChance(inputVal, target.price) : null;
  const ready = u && inputVal >= 10 && target;
  return `<div class="upg-layout">
    ${sideHTML()}
    <div>
      <div class="upg-main">
        <div class="card">
          <div class="card-h">Выберите предметы и/или баланс для использования</div>
          <div class="card-b">
            ${selItem ? `<div class="sel-item">
              <div class="si-ico">${itemIcon(selItem.item, 92)}</div>
              <div><div class="si-nm">${esc(selItem.item.name)}</div>
              <div class="si-sub">${RARITY[selItem.item.rarity].name}</div>
              <div class="si-pr">${fmt(selItem.item.price)}</div></div>
              <button class="si-x" data-action="upg-remove-item">✕</button>
            </div>` : `<div class="placeholder"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16v13H4z" stroke="currentColor" stroke-width="1.5"/><path d="M8 7V4h8v3" stroke="currentColor" stroke-width="1.5"/></svg>Выбранные предметы появятся здесь</div>`}
            <div class="bal-add">
              <input id="upgBal" type="number" min="0" max="1000000" placeholder="+ баланс, ₽" value="${S.upg.balance || ''}"/>
              <button data-action="upg-add-bal">ДОБАВИТЬ</button>
            </div>
            <div class="sel-total"><span>ВСЕГО НА КОНУ</span><b>${fmt(inputVal)}</b></div>
          </div>
        </div>
        <div class="upg-center">
          <div class="upg-title">GG<b>DROP</b></div>
          <div class="circle-wrap">
            <div class="circle-pointer"></div>
            <div class="circle">
              <div class="circle-inner">
                <div class="ci-lbl">ШАНС</div>
                <div class="ci-val">${chance ? Math.round(chance * 100) + '%' : '—'}</div>
                <div class="ci-sub">${target ? 'до ' + fmt(target.price) : 'выбери цель'}</div>
              </div>
            </div>
          </div>
          <button class="upg-btn" data-action="upg-go" ${ready ? '' : 'disabled'}>АПГРЕЙД</button>
          <div class="upg-chance">${target && chance ? 'ШАНС ВЫИГРЫША: <b>' + Math.round(chance * 100) + '%</b> · ВЫИГРЫШ: ' + fmt(target.price) : 'ВЫБЕРИ ПРЕДМЕТ И ЦЕЛЬ'}</div>
        </div>
        <div class="card">
          <div class="card-h">Выберите предмет для апгрейда</div>
          <div class="card-b">
            ${target ? `<div class="target-item">
              <div class="ti-ico">${itemIcon(target, 170)}</div>
              <div class="ti-nm">${esc(target.name)}</div>
              <div class="ti-sub">${RARITY[target.rarity].name}</div>
              <div class="ti-pr">${fmt(target.price)}</div>
              <button class="btn btn-ghost btn-sm" data-action="upg-remove-target">СБРОСИТЬ ЦЕЛЬ</button>
            </div>` : `<div class="placeholder"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.5"/></svg>Выбранные предметы появятся здесь</div>`}
          </div>
        </div>
      </div>
      <div class="upg-panels">
        <div class="panel">
          <div class="panel-h">
            <span class="ph-ico">${boxSVG()}</span>
            <span class="ph-t">МОИ ПРЕДМЕТЫ</span>
            <span class="ph-n">${u ? u.inventory.length : 0} шт</span>
            <button class="ph-collapse" data-action="panel-toggle">${collSVG()}</button>
          </div>
          <div class="panel-b">
            ${!u ? `<div class="empty-state" style="grid-column:1/-1;border:none"><div class="es-ico">🔒</div>Войди через Steam, чтобы использовать предметы<br><a class="btn btn-mint btn-sm" style="margin-top:10px;text-decoration:none" href="/api/auth/steam">${steamSVG(14)} ВОЙТИ ЧЕРЕЗ STEAM</a></div>`
            : !u.inventory.length ? `<div class="empty-state" style="grid-column:1/-1;border:none"><div class="es-ico">📦</div>Инвентарь пуст — открой кейс на странице «Кейсы»</div>`
            : u.inventory.map(it => itemCard(it, S.upg.itemId === it.id, 'upg-pick-item'))}
          </div>
        </div>
        <div class="panel">
          <div class="panel-h">
            <span class="ph-ico">${boxSVG()}</span>
            <span class="ph-t">ВЫБРАТЬ ПРЕДМЕТ</span>
            <span class="ph-n">${S.pool.length} целей</span>
            <button class="ph-collapse" data-action="panel-toggle">${collSVG()}</button>
          </div>
          <div class="panel-b">
            ${inputVal < 10 ? `<div class="empty-state" style="grid-column:1/-1;border:none"><div class="es-ico">🎯</div>Сначала выбери свой предмет (или добавь баланс) —<br>цели появятся здесь</div>`
            : S.pool.map(it => itemCard({ item: it }, S.upg.targetId === it.id, 'upg-pick-target'))}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function itemCard(it, sel, action) {
  const item = it.item;
  return `<div class="item-card ${sel ? 'sel' : ''}" data-action="${action}" data-item="${it.id}" data-target="${item.id}">
    <div class="ic-img">
      <span class="ic-check">✓</span>
      ${itemIcon(item, 200)}
      <span class="ic-badge">${fmtN(item.price)}</span>
    </div>
    <div class="ic-info">
      <div class="ic-nm">${esc(item.name)}</div>
      <div class="ic-sub">${RARITY[item.rarity].name}</div>
      <div class="ic-pr">${fmt(item.price)}</div>
    </div>
  </div>`;
}
function calcChance(inputVal, targetPrice) {
  return clamp(inputVal / (targetPrice * 1.06) * 0.98, 0.01, 0.97);
}
function updatePool(inputVal) {
  const all = [];
  const seen = new Set();
  S.cases.forEach(c => (c.contents || []).forEach(x => {
    if (!seen.has(x.item.id)) { seen.add(x.item.id); all.push(x.item); }
  }));
  let pool = all;
  if (inputVal >= 10) {
    pool = all.filter(i => i.price >= inputVal * 1.05 && i.price <= inputVal * 30).sort((a, b) => a.price - b.price).slice(0, 40);
  }
  S.pool = pool;
}
async function upgGo() {
  const u = S.user;
  if (!u) { loginModal(); return; }
  const selItem = u.inventory.find(x => x.id === S.upg.itemId);
  const inputVal = (selItem ? selItem.item.price : 0) + (S.upg.balance || 0);
  if (!S.upg.targetId || inputVal < 10) return;
  beep(600, .08);
  try {
    const r = await api('/api/upgrade', { itemId: S.upg.itemId || null, balance: S.upg.balance || 0, targetItemId: S.upg.targetId });
    S.user = r.user; updateBalance();
    if (r.win) beep(880, .18); else beep(320, .2);
    S.upg.itemId = null; S.upg.balance = 0; S.upg.targetId = null;
    render();
    upgResultModal(r);
  } catch (e) { toast('Ошибка', e.message, 'err'); }
}
function upgResultModal(r) {
  const target = r.target;
  const c = RARITY[target.rarity];
  openModal(`
    <div class="modal-h"><b>${r.win ? 'АПГРЕЙД УСПЕШЕН' : 'АПГРЕЙД НЕ УДАЛСЯ'}</b><button class="modal-close" data-action="close-modal">✕</button></div>
    <div class="modal-b" style="text-align:center">
      <div class="result-view">
        <div class="rv-ico" style="--rar-glow:${c.glow}">${itemIcon(target, 190)}</div>
        <div class="rv-name" style="color:${c.color}">${esc(target.name)}</div>
        <div class="rv-price">${fmt(target.price)}</div>
        <div class="rv-sub">${r.win ? 'Цель достигнута — предмет добавлен в инвентарь' : 'К сожалению, ставка сгорела. Попробуй ещё раз!'}</div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" data-action="close-modal">ПОНЯТНО</button>
      ${r.win ? `<button class="btn btn-mint" data-action="nav" data-view="inventory">В ИНВЕНТАРЬ</button>` : `<button class="btn btn-mint" data-action="upg-retry">ЕЩЁ РАЗ</button>`}
    </div>
  `);
}


function casesView() {
  return `<div class="cases-layout">
    <div>
      <div class="section-title">КЕЙСЫ <b>CS2</b></div>
      <div class="cases-grid">${S.cases.map(caseCard).join('')}</div>
    </div>
    ${sideHTML()}
  </div>`;
}
function caseCard(c) {
  const badge = { gold: 'ТОП-КЕЙС', mint: 'НОВИНКА', red: 'ХОТ', purple: 'ХИТ' }[c.tier] || '';
  const top = c.top || [];
  return `<div class="case-card" data-action="open-case" data-case="${c.id}">
    <div class="case-visual" style="background:radial-gradient(circle at 50% 40%, ${shade(c.accent, 0.18)}, transparent 75%), var(--panel-h)">
      ${badge ? `<span class="case-badge">${badge}</span>` : ''}
      ${caseIconSVG(c.accent, 118)}
    </div>
    <div class="case-info">
      <div class="case-name">${esc(c.name)}<span class="rar" style="background:${shade(c.accent,0.2)};color:${shade(c.accent,0.5)}">${fmtN(c.itemsCount)}</span></div>
      <div class="case-price-row">
        <div class="case-price">${fmt(c.price)}</div>
        <button class="case-open-btn">ОТКРЫТЬ</button>
      </div>
      <div class="case-preview">
        <span>ТОП ДРОПА:</span>
        ${top.slice(0, 3).map(t => `<span class="mini">${itemIcon(t, 24)}</span>`).join('')}
        <span class="more">${fmt(top[0] ? top[0].price : 0)}+</span>
      </div>
    </div>
  </div>`;
}


async function openCase(caseId) {
  const c = S.cases.find(x => x.id === caseId);
  if (!c) return;
  if (S.openModal) return;
  if (!S.user) { loginModal(); return; }
  if (S.user.balance < c.price) { toast('Недостаточно средств', 'Пополни баланс', 'err'); depositModal(); return; }
  beep(600, .08);
  try {
    const r = await api('/api/open', { caseId });
    S.user = r.user; updateBalance();
    S.lastOpen = r;
    if (r.item.price >= 1000) beep(900, .25); else beep(700, .15);
    showOpenResult(r);
  } catch (e) { toast('Ошибка', e.message, 'err'); }
}
function showOpenResult(r) {
  const win = r.item;
  const c = RARITY[win.rarity];
  const ov = openModal(`
    <div class="modal-h"><b>${esc((S.cases.find(x => x.id === r.caseId) || {}).name || 'КЕЙС')}</b><button class="modal-close" data-action="close-modal">✕</button></div>
    <div class="modal-b">
      <div class="result-view">
        <div class="rv-ico" style="--rar-glow:${c.glow}">${itemIcon(win, 190)}</div>
        <div class="rv-name" style="color:${c.color}">${esc(win.name)}</div>
        <div class="rv-price">${fmt(win.price)}</div>
        <div class="rv-sub">${win.price >= 1000 ? '⚠ ПРЕДМЕТ ДОРОГОЙ — ЕГО МОГУТ ПОПЫТАТЬСЯ УКРАСТЬ!' : 'Предмет зачислен в инвентарь'}</div>
        ${win.price >= 1000 ? `<div class="steal-bar"><i id="stealBar"></i></div>` : ''}
      </div>
      ${win.price >= 1000 && r.event ? `<div id="stealZone">${stealWarningHTML(r.event)}</div>` : ''}
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" data-action="close-modal">В ИНВЕНТАРЬ</button>
      <button class="btn btn-mint" data-action="sell-spin">ПРОДАТЬ ЗА ${fmt(win.price * 0.9)}</button>
    </div>
  `);
  S.openModal = { ov, spinId: r.spinId, item: win };
  updateStealWarning();
}
function stealWarningHTML(ev) {
  if (!ev) return '';
  const left = Math.max(0, ev.endsAt - Date.now());
  return `<div class="steal-warning" id="stealWarn">
    <div><div class="sw-t">⚠️ ПРЕДМЕТ ПОД УГРОЗОЙ КРАЖИ!</div>
    <div class="sw-s">Любой игрок может нажать STEAL за ${fmt(ev.commission)} и забрать твой дроп в PvP</div></div>
    <div class="sw-timer"><div class="t" id="swTime">${Math.ceil(left / 1000)}</div><div class="l">СЕК ДО ЗАЩИТЫ</div></div>
  </div>`;
}
function updateStealWarning() {
  const evId = S.lastOpen && S.lastOpen.event && S.lastOpen.event.id;
  const ev = evId && S.events[evId];
  if (!ev) {
    const sellBtn = $('[data-action="sell-spin"]');
    if (sellBtn) sellBtn.disabled = false;
    return;
  }
  const left = Math.max(0, ev.endsAt - Date.now());
  const el = $('#swTime');
  if (el) el.textContent = Math.ceil(left / 1000);
  const bar = $('#stealBar');
  if (bar) bar.style.width = (left / 15000 * 100) + '%';
  const sellBtn = $('[data-action="sell-spin"]');
  if (sellBtn) sellBtn.disabled = ev.status !== 'resolved' || ev.outcome !== 'kept';
  if (ev.status === 'resolved') {
    const zz = $('#stealZone');
    if (zz && !zz.dataset.done) {
      zz.dataset.done = '1';
      zz.innerHTML = ev.outcome === 'stolen'
        ? `<div class="steal-warning" style="border-color:rgba(255,109,125,.6)">
            <div><div class="sw-t">💀 ПРЕДМЕТ УКРАДЕН!</div>
            <div class="sw-s">Вор победил в PvP-битве и забрал твой дроп.</div></div></div>`
        : `<div class="steal-warning" style="border-color:rgba(116,255,202,.5);background:rgba(116,255,202,.08)">
            <div><div class="sw-t" style="color:var(--mint-2)">🛡 ПРЕДМЕТ ЗАЩИЩЁН!</div>
            <div class="sw-s">Никто не решился на кражу. Дроп твой!</div></div></div>`;
    }
  }
}


function feedHTML() {
  if (!S.feed.length) return `<div class="side-empty">Дропы появятся через секунду…</div>`;
  return S.feed.map(f => {
    const ev = S.events[f.eventId];
    return `<div class="side-row" id="feed-${f.id}" data-event="${f.eventId || ''}" style="cursor:default">
      <div class="sr-ico">${itemIcon(f.item, 64)}</div>
      <div style="min-width:0"><div class="sr-nm">${esc(f.item.name)}</div>
      <div class="sr-sub">${esc(f.user.name)} · ${timeAgo(f.ts)}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto">
        <span class="sr-pr ${f.item.price >= 1000 ? 'hot' : ''}">${fmt(f.item.price)}</span>
        ${ev ? feedEv(ev) : ''}
      </div>
    </div>`;
  }).join('');
}
function feedEv(ev) {
  if (ev.status === 'battle') return `<span class="sr-tag battle">⚔ БИТВА!</span>`;
  if (ev.status === 'resolved') {
    if (ev.outcome === 'stolen') return `<span class="sr-tag steal">УКРАДЕН</span>`;
    return `<span class="sr-tag kept">ЗАБРАН</span>`;
  }
  if (ev.status === 'expired') return `<span class="sr-tag kept">ЗАБРАН</span>`;
  return `<button class="sr-tag steal" style="cursor:pointer" data-action="steal" data-event="${ev.id}" ${S.user && ev.ownerId !== S.user.id ? '' : 'disabled'}>🕓 ${Math.ceil(Math.max(0, ev.endsAt - Date.now()) / 1000)}с · STEAL ${fmt(ev.commission)}</button>`;
}
function prependDrop(d) {
  const list = $('#feedList');
  if (!list) return;
  const div = document.createElement('div');
  div.className = 'side-row';
  div.id = 'feed-' + d.id;
  div.dataset.event = d.eventId || '';
  div.style.cursor = 'default';
  div.innerHTML = `<div class="sr-ico">${itemIcon(d.item, 64)}</div>
    <div style="min-width:0"><div class="sr-nm">${esc(d.item.name)}</div>
    <div class="sr-sub">${esc(d.user.name)} · только что</div></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto">
      <span class="sr-pr ${d.item.price >= 1000 ? 'hot' : ''}">${fmt(d.item.price)}</span>
      ${d.eventId && S.events[d.eventId] ? feedEv(S.events[d.eventId]) : ''}
    </div>`;
  list.prepend(div);
  while (list.children.length > 60) list.lastChild.remove();
}
function updateFeedEvent(ev) {
  $$('#feedList .side-row[data-event="' + ev.id + '"]').forEach(el => {
    const holder = el.querySelector('div:last-child');
    if (!holder) return;
    const old = el.querySelector('.sr-tag');
    if (old) old.outerHTML = feedEv(ev);
    else holder.insertAdjacentHTML('beforeend', feedEv(ev));
  });
}


function inventoryView() {
  const u = S.user;
  if (!u) return `<div class="section-title">ИНВЕНТАРЬ</div><div class="empty-state"><div class="es-ico">🔒</div>Войди, чтобы увидеть свои предметы<br><button class="btn btn-mint" style="margin-top:12px" data-action="login">${steamSVG(16)} ВОЙТИ ЧЕРЕЗ STEAM</button></div>`;
  return `<div class="section-title">ИНВЕНТАРЬ <b>· ${u.inventory.length} ПРЕДМЕТОВ</b></div>
  ${u.inventory.length ? `<div class="inv-grid">${u.inventory.map(it => `
    <div class="inv-item">
      <div class="ii-ico">${itemIcon(it.item, 130)}</div>
      <div class="ii-b">
        <div class="ii-nm">${esc(it.item.name)}</div>
        <div class="ii-pr">${fmt(it.item.price)}</div>
        <div class="ii-act"><button class="btn btn-ghost btn-sm btn-block" data-action="sell-item" data-item="${it.id}">ПРОДАТЬ ЗА ${fmt(it.item.price * 0.9)}</button></div>
      </div>
    </div>`).join('')}</div>`
  : `<div class="empty-state"><div class="es-ico">📦</div>Пока пусто. Открой кейс или выиграй апгрейд!<br><button class="btn btn-mint" style="margin-top:12px" data-action="nav" data-view="cases">К КЕЙСАМ</button></div>`}`;
}
function rewardsView() {
  const u = S.user;
  const days = [50, 100, 150, 250, 400, 600, 1000];
  if (!u) return `<div class="section-title">НАГРАДЫ</div><div class="empty-state"><div class="es-ico">🎁</div>Войди, чтобы получать ежедневные награды<br><a class="btn btn-mint" style="margin-top:12px;text-decoration:none" href="/api/auth/steam">${steamSVG(16)} ВОЙТИ ЧЕРЕЗ STEAM</a></div>`;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yStr = new Date(now - 864e5).toISOString().slice(0, 10);
  const last = u.rewards.lastClaimDate || '';
  const claimedCount = (last === todayStr || last === yStr) ? (u.rewards.streak || 0) : 0;
  const todayIdx = last === yStr ? claimedCount + 1 : 1;
  return `<div class="section-title">НАГРАДЫ <b>· ЗАХОДИ КАЖДЫЙ ДЕНЬ</b></div>
  <div class="rewards-grid">
    ${days.map((v, i) => {
      const d = i + 1;
      const isToday = d === todayIdx && last !== todayStr;
      const cls = isToday ? 'today' : (d <= claimedCount ? 'claimed' : '');
      return `<div class="reward-day ${cls}">
        <div class="rd-ico">${i === 6 ? '💎' : i >= 4 ? '🎁' : '🪙'}</div>
        <div class="rd-d">ДЕНЬ ${d}${isToday ? ' · СЕГОДНЯ' : ''}</div>
        <div class="rd-v">${fmt(v)}</div>
        ${isToday ? `<button class="btn btn-mint btn-sm btn-block" style="margin-top:8px" data-action="claim-daily">ЗАБРАТЬ</button>` : ''}
      </div>`;
    }).join('')}
  </div>
  <div class="section-title">ТВОЯ СТАТИСТИКА</div>
  <div class="stat-cards">
    <div class="stat-card"><div class="sc-n">${fmtN(u.stats.opened)}</div><div class="sc-l">КЕЙСОВ ОТКРЫТО</div></div>
    <div class="stat-card"><div class="sc-n">${fmt(u.stats.wonTotal)}</div><div class="sc-l">ВСЕГО ВЫИГРАНО</div></div>
    <div class="stat-card"><div class="sc-n">${fmtN(u.stats.stealAttempts)}</div><div class="sc-l">ПОПЫТОК КРАЖИ</div></div>
    <div class="stat-card"><div class="sc-n">${fmtN(u.stats.stealsWon)}</div><div class="sc-l">УСПЕШНЫХ КРАЖ</div></div>
    <div class="stat-card"><div class="sc-n">${fmtN(u.stats.stealsLost)}</div><div class="sc-l">ПОТЕРЯНО В БИТВАХ</div></div>
    ${u.bonusPercent ? `<div class="stat-card" style="border-color:rgba(255,200,92,.5)"><div class="sc-n" style="color:var(--gold)">+${u.bonusPercent}%</div><div class="sc-l">БОНУС К ДЕПОЗИТУ</div></div>` : ''}
  </div>`;
}
function supportView() {
  const faqs = [
    ['КАК РАБОТАЕТ АПГРЕЙД?', 'Выбираешь свой предмет (или баланс), затем цель — предмет, который хочешь выиграть. Шанс считается честно: цена ставки / цена цели. Выиграл — получаешь цель, проиграл — ставка сгорает.'],
    ['КАК РАБОТАЕТ КРАЖА СКИНА (STEAL)?', 'Когда игрок выбивает предмет дороже 1000 ₽, запускается 15-секундный таймер. Любой может нажать STEAL и заплатить комиссию 4%. Если никто не нажал — предмет остаётся владельцу. Если нажал — мгновенная PvP-миниигра (монетка, кости или реакция): победитель забирает предмет, проигравший теряет комиссию.'],
    ['КАК ПОЛУЧИТЬ БОНУС 500 ₽?', 'Акция дня: потрать 1000 ₽ на кейсы за сутки и забери 500 ₽. Прогресс виден в шапке сайта.'],
    ['КАКИЕ БОНУСЫ ЗА ПОПОЛНЕНИЕ?', 'От 1000 ₽ — +10%, от 5000 ₽ — +15%, от 10000 ₽ — +20%. Бонус зачисляется автоматически.'],
    ['КАК ВЫВОДИТЬ ВЫИГРЫШ?', 'Продай предмет на баланс — заявка на вывод обрабатывается в течение 5 минут.'],
    ['У МЕНЯ УКРАЛИ ПРЕДМЕТ. ЭТО ЧЕСТНО?', 'Да! Дорогой дроп — событие для всего сайта. Защити предмет в миниигре — и он останется у тебя, а нападавший потеряет комиссию.']
  ];
  return `<div class="section-title">ПОДДЕРЖКА <b>· ОТВЕЧАЕМ БЫСТРО</b></div>
  ${faqs.map((f, i) => `
    <div class="faq-item">
      <button class="faq-q" data-action="faq" data-i="${i}">${f[0]}<span class="arr">▾</span></button>
      <div class="faq-a">${f[1]}</div>
    </div>`).join('')}
  <div class="section-title" style="margin-top:24px">ЧАТ С ПОДДЕРЖКОЙ</div>
  <div class="card" style="background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px">
    <div class="support-chat" id="chatBox">
      <div class="chat-msg bot">Привет! 👋 Я — поддержка GGDROP. Задай вопрос про апгрейды, кражи, вывод или бонусы.</div>
    </div>
    <div class="chat-input-row">
      <input id="chatInput" placeholder="Напиши сообщение…" maxlength="300"/>
      <button class="btn btn-mint" data-action="chat-send">ОТПРАВИТЬ</button>
    </div>
  </div>`;
}


const modalRoot = $('#modal-root');
function openModal(html, cls) {
  const idx = modalRoot.querySelectorAll('.modal-overlay').length;
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.style.zIndex = 100 + idx * 10;
  ov.innerHTML = `<div class="modal ${cls || ''}">${html}</div>`;
  ov.addEventListener('click', e => { if (e.target === ov && !ov.dataset.locked) closeModal(); });
  modalRoot.appendChild(ov);
  return ov;
}
function closeModal() {
  const ovs = modalRoot.querySelectorAll('.modal-overlay');
  const top = ovs[ovs.length - 1];
  if (!top) return false;
  if (top.dataset.locked) return false;
  const wasOpen = !!top.querySelector('#stealZone') || !!top.querySelector('.rv-ico');
  const wasMg = !!top.querySelector('#mgArena') || !!top.querySelector('#mgResult');
  top.remove();
  if (wasOpen) S.openModal = null;
  if (wasMg) { S.mgModal = null; S.currentBattle = null; }
  return true;
}
function lockModal(ov, lock) { if (ov) ov.dataset.locked = lock ? '1' : ''; }
function loginModal() {
  openModal(`
    <div class="modal-h"><b>ВХОД НА GGDROP</b><button class="modal-close" data-action="close-modal">✕</button></div>
    <div class="modal-b" style="text-align:center">
      <p style="color:var(--muted);font-size:11px;font-family:var(--font-body);margin-bottom:16px;line-height:1.6">
        Вход на сайт — только через Steam.<br>Ники и пароли не нужны, мы не храним твои данные.</p>
      <a class="auth-big" href="/api/auth/steam" style="justify-content:center;gap:14px">
        <span class="ab-ico">${steamSVG(24)}</span>
        <span><span class="ab-t">ВОЙТИ ЧЕРЕЗ STEAM</span><div class="ab-s">+500 ₽ новичку на баланс</div></span>
      </a>
      <div style="margin-top:14px;font-size:9.5px;color:var(--muted-2);font-family:var(--font-body)">
        Перенаправит на steamcommunity.com — там ты подтверждаешь вход,<br>и мы возвращаемся с твоим профилем
      </div>
    </div>`);
}
function depositModal() {
  const u = S.user;
  if (!u) { loginModal(); return; }
  const tiers = [
    { min: 100, max: 999, bonus: 0, label: 'ДО 999 ₽' },
    { min: 1000, max: 4999, bonus: 10, label: 'ОТ 1 000 ₽' },
    { min: 5000, max: 9999, bonus: 15, label: 'ОТ 5 000 ₽' },
    { min: 10000, max: Infinity, bonus: 20, label: 'ОТ 10 000 ₽' }
  ];
  const extra = u.bonusPercent || 0;
  openModal(`
    <div class="modal-h"><b>ПОПОЛНЕНИЕ БАЛАНСА</b><button class="modal-close" data-action="close-modal">✕</button></div>
    <div class="modal-b">
      <div class="input-row"><input id="depInput" type="number" min="100" placeholder="Сумма пополнения, ₽" value="1000"/></div>
      <div class="deposit-tiers">
        ${tiers.map((t, i) => `<div class="dep-tier ${S.depSel === i ? 'sel' : ''}" data-action="dep-tier" data-i="${i}">
          <span class="dt-range">${t.label}</span>
          <span class="dt-bonus ${t.bonus ? '' : 'none'}">${t.bonus ? '+' + t.bonus + '%' : 'БЕЗ БОНУСА'}</span>
        </div>`).join('')}
      </div>
      <div class="dep-result" id="depResult"></div>
      ${extra ? `<div style="margin-top:10px;font-size:11px;color:var(--gold)">🎁 Бонус +${extra}% с колеса удачи добавится автоматически</div>` : ''}
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" data-action="close-modal">ОТМЕНА</button>
      <button class="btn btn-mint" data-action="deposit-do">ПОПОЛНИТЬ</button>
    </div>`);
  const inp = $('#depInput');
  const upd = () => {
    const v = Math.max(0, parseFloat(inp.value) || 0);
    const t = tiers.find(x => v >= x.min && v <= x.max) || tiers[0];
    const bonus = t.bonus + extra;
    const res = $('#depResult');
    if (v > 0) {
      res.className = 'dep-result show';
      res.innerHTML = `Ты получишь <b>${fmt(v)}</b>${bonus ? ` + <b style="color:var(--mint-2)">${fmt(v * bonus / 100)}</b> бонус (+${bonus}%)` : ''} = <b style="color:var(--mint-2)">${fmt(v * (1 + bonus / 100))}</b>`;
    } else res.className = 'dep-result';
  };
  inp.addEventListener('input', upd); upd();
  S.depSel = null;
}


async function attemptSteal(evId) {
  const ev = S.events[evId];
  if (!ev) return;
  if (!S.user) { loginModal(); return; }
  if (S.user.balance < ev.commission) { toast('Не хватает средств', 'Комиссия за кражу: ' + fmt(ev.commission), 'err'); depositModal(); return; }
  beep(500, .1);
  try {
    const r = await api('/api/steal', { eventId: evId });
    S.user = r.user; updateBalance();
    if (r.battle) {
      S.events[evId].status = 'battle';
      S.battles[r.battle.id] = r.battle;
      updateFeedEvent(S.events[evId]);
      if (!S.mgModal || S.mgModal.battle.id !== r.battle.id) openMinigame(r.battle);
    }
  } catch (e) { toast('Не вышло', e.message, 'err'); }
}
function openMinigame(battle) {
  const me = S.user;
  const isOwner = me && battle.owner.id === me.id;
  const isThief = me && battle.thief.id === me.id;
  const meSide = isOwner ? 'owner' : (isThief ? 'thief' : null);
  const g = battle.game;
  S.currentBattle = battle;
  S.mgModal = { battle, meSide, done: false };
  openModal(`
    <div class="modal-h"><b>⚔️ PVP ЗА ПРЕДМЕТ</b><button class="modal-close" data-action="close-modal">✕</button></div>
    <div class="modal-b">
      <div class="mg-banner">
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--muted);letter-spacing:1px">БИТВА ЗА</div>
          <div style="font-weight:700;color:${RARITY[battle.item.rarity].color};font-size:13px">${esc(battle.item.name)} · ${fmt(battle.item.price)}</div>
        </div>
        <div style="font-size:11px;color:var(--muted-2)">${g === 'coin' ? 'МОНЕТКА' : g === 'dice' ? 'КОСТИ' : 'РЕАКЦИЯ'}</div>
      </div>
      <div class="mg-vs">
        <div class="mg-player">
          <div class="big-av" style="border-color:${isOwner ? 'var(--mint)' : '#5a5a5a'};background:${battle.owner.color}44">${esc(battle.owner.name.slice(0, 2).toUpperCase())}</div>
          <div class="nm">${esc(battle.owner.name)}</div>
          <div class="st">${isOwner ? 'ТЫ (ВЛАДЕЛЕЦ)' : 'ВЛАДЕЛЕЦ'}</div>
        </div>
        <div class="vs">VS</div>
        <div class="mg-player">
          <div class="big-av" style="border-color:${isThief ? 'var(--mint)' : '#5a5a5a'};background:${battle.thief.color}44">${esc(battle.thief.name.slice(0, 2).toUpperCase())}</div>
          <div class="nm">${esc(battle.thief.name)}</div>
          <div class="st">${isThief ? 'ТЫ (ВОР)' : 'ВОР'}</div>
        </div>
      </div>
      <div class="mg-arena" id="mgArena"></div>
      <div class="mg-result" id="mgResult"></div>
    </div>`);
  if (meSide) startPlayerGame(battle);
  else startBotGame(battle);
}
function startPlayerGame(battle) {
  const arena = $('#mgArena');
  const g = battle.game;
  if (g === 'coin') {
    arena.innerHTML = `<div class="hint">Выбери сторону — победитель забирает предмет</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-lg" data-action="mg-choice" data-choice="heads">🦅 ОРЁЛ</button>
        <button class="btn btn-ghost btn-lg" data-action="mg-choice" data-choice="tails">🪙 РЕШКА</button>
      </div>`;
  } else if (g === 'dice') {
    arena.innerHTML = `<div class="hint">Кости решают: больше очков — победа</div>
      <button class="btn btn-mint btn-lg" data-action="mg-roll">🎲 КИНУТЬ КОСТИ</button>`;
  } else {
    arena.innerHTML = `<button class="reaction-btn waiting" id="rxBtn" disabled>ЖДИ ЗЕЛЁНЫЙ…</button>
      <div class="hint">Когда кнопка станет зелёной — жми максимально быстро!</div>`;
    setTimeout(() => {
      const b = $('#rxBtn');
      if (!b) return;
      const goTime = Date.now() + rnd(1200, 3200);
      const tick = () => {
        if (!b) return;
        const left = goTime - Date.now();
        if (left <= 0) {
          b.className = 'reaction-btn go'; b.disabled = false; b.textContent = 'ЖМИ!!!';
          b.dataset.goAt = String(Date.now());
          b._auto = setTimeout(() => finishReaction(battle, 3000), 3000);
          b.onclick = () => { clearTimeout(b._auto); finishReaction(battle, Date.now() - parseInt(b.dataset.goAt)); };
        } else { b.textContent = 'ЖДИ… ' + Math.ceil(left / 1000); setTimeout(tick, 60); }
      };
      tick();
    }, 500);
  }
}
function finishReaction(battle, ms) {
  const b = $('#rxBtn');
  if (b) { b.className = 'reaction-btn result'; b.disabled = true; b.textContent = 'ГОТОВО!'; }
  resolveMinigame(battle.id, { reactionMs: Math.round(ms) });
}
async function resolveMinigame(battleId, data) {
  try {
    const r = await api('/api/minigame/resolve', { battleId, data });
    S.user = r.user; updateBalance();
    if (S.mgModal && S.mgModal.battle.id === battleId) S.mgModal.done = true;
    showMgResult(r.result);
  } catch (e) { toast('Ошибка', e.message, 'err'); }
}
function showMgResult(res) {
  const arena = $('#mgArena');
  const box = $('#mgResult');
  if (!box) return;
  const b = S.mgModal ? S.mgModal.battle : null;
  if (res.game === 'coin') {
    const side = res.details && res.details.winningSide;
    arena.innerHTML = `<div class="coin ${side === 'tails' ? 'back' : 'front'}"><div class="face"><span>${side === 'tails' ? '🪙' : '🦅'}</span></div></div>`;
  } else if (res.game === 'dice') {
    const pipHTML = v => {
      const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      let p = '';
      for (let i = 0; i < 9; i++) p += map[v].includes(i) ? '<span class="pip"></span>' : '<span></span>';
      return p;
    };
    const on = b ? esc(b.owner.name) : 'Владелец', tn = b ? esc(b.thief.name) : 'Вор';
    arena.innerHTML = `<div class="dice-row">
      <div><div style="font-size:10px;color:var(--muted);margin-bottom:8px;text-align:center">${on}</div>
      <div class="die ${res.winner === 'owner' ? 'win' : 'lose'}"><div class="pips">${pipHTML(res.details.ownerRoll)}</div></div></div>
      <div><div style="font-size:10px;color:var(--muted);margin-bottom:8px;text-align:center">${tn}</div>
      <div class="die ${res.winner === 'thief' ? 'win' : 'lose'}"><div class="pips">${pipHTML(res.details.thiefRoll)}</div></div></div>
    </div>`;
  } else {
    arena.innerHTML = `<div class="hint">Твоя реакция: <b style="color:var(--mint-2)">${fmtN(res.details.humanMs)} мс</b> против <b style="color:var(--gold)">${fmtN(res.details.botMs)} мс</b> у соперника</div>`;
  }
  box.className = 'mg-result show ' + (res.youWin ? 'win' : 'lose');
  box.innerHTML = `
    <div class="mr-t">${res.youWin ? '🏆 ТЫ ПОБЕДИЛ!' : '💀 ПОРАЖЕНИЕ'}</div>
    <div class="mr-s">${res.youWin
      ? (res.youAre === 'thief' ? `Ты украл <b>${esc(res.item.name)}</b> (${fmt(res.item.price)})! Предмет в инвентаре.` : `Ты защитил <b>${esc(res.item.name)}</b>! Вор потерял комиссию ${fmt(res.commission)}.`)
      : (res.youAre === 'thief' ? `Ты проиграл битву — комиссия ${fmt(res.commission)} осталась сайту, предмет остался у владельца.` : `Твой <b>${esc(res.item.name)}</b> украден… Такова жизнь GGDROP.`)}
    </div>
    <button class="btn btn-mint btn-lg" style="margin-top:14px" data-action="close-modal">ПОНЯТНО</button>`;
}
function showSseMgResult(ev) {
  const box = $('#mgResult');
  const arena = $('#mgArena');
  if (!box || !S.mgModal || S.mgModal.battle.eventId !== ev.id) return;
  const me = S.user;
  const youWin = me && ev.winnerId === me.id;
  const youAre = me ? (ev.ownerId === me.id ? 'owner' : 'thief') : null;
  if (arena) arena.innerHTML = '';
  box.className = 'mg-result show ' + (youWin ? 'win' : 'lose');
  box.innerHTML = `
    <div class="mr-t">${youWin ? '🏆 ТЫ ПОБЕДИЛ!' : '💀 ПОРАЖЕНИЕ'}</div>
    <div class="mr-s">${youWin
      ? (youAre === 'thief' ? `Ты украл <b>${esc(ev.item.name)}</b> (${fmt(ev.item.price)})!` : `Ты защитил <b>${esc(ev.item.name)}</b>!`)
      : (youAre === 'thief' ? `Ты проиграл битву — комиссия ${fmt(ev.commission)} осталась сайту.` : `Твой <b>${esc(ev.item.name)}</b> украден… Такова жизнь GGDROP.`)}
    </div>
    <button class="btn btn-mint btn-lg" style="margin-top:14px" data-action="close-modal">ПОНЯТНО</button>`;
}
function startBotGame(battle) {
  const arena = $('#mgArena');
  if (!arena) return;
  const g = battle.game;
  arena.innerHTML = `<div class="hint">⚔️ Битва уже идёт…</div>`;
}


function toast(title, msg, type) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  const ico = type === 'err' ? '⚠️' : type === 'steal' ? '🔪' : '✅';
  el.innerHTML = `<span class="t-ico">${ico}</span><div><b>${esc(title)}</b><span>${esc(msg)}</span></div>`;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 4400);
}


const ACTIONS = {
  'nav': el => {
    S.view = el.dataset.view;
    closeModal();
    if (location.hash !== '#/' + S.view) history.replaceState(null, '', '#/' + S.view);
    render();
  },
  'close-modal': () => closeModal(),
  'login': () => { location.href = '/api/auth/steam'; },
  'logout': () => { location.href = '/api/auth/logout'; },
  'deposit': () => depositModal(),
  'dep-tier': el => {
    S.depSel = parseInt(el.dataset.i);
    $$('.dep-tier').forEach(t => t.classList.remove('sel'));
    el.classList.add('sel');
  },
  'deposit-do': async () => {
    const v = Math.max(1, parseFloat($('#depInput').value) || 0);
    try {
      const r = await api('/api/deposit', { amount: v });
      S.user = r.user; updateBalance(); closeModal(); render();
      toast('Пополнение', `+${fmt(v)}${r.bonus ? ' (+' + fmt(r.bonus) + ' бонус)' : ''} на баланс`, 'ok');
    } catch (e) { toast('Ошибка', e.message, 'err'); }
  },
  'open-case': el => openCase(el.dataset.case),
  'sell-spin': async () => {
    if (!S.openModal) return;
    try {
      const r = await api('/api/open/sell', { spinId: S.openModal.spinId });
      S.user = r.user; updateBalance(); closeModal();
      toast('Продано', `+${fmt(r.amount)} на баланс`, 'ok');
    } catch (e) { toast('Ошибка', e.message, 'err'); }
  },
  'steal': el => attemptSteal(el.dataset.event),
  'claim-spend': async () => {
    try {
      const r = await api('/api/promo/claim-spend');
      S.user = r.user; updateBalance(); render();
      toast('Бонус получен!', `+${fmt(r.reward)} на баланс`, 'ok');
    } catch (e) { toast('Акция', e.message, 'err'); }
  },
  'claim-daily': async () => {
    try {
      const r = await api('/api/rewards/claim');
      S.user = r.user; updateBalance(); render();
      toast('Ежедневная награда!', `+${fmt(r.reward)} на баланс`, 'ok');
    } catch (e) { toast('Ошибка', e.message, 'err'); }
  },
  'sell-item': async el => {
    try {
      const r = await api('/api/inventory/sell', { itemId: el.dataset.item });
      S.user = r.user; updateBalance(); render();
      toast('Продано', `+${fmt(r.amount)} на баланс`, 'ok');
    } catch (e) { toast('Ошибка', e.message, 'err'); }
  },
  'upg-pick-item': el => { S.upg.itemId = el.dataset.item; render(); },
  'upg-pick-target': el => { S.upg.targetId = el.dataset.target; render(); },
  'upg-remove-item': () => { S.upg.itemId = null; S.upg.balance = 0; render(); },
  'upg-remove-target': () => { S.upg.targetId = null; render(); },
  'upg-add-bal': () => {
    const inp = $('#upgBal');
    if (!inp) return;
    const v = Math.max(0, Math.round(parseFloat(inp.value) || 0));
    S.upg.balance = v;
    render();
  },
  'upg-go': () => upgGo(),
  'upg-retry': () => { closeModal(); render(); },
  'panel-toggle': el => {
    const b = el.closest('.panel').querySelector('.panel-b');
    b.classList.toggle('collapsed');
    el.style.transform = b.classList.contains('collapsed') ? 'rotate(180deg)' : '';
  },
  'faq': el => {
    const item = el.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    $$('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  },
  'chat-send': () => {
    const inp = $('#chatInput');
    if (!inp) return;
    const v = inp.value.trim();
    if (!v) return;
    const box = $('#chatBox');
    box.insertAdjacentHTML('beforeend', `<div class="chat-msg me">${esc(v)}</div>`);
    inp.value = '';
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
      const replies = [
        'Принято! Заявка передана оператору, ответ в течение 5 минут. 💬',
        'Хороший вопрос! Если он про апгрейды или кражи — читай FAQ, там всё расписано.',
        'Понял тебя. Проверь баланс через минуту — если что-то не так, напиши ещё раз.',
        'Спасибо за обращение! Мы ценим каждого игрока. 🤍'
      ];
      box.insertAdjacentHTML('beforeend', `<div class="chat-msg bot">${replies[Math.floor(Math.random() * replies.length)]}</div>`);
      box.scrollTop = box.scrollHeight;
    }, 1200);
  },
  'mg-choice': el => resolveMinigame(S.currentBattle.id, { choice: el.dataset.choice }),
  'mg-roll': () => resolveMinigame(S.currentBattle.id, {}),
  'snd-toggle': () => {
    SND.on = !SND.on;
    const b = $('#sndBtn');
    if (b) { b.classList.toggle('on', SND.on); b.innerHTML = soundSVG(SND.on); }
    beep(700, .08);
  },
  'fx-toggle': el => {
    document.body.classList.toggle('no-fx');
    el.classList.toggle('on');
    toast('Мгновенный режим', document.body.classList.contains('no-fx') ? 'включён' : 'выключен', 'ok');
  }
};
document.addEventListener('click', e => {
  const chip = $('#userChip');
  if (chip && chip.contains(e.target)) {
    if (!e.target.closest('.user-menu')) chip.classList.toggle('open');
  } else if (chip) chip.classList.remove('open');
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = ACTIONS[el.dataset.action];
  if (a) { e.preventDefault(); a(el, e); }
});


function connectSSE() {
  const es = new EventSource('/api/events');
  es.addEventListener('drop', e => {
    try {
      const d = JSON.parse(e.data);
      S.feed.unshift(d);
      S.feed = S.feed.slice(0, 60);
      prependDrop(d);
      if (d.item.price >= 5000) toast('🔥 Крупный дроп!', `${d.user.name} выбил ${d.item.name} (${fmt(d.item.price)})`, 'steal');
    } catch (err) {}
  });
  es.addEventListener('steal_start', e => {
    try {
      const ev = JSON.parse(e.data);
      S.events[ev.id] = ev;
      updateFeedEvent(ev);
    } catch (err) {}
  });
  es.addEventListener('steal_battle', e => {
    try {
      const b = JSON.parse(e.data);
      const ev = S.events[b.eventId];
      if (ev) { ev.status = 'battle'; updateFeedEvent(ev); }
      S.battles[b.id] = b;
      if (S.user && (b.owner.id === S.user.id || b.thief.id === S.user.id)) {
        if (!S.mgModal || S.mgModal.battle.id !== b.id) openMinigame(b);
      }
    } catch (err) {}
  });
  es.addEventListener('steal_resolved', e => {
    try {
      const ev = JSON.parse(e.data);
      const prev = S.events[ev.id];
      S.events[ev.id] = ev;
      updateFeedEvent(ev);
      if (S.mgModal && S.mgModal.battle.eventId === ev.id && !S.mgModal.done) {
        S.mgModal.done = true;
        showSseMgResult(ev);
      }
      if (prev && prev.status !== 'resolved' && ev.outcome === 'stolen' && ev.winnerId && S.user && ev.winnerId === S.user.id) {
        toast('🏆 Ты украл предмет!', `${ev.item.name} теперь твой!`, 'ok');
      }
      if (prev && prev.status !== 'resolved' && ev.outcome === 'stolen' && ev.ownerId && S.user && ev.ownerId === S.user.id) {
        toast('💀 Твой предмет украден', `${ev.item.name} ушёл вору…`, 'err');
      }
    } catch (err) {}
  });
  es.addEventListener('stats', e => {
    try {
      const s = JSON.parse(e.data);
      S.stats = s; onlineN = s.online;
      const so = $('#sOnline'); if (so) so.textContent = fmtN(onlineN);
      const sc = $('#sCases'); if (sc) sc.textContent = fmtN(s.casesToday);
    } catch (err) {}
  });
  es.addEventListener('balance', e => {
    try {
      const u = JSON.parse(e.data);
      if (S.user && u.id === S.user.id) { S.user = u; updateBalance(); }
    } catch (err) {}
  });
  es.onerror = () => {};
}


function renderFeed() {
  const list = $('#feedList');
  if (list) list.innerHTML = feedHTML();
}
function updateBalance() {
  const el = $('#balanceNum');
  if (el && S.user) el.textContent = fmt(S.user.balance);
  const sb = $('#subBalance');
  if (sb && S.user) sb.textContent = fmt(S.user.balance);
  const sp = $('#spendInfo');
  if (sp && S.user) {
    if (S.user.spend.claimed) sp.textContent = 'Бонус получен';
    else sp.textContent = `Потрачено ${fmt(S.user.spend.spent)} из 1000 ₽`;
    const bar = $('#spendBar');
    if (bar) bar.style.width = Math.min(100, S.user.spend.spent / 1000 * 100) + '%';
  }
}
function updateCountdowns() {
  Object.values(S.events).forEach(ev => {
    if (ev.status !== 'active') return;
    if (Date.now() >= ev.endsAt) {
      ev.status = 'expired';
      updateFeedEvent(ev);
    }
  });
  updateStealWarning();
  $$('[data-action="steal"]').forEach(b => {
    const ev = S.events[b.dataset.event];
    if (ev && ev.status === 'active') {
      const left = Math.max(0, ev.endsAt - Date.now());
      b.textContent = `🕓 ${Math.ceil(left / 1000)}с · STEAL ${fmt(ev.commission)}`;
    }
  });
}
setInterval(updateCountdowns, 400);
window.addEventListener('hashchange', () => {
  const v = location.hash.replace('#/', '') || 'upgrade';
  if (['cases', 'upgrade', 'rewards', 'inventory', 'support'].includes(v)) S.view = v;
  render();
});


(async function boot() {
  try {
    const ae = new URLSearchParams(location.search).get('auth_error');
    if (ae) toast('Ошибка входа', decodeURIComponent(ae), 'err');
  } catch (e) {}
  try {
    const st = await api('/api/state');
    S.cases = st.cases; S.stats = st.stats; S.user = st.user;
    S.feed = st.feed || []; S.events = st.events || {};
    onlineN = st.stats.online;
  } catch (e) { console.error(e); }
  const v = location.hash.replace('#/', '') || 'upgrade';
  if (['cases', 'upgrade', 'rewards', 'inventory', 'support'].includes(v)) S.view = v;
  render();
  connectSSE();
})();
})();
