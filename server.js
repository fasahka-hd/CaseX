
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));


let nid = 1;
const nextId = () => 'x' + (nid++);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dayKey = () => new Date().toISOString().slice(0, 10);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));


const S = 'https://community.akamai.steamstatic.com/economy/image/';
const icon = enc => S + enc + '/256fx256f';
const STEAM_ICONS = {
  'MP9 | Rose Iron': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_C9k-_qheqp0H-KcHWKvzP4vj-1gSCGn20h0423Wn9qoJH6QOwNxXpRxQOQLtEHumtTvP-i05wyMjN5Hz3qtiy1XrnE8Sl7QOgI'),
  'P250 | Kintsugi': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjIJuqKRY61jNOOGCW6vzedxuPUnHXrikBkh4jjXzd76I36VPQF2CJV2FOYLthC5k9DiNuOwswKLj4JHxTK-0H3jhNNozg'),
  'P250 | Black & Tan': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwipC0Pare6F_NM-eG2uEyO13vd5hSiiljFNy4DvWydevJSmXZlR1XJZ0Q-ZZ4ULqwYLnYri0s1TYi9oRnn_8hylP8G81tLgJfvNG'),
  'Desert Eagle | Mecha Industries': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk6OGRbKFsJ_yWMWqVwuZ3j-xsSyCmmFNxtzvUnouqdi_EZgB2X5d5ELUNuhDqxoazYu634QPX3oxAnyj_jnlP8G81tF-I545Z'),
  'P250 | Muertos': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSLfGdCmacwNF7teVgWiT9x0114G3QnNasJ3uXOgEiWZB4FuVb5hG7xtLvYr_q5Q2L3t4Qzn743DQJsHgK_1D3WA'),
  'P90 | Trigon': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-V7B_KfecAFidxOp_pewnSnq3wxlwtW2GwoqoeHKROgYoWJMiFONftRm4ldXhMe_ksleK3dhNnzK-0H2eTIsGVA'),
  'Galil AR | Amber Fade': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0POvV6JsJPWsA2KEwOJ6ueJWQyC0nQlp52uGm9yodC3GZ1d0CMdyQeJctRDqmtayY-Kz71fW2IIUziz8intK6TErvbiZh4dEMQ'),
  'Nova | Red Quartz': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiNW0PG8cbd5IfyfB32VxdF7teVgWiT9xxhz52ndyI36dimVaAFzDppxQeQLuxbqkIeyY-uw4ADci9oWnnj7jzQJsHiGJ4-jvw'),
  'Dual Berettas | Hemoglobin': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1a4s2he7dkJumsHGKU_uJ_t-l9ASjjxEgm4mWHzYuhdi-RPVByD5pxF-ULshS6xofjMrzgs1eIiIxHnnrgznQe0T5dj0k'),
  'MP7 | Smoking Kills': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf8DIM0OGjZ69kLvesBW6czf1JprNWQiy3nAgq_TjSyIn8cy2eb1UjW5p4R-JeuhC_xIC1P-zn7wOIjItCn3383Hgf6n11o7FVl5bdg0g'),
  'CZ75-Auto | Nitro': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1I4M2heqVjJ_WsD2STxOBio7NWQiy3nAgq_Wzdn4msdCmWagcpD8clTbNe4EXuxtLlZuLn7wXfid9GxCirjyhO7Sh1o7FVFCJcSxA'),
  'FAMAS | Contrast Spray': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I_829eLZsOc-eC2OZ1OM45OA9TXHqlxh0sWrXy9j8JHiQPA50CsB3EbYDshLtm9LnYuOw5AOKgpUFk3sQLCgtJw'),
  'P250 | Visions': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiVI0OL8PfRSNvmAB2ie0tF6ueZhW2fmzERx5jyHm4v_dXvGaQR2WJF2QrIMsxW_w9PvN-zhtgXXiokWn3_6kGoXuc_iGAKZ'),
  'Glock-18 | Shinobu': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1c4_2tY5t-KPmdAWWF_uNztOh8QmflzR50sDnXzdv9I3iTOwdzAsZxE7FcsUW7xNPkMeyx4QTYiI5CnCj9kGoXuamHlTQY'),
  'P90 | Nostalgia': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-V6piM-SSAmCZwNF-teB_VmfhkUoisWmAnor9Ii3DOAQpDJtwR7EN5Be8ltK0M-PlslfcjYlGniWskGoXueeM3tCz'),
  'AK-47 | Rat Rod': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSLvmRDGuV09F7teVgWiT9xEp15TmDzY2hd3LEblUnD8N3Qu8NsEWxl9PgZLyx7wzcgoxAzyqsjjQJsHivHZck7Q'),
  'SCAR-20 | Bloodsport': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLinZfyr3Jk6OGRe6dsMqLDMWWczuFyo_FmXT2MmBgjuiiI1N38Iy_GPFclC5B5FO8PtRjplt3jM-y2tgTcioNGynqoiyhJ6SdssuYcEf1yQmJ077s'),
  'Glock-18 | Red Tire': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I_826YbZoH-SBC2aU_vxztN5lRi67gVN15WzSmY36cn6RagEnD8MjTbIJ50W5m9OyN-rmtQGIgo9Fnimrhngd8G81tCm_mA6x'),
  'Sticker | device (Foil)': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjMmuOXSQ61MnpNaipUruRiL1m4Dp_idk6f2nZOppcaXBW2XHk7515-Q8GX63lkR2sj7TzomsIinGZgQoCcN1Fu5ZsxO_jJS5YFRo7GVF'),
  'Charm | Titeenium AWP': icon('i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwipC0Pare6F_NM-eG2uEyO13vd5hSiiljFNy4DvWydevJSmXZlR1XJZ0Q-ZZ4ULqwYLnYri0s1TYi9oRnn_8hylP8G81tLgJfvNG')
};
const T = (name, price, rarity, type) => ({
  id: 'i' + (nid++), name, price, rarity, type, icon: STEAM_ICONS[name] || null
});


const BLUE = [
  T('P250 | Sand Dune', 8, 'blue', 'glock'),
  T('Sawed-Off | Forest DDPAT', 7, 'blue', 'shotgun'),
  T('UMP-45 | Urban DDPAT', 12, 'blue', 'smg'),
  T('Tec-9 | Army Sheen', 18, 'blue', 'deagle'),
  T('Five-SeveN | Contractor', 9, 'blue', 'glock'),
  T('Galil AR | Desert Storm', 14, 'blue', 'ak'),
  T('P90 | Sand Spray', 20, 'blue', 'smg'),
  T('SSG 08 | Sand Dune', 25, 'blue', 'awp'),
  T('MAG-7 | Hazard', 22, 'blue', 'shotgun'),
  T('SCAR-20 | Sand Mesh', 15, 'blue', 'awp'),
  T('PP-Bizon | Sand Dashed', 11, 'blue', 'smg'),
  T('MP9 | Rose Iron', 30, 'blue', 'smg')
];
const PURPLE = [
  T('P250 | Kintsugi', 95, 'purple', 'glock'),
  T('P250 | Black & Tan', 75, 'purple', 'glock'),
  T('Desert Eagle | Mecha Industries', 190, 'purple', 'deagle'),
  T('P250 | Muertos', 80, 'purple', 'glock'),
  T('P90 | Trigon', 110, 'purple', 'smg'),
  T('Galil AR | Amber Fade', 140, 'purple', 'ak'),
  T('Nova | Red Quartz', 65, 'purple', 'shotgun'),
  T('Dual Berettas | Hemoglobin', 120, 'purple', 'glock'),
  T('MP7 | Smoking Kills', 105, 'purple', 'smg'),
  T('CZ75-Auto | Nitro', 85, 'purple', 'deagle'),
  T('FAMAS | Contrast Spray', 90, 'purple', 'm4'),
  T('Sticker | Luck is a Skill', 70, 'purple', 'sticker')
];
const PINK = [
  T('P250 | Visions', 130, 'pink', 'glock'),
  T('Glock-18 | Shinobu', 230, 'pink', 'glock'),
  T('P90 | Nostalgia', 260, 'pink', 'smg'),
  T('AK-47 | Rat Rod', 420, 'pink', 'ak'),
  T('SCAR-20 | Bloodsport', 380, 'pink', 'awp'),
  T('AWP | Snake Camo', 200, 'pink', 'awp'),
  T('M4A4 | Converter', 350, 'pink', 'm4'),
  T('USP-S | Pathfinder', 300, 'pink', 'deagle'),
  T('Glock-18 | Water Elemental', 450, 'pink', 'glock'),
  T('AK-47 | Slate', 400, 'pink', 'ak'),
  T('M4A1-S | Mud-Spec', 320, 'pink', 'm4'),
  T('Glock-18 | Red Tire', 280, 'pink', 'glock'),
  T('Sticker | device (Foil)', 180, 'pink', 'sticker'),
  T('Charm | Titeenium AWP', 160, 'pink', 'charm')
];
const RED = [
  T('AWP | Redline', 1600, 'red', 'awp'),
  T('AK-47 | Redline', 2200, 'red', 'ak'),
  T('M4A4 | Dragon King', 900, 'red', 'm4'),
  T('M4A1-S | Hyper Beast', 1800, 'red', 'm4'),
  T('USP-S | Kill Confirmed', 1500, 'red', 'deagle'),
  T('Glock-18 | Fade', 2500, 'red', 'glock'),
  T('Desert Eagle | Printstream', 2400, 'red', 'deagle'),
  T('AK-47 | Bloodsport', 2100, 'red', 'ak'),
  T('AWP | Neo-Noir', 1900, 'red', 'awp'),
  T('M4A4 | Asiimov', 1400, 'red', 'm4'),
  T('AWP | Asiimov', 2300, 'red', 'awp'),
  T('Butterfly Knife | Safari Mesh', 800, 'red', 'butterfly')
];
const GOLD = [
  T('Karambit | Doppler', 9500, 'gold', 'karambit'),
  T('M4A4 | Howl', 12000, 'gold', 'm4'),
  T('AK-47 | Fire Serpent', 9000, 'gold', 'ak'),
  T('M4A1-S | Printstream', 5200, 'gold', 'm4'),
  T('AWP | Fade', 6000, 'gold', 'awp'),
  T('Butterfly Knife | Doppler', 7800, 'gold', 'butterfly'),
  T('Talon Knife | Marble Fade', 5500, 'gold', 'karambit'),
  T('Glock-18 | Fade (Factory New)', 3500, 'gold', 'glock'),
  T('Desert Eagle | Blaze', 3000, 'gold', 'deagle'),
  T('AWP | Gungnir', 11000, 'gold', 'awp'),
  T('Karambit | Fade', 11000, 'gold', 'karambit'),
  T('Sport Gloves | Vice', 8500, 'gold', 'gloves')
];
const MINT = [
  T('AWP | Dragon Lore (Factory New)', 42000, 'mint', 'awp'),
  T('AK-47 | Wild Lotus', 38000, 'mint', 'ak'),
  T('Karambit | Case Hardened (Blue Gem)', 30000, 'mint', 'karambit'),
  T('M4A4 | Howl (Factory New)', 34000, 'mint', 'm4'),
  T('Sport Gloves | Pandora\'s Box', 45000, 'mint', 'gloves'),
  T('Karambit | Ruby', 40000, 'mint', 'karambit'),
  T('M9 Bayonet | Sapphire', 36000, 'mint', 'karambit'),
  T('AK-47 | Gold Arabesque', 29000, 'mint', 'ak'),
  T('AWP | The Prince', 22000, 'mint', 'awp'),
  T('Butterfly Knife | Fade', 18000, 'mint', 'butterfly')
];
const ALL_ITEMS = [...BLUE, ...PURPLE, ...PINK, ...RED, ...GOLD, ...MINT];
const POOLS = { blue: BLUE, purple: PURPLE, pink: PINK, red: RED, gold: GOLD, mint: MINT };


const CASES = [
  { id: 'mint',     name: 'Кейс «Мята»',    price: 99,   accent: '#74ffca', tier: 'mint',   weights: { blue: 62, purple: 28, pink: 8, red: 1.8, gold: 0.2 } },
  { id: 'spectrum', name: 'Спектр',         price: 199,  accent: '#5fb4ff', tier: 'purple', weights: { blue: 48, purple: 36, pink: 12, red: 3.4, gold: 0.6 } },
  { id: 'night',    name: 'Ночной охотник', price: 349,  accent: '#9b5cff', tier: 'purple', weights: { blue: 34, purple: 40, pink: 18, red: 7, gold: 1 } },
  { id: 'cyber',    name: 'Киберпанк',      price: 649,  accent: '#ff4fd8', tier: 'red',    weights: { blue: 10, purple: 40, pink: 34, red: 20, gold: 5.5, mint: 0.5 } },
  { id: 'predator', name: 'Хищник',         price: 1199, accent: '#ff5252', tier: 'red',    weights: { purple: 28, pink: 36, red: 26, gold: 9, mint: 1 } },
  { id: 'dragon',   name: 'Дракон',         price: 2499, accent: '#ff8f3d', tier: 'gold',   weights: { pink: 34, red: 40, gold: 22, mint: 4 } },
  { id: 'genesis',  name: 'Генезис',        price: 5499, accent: '#ffb800', tier: 'gold',   weights: { pink: 18, red: 42, gold: 32, mint: 8 } },
  { id: 'legend',   name: 'Легенда',        price: 9999, accent: '#ffd76a', tier: 'gold',   weights: { red: 25, gold: 55, mint: 20 } }
];
function caseContents(c) {
  const list = [];
  for (const [rarity, w] of Object.entries(c.weights)) {
    POOLS[rarity].forEach(item => list.push({ item, w: w / POOLS[rarity].length }));
  }
  return list;
}
function rollCase(c) {
  const list = caseContents(c);
  const total = list.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of list) { r -= x.w; if (r <= 0) return x.item; }
  return list[0].item;
}
function casePublic(c) {
  const contents = caseContents(c);
  const top = contents.map(x => x.item).sort((a, b) => b.price - a.price).slice(0, 3);
  return { id: c.id, name: c.name, price: c.price, accent: c.accent, tier: c.tier, itemsCount: contents.length, top, contents };
}


const users = new Map();          
const pendingSpins = new Map();   
const battles = new Map();        
const feed = [];
const events = new Map();         
const stats = { casesToday: 0, winsToday: 0, topWin: 0, dayKey: dayKey() };
let online = 0;


const clients = new Set();
function broadcast(name, data) {
  const msg = `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) { try { c.write(msg); } catch (e) {} }
}


function cookieUser(req) {
  const m = (req.headers.cookie || '').match(/ggu=([^;]+)/);
  return m ? users.get(m[1]) || null : null;
}
function newUser(name) {
  return {
    id: nextId(), name: name || 'Steam Player', color: '#74FFCA', isBot: false, steamId: null,
    balance: 500,
    inventory: [],
    stats: { opened: 0, wonTotal: 0, stealAttempts: 0, stealsWon: 0, stealsLost: 0 },
    spend: { spent: 0, claimed: false, dayKey: dayKey() },
    rewards: { lastClaimDate: '', streak: 0 },
    bonusPercent: 0
  };
}
function userPublic(u) {
  return {
    id: u.id, name: u.name, color: u.color,
    balance: u.balance, inventory: u.inventory,
    stats: u.stats, spend: u.spend, rewards: u.rewards,
    bonusPercent: u.bonusPercent
  };
}


const STEAL_THRESHOLD = 1000;
const STEAL_COMMISSION = 0.04;      
const STEAL_WINDOW = 15000;         

function createStealEvent(item, owner) {
  const ev = {
    id: nextId(),
    item,
    ownerId: owner.id,
    owner: { id: owner.id, name: owner.name, color: owner.color },
    commission: Math.max(5, Math.round(item.price * STEAL_COMMISSION)),
    endsAt: Date.now() + STEAL_WINDOW,
    status: 'active',   
    outcome: null,      
    winnerId: null,
    battleId: null
  };
  events.set(ev.id, ev);
  broadcast('steal_start', ev);
  return ev;
}
function resolveBattle(battleId, data) {
  const b = battles.get(battleId);
  if (!b || b.state === 'done') return null;
  b.state = 'done';
  const ev = events.get(b.eventId);
  const ownerHuman = users.get(b.owner.id);
  const thiefHuman = users.get(b.thief.id);

  let winnerId, details = {};
  if (b.game === 'coin') {
    const winningSide = Math.random() < 0.5 ? 'heads' : 'tails';
    const humanChoice = (data.choice === 'heads' || data.choice === 'tails')
      ? data.choice : (Math.random() < 0.5 ? 'heads' : 'tails');
    const ownerSide = ownerHuman ? humanChoice : (Math.random() < 0.5 ? 'heads' : 'tails');
    const thiefSide = thiefHuman ? humanChoice : (Math.random() < 0.5 ? 'heads' : 'tails');
    details.winningSide = winningSide; details.ownerSide = ownerSide; details.thiefSide = thiefSide;
    const oW = ownerSide === winningSide, tW = thiefSide === winningSide;
    winnerId = oW === tW ? (Math.random() < 0.5 ? b.owner.id : b.thief.id) : (oW ? b.owner.id : b.thief.id);
  } else if (b.game === 'dice') {
    let ownerRoll = ri(1, 6), thiefRoll = ri(1, 6);
    if (ownerRoll === thiefRoll) { ownerRoll = ri(1, 6); thiefRoll = ri(1, 6); }
    details.ownerRoll = ownerRoll; details.thiefRoll = thiefRoll;
    winnerId = ownerRoll >= thiefRoll ? b.owner.id : b.thief.id;
  } else {
    const botMs = Math.round(rnd(280, 780));
    const humanMs = data.reactionMs != null ? clamp(parseInt(data.reactionMs), 0, 3000) : 3000;
    let ownerMs, thiefMs;
    if (ownerHuman) { ownerMs = humanMs; thiefMs = botMs; }
    else if (thiefHuman) { thiefMs = humanMs; ownerMs = botMs; }
    else { ownerMs = Math.round(rnd(280, 780)); thiefMs = Math.round(rnd(280, 780)); }
    details.humanMs = humanMs; details.botMs = botMs; details.ownerMs = ownerMs; details.thiefMs = thiefMs;
    winnerId = thiefMs < ownerMs ? b.thief.id : b.owner.id;
  }

  
  const winner = winnerId === b.owner.id ? b.owner : b.thief;
  const winnerHuman = users.get(winner.id);
  if (winnerHuman) {
    winnerHuman.inventory.push({ id: nextId(), item: b.item, ts: Date.now(), source: winnerId === b.thief.id ? 'steal' : 'win' });
  }
  
  for (const [sid, p] of [...pendingSpins.entries()]) {
    if (p.eventId === ev.id) pendingSpins.delete(sid);
  }
  
  if (thiefHuman) {
    thiefHuman.stats.stealAttempts++;
    if (winnerId === b.thief.id) thiefHuman.stats.stealsWon++; else thiefHuman.stats.stealsLost++;
  }
  if (ownerHuman && winnerId !== b.owner.id) ownerHuman.stats.stealsLost++;

  ev.status = 'resolved';
  ev.outcome = winnerId === b.owner.id ? 'kept' : 'stolen';
  ev.winnerId = winnerId;
  broadcast('steal_resolved', ev);
  if (ownerHuman) broadcast('balance', userPublic(ownerHuman));
  if (thiefHuman) broadcast('balance', userPublic(thiefHuman));
  return { winnerId, game: b.game, details, item: b.item, commission: b.commission, outcome: ev.outcome };
}


setInterval(() => {
  const now = Date.now();
  for (const ev of [...events.values()]) {
    if (ev.status === 'active' && now >= ev.endsAt) {
      ev.status = 'resolved';
      ev.outcome = 'kept';
      ev.winnerId = ev.ownerId;
      const ownerHuman = users.get(ev.ownerId);
      if (ownerHuman) {
        ownerHuman.inventory.push({ id: nextId(), item: ev.item, ts: Date.now(), source: 'win' });
        for (const [sid, p] of [...pendingSpins.entries()]) {
          if (p.eventId === ev.id) pendingSpins.delete(sid);
        }
        broadcast('balance', userPublic(ownerHuman));
      }
      broadcast('steal_resolved', ev);
    }
  }
  if (stats.dayKey !== dayKey()) {
    stats.dayKey = dayKey(); stats.casesToday = 0; stats.winsToday = 0; stats.topWin = 0;
  }
}, 1000);

function pushStats() {
  broadcast('stats', { online, casesToday: stats.casesToday, winsToday: stats.winsToday, topWin: stats.topWin });
}
setInterval(pushStats, 30000);


app.get('/api/state', (req, res) => {
  const u = cookieUser(req);
  const activeEvents = [...events.values()].filter(e => e.status !== 'resolved');
  res.json({
    ok: true,
    user: u ? userPublic(u) : null,
    cases: CASES.map(casePublic),
    stats: { online, casesToday: stats.casesToday, winsToday: stats.winsToday, topWin: stats.topWin },
    feed: feed.slice(0, 60),
    events: activeEvents
  });
});

const STEAM_OPENID = 'https://steamcommunity.com/openid/login';
const steamIds = new Map(); 

function steamProto(req) {
  const f = req.headers['x-forwarded-proto'];
  return f ? String(f).split(',')[0].trim() : req.protocol;
}
function steamHost(req) {
  return req.get('host');
}


app.get('/api/auth/steam', (req, res) => {
  const proto = steamProto(req);
  const host = steamHost(req);
  const returnTo = proto + '://' + host + '/api/auth/steam/callback';
  const realm = proto + '://' + host + '/';
  const p = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  res.redirect(STEAM_OPENID + '?' + p.toString());
});


app.get('/api/auth/steam/callback', async (req, res) => {
  try {
    const q = req.query;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (String(k).startsWith('openid.')) params.append(k, String(v));
    }
    if (!params.has('openid.claimed_id')) throw new Error('Нет данных Steam');
    params.set('openid.mode', 'check_authentication');
    const vr = await fetch(STEAM_OPENID + '?' + params.toString(), { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const body = await vr.text();
    if (!/is_valid\s*:\s*true/i.test(body)) throw new Error('Steam не подтвердил вход');
    const m = String(q['openid.claimed_id'] || '').match(/\/(\d{17})\/?$/);
    if (!m) throw new Error('Неверный Steam ID');
    const steamId = m[1];
    
    let name = 'Steam_' + steamId.slice(-5);
    let avatar = null;
    try {
      const pr = await fetch('https://steamcommunity.com/profiles/' + steamId + '/?xml=1', { signal: AbortSignal.timeout(15000) });
      const xml = await pr.text();
      const nm = xml.match(/<steamID><!\[CDATA\[([^\]]+)\]\]><\/steamID>/);
      const av = xml.match(/<avatarIcon><!\[CDATA\[([^\]]+)\]\]><\/avatarIcon>/);
      if (nm) name = nm[1].slice(0, 24);
      if (av) avatar = av[1];
    } catch (e) {}
    let u = steamIds.get(steamId) ? users.get(steamIds.get(steamId)) : null;
    if (!u) {
      u = newUser(name);
      u.steamId = steamId;
      u.avatar = avatar;
      users.set(u.id, u);
      steamIds.set(steamId, u.id);
    } else {
      u.name = name; u.avatar = avatar;
    }
    res.setHeader('Set-Cookie', `ggu=${u.id}; Path=/; Max-Age=31536000`);
    res.redirect('/');
  } catch (e) {
    res.redirect('/?auth_error=' + encodeURIComponent(e.message || 'Ошибка входа'));
  }
});

app.get('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'ggu=; Path=/; Max-Age=0');
  res.redirect('/');
});
app.post('/api/deposit', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const amount = Math.max(1, Math.round(Number(req.body.amount) || 0));
  if (amount > 1000000) return res.json({ ok: false, error: 'Слишком большая сумма' });
  let bonusPct = 0;
  if (amount >= 10000) bonusPct = 20;
  else if (amount >= 5000) bonusPct = 15;
  else if (amount >= 1000) bonusPct = 10;
  bonusPct += u.bonusPercent || 0;
  const bonus = Math.round(amount * bonusPct / 100);
  u.balance += amount + bonus;
  u.bonusPercent = 0;
  res.json({ ok: true, bonus, user: userPublic(u) });
});
app.post('/api/open', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const c = CASES.find(x => x.id === req.body.caseId);
  if (!c) return res.json({ ok: false, error: 'Кейс не найден' });
  if (u.balance < c.price) return res.json({ ok: false, error: 'Недостаточно средств' });
  u.balance -= c.price;
  const item = rollCase(c);
  const spinId = nextId();
  let event = null;
  if (item.price >= STEAL_THRESHOLD) {
    event = createStealEvent(item, u);
  } else {
    u.inventory.push({ id: nextId(), item, ts: Date.now(), source: 'open' });
  }
  pendingSpins.set(spinId, { userId: u.id, item, eventId: event ? event.id : null, ts: Date.now() });
  u.stats.opened++;
  u.stats.wonTotal += item.price;
  if (u.spend.dayKey !== dayKey()) u.spend = { spent: 0, claimed: false, dayKey: dayKey() };
  u.spend.spent += c.price;
  stats.casesToday++;
  stats.winsToday += item.price;
  if (item.price > stats.topWin) stats.topWin = item.price;
  const drop = { id: nextId(), user: { id: u.id, name: u.name, color: u.color }, item, ts: Date.now(), eventId: event ? event.id : null };
  feed.unshift(drop);
  if (feed.length > 60) feed.pop();
  broadcast('drop', drop);
  res.json({ ok: true, user: userPublic(u), item, spinId, event });
});
app.post('/api/open/sell', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const ps = pendingSpins.get(req.body.spinId);
  if (!ps || ps.userId !== u.id) return res.json({ ok: false, error: 'Предмет не найден' });
  if (ps.eventId) {
    const ev = events.get(ps.eventId);
    if (ev && ev.status !== 'resolved') return res.json({ ok: false, error: 'Предмет под угрозой кражи! Дождись исхода битвы.' });
    if (ev && ev.outcome === 'stolen') return res.json({ ok: false, error: 'Предмет уже украден' });
  }
  pendingSpins.delete(req.body.spinId);
  const amount = Math.round(ps.item.price * 0.9);
  u.balance += amount;
  res.json({ ok: true, amount, user: userPublic(u) });
});
app.post('/api/steal', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const ev = events.get(req.body.eventId);
  if (!ev || ev.status !== 'active') return res.json({ ok: false, error: 'Уже поздно — предмет защищён' });
  if (ev.ownerId === u.id) return res.json({ ok: false, error: 'Нельзя украсть у самого себя' });
  if (u.balance < ev.commission) return res.json({ ok: false, error: 'Не хватает средств на комиссию' });
  u.balance -= ev.commission;
  ev.status = 'battle';
  const battle = {
    id: nextId(), eventId: ev.id, item: ev.item,
    owner: ev.owner,
    thief: { id: u.id, name: u.name, color: u.color },
    game: pick(['coin', 'dice', 'reaction']),
    commission: ev.commission,
    state: 'pending'
  };
  battles.set(battle.id, battle);
  ev.battleId = battle.id;
  broadcast('steal_battle', battle);
  res.json({ ok: true, battle, user: userPublic(u) });
});
app.post('/api/minigame/resolve', (req, res) => {
  const u = cookieUser(req);
  const b = battles.get(req.body.battleId);
  if (!b) return res.json({ ok: false, error: 'Битва не найдена' });
  const r = resolveBattle(b.id, req.body.data || {});
  if (!r) return res.json({ ok: false, error: 'Битва уже завершена' });
  const youWin = !!u && r.winnerId === u.id;
  const youAre = u ? (b.owner.id === u.id ? 'owner' : (b.thief.id === u.id ? 'thief' : null)) : null;
  res.json({
    ok: true,
    user: u ? userPublic(u) : null,
    result: {
      game: r.game, youWin, youAre,
      winner: r.winnerId, item: r.item, commission: r.commission, details: r.details
    }
  });
});
app.post('/api/promo/claim-spend', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  if (u.spend.dayKey !== dayKey()) u.spend = { spent: 0, claimed: false, dayKey: dayKey() };
  if (u.spend.claimed) return res.json({ ok: false, error: 'Бонус уже получен' });
  if (u.spend.spent < 1000) return res.json({ ok: false, error: 'Потрать 1000 ₽ на кейсы' });
  u.spend.claimed = true;
  u.balance += 500;
  res.json({ ok: true, reward: 500, user: userPublic(u) });
});
app.post('/api/rewards/claim', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const days = [50, 100, 150, 250, 400, 600, 1000];
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (u.rewards.lastClaimDate === dayKey()) return res.json({ ok: false, error: 'Награда уже получена сегодня' });
  u.rewards.streak = u.rewards.lastClaimDate === y ? (u.rewards.streak || 0) + 1 : 1;
  if (u.rewards.streak > 7) u.rewards.streak = 1;
  u.rewards.lastClaimDate = dayKey();
  const reward = days[u.rewards.streak - 1];
  u.balance += reward;
  res.json({ ok: true, reward, user: userPublic(u) });
});
app.post('/api/inventory/sell', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const idx = u.inventory.findIndex(x => x.id === req.body.itemId);
  if (idx < 0) return res.json({ ok: false, error: 'Предмет не найден' });
  const amount = Math.round(u.inventory[idx].item.price * 0.9);
  u.balance += amount;
  u.inventory.splice(idx, 1);
  res.json({ ok: true, amount, user: userPublic(u) });
});
app.post('/api/upgrade', (req, res) => {
  const u = cookieUser(req);
  if (!u) return res.status(401).json({ ok: false, error: 'Войди в аккаунт' });
  const itemId = req.body.itemId || null;
  const balanceAdd = Math.max(0, Math.round(Number(req.body.balance) || 0));
  let item = null, itemIdx = -1;
  if (itemId) {
    itemIdx = u.inventory.findIndex(x => x.id === itemId);
    if (itemIdx < 0) return res.json({ ok: false, error: 'Предмет не найден' });
    item = u.inventory[itemIdx].item;
  }
  const inputVal = (item ? item.price : 0) + balanceAdd;
  if (inputVal < 10) return res.json({ ok: false, error: 'Минимальная ставка — 10 ₽' });
  if (balanceAdd > u.balance) return res.json({ ok: false, error: 'Недостаточно средств' });
  const target = ALL_ITEMS.find(x => x.id === req.body.targetItemId);
  if (!target) return res.json({ ok: false, error: 'Цель не найдена' });
  if (target.price < inputVal * 1.05 || target.price > inputVal * 30) {
    return res.json({ ok: false, error: 'Цель вне допустимого диапазона' });
  }
  const chance = clamp(inputVal / (target.price * 1.06) * 0.98, 0.01, 0.97);
  const win = Math.random() < chance;
  
  if (itemIdx >= 0) u.inventory.splice(itemIdx, 1);
  if (balanceAdd > 0) u.balance -= balanceAdd;
  if (win) {
    u.inventory.push({ id: nextId(), item: target, ts: Date.now(), source: 'upgrade' });
  }
  u.stats.upgrades = (u.stats.upgrades || 0) + 1;
  res.json({ ok: true, win, chance: Math.round(chance * 100) / 100, inputVal, target, user: userPublic(u) });
});


app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': connected\n\n');
  clients.add(res);
  online = clients.size;
  pushStats();
  const hb = setInterval(() => res.write(': ping\n\n'), 20000);
  req.on('close', () => { clearInterval(hb); clients.delete(res); online = clients.size; pushStats(); });
});


app.listen(PORT, () => {
  console.log('✅ GGDROP (mint) запущен!');
  console.log('   http://localhost:' + PORT);
});
