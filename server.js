'use strict';

// Queue must be initialized in the web-server process (launch.js starts it as a child).
require('./scripts/steam-market-queue');

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

try {
  const localEnv = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const allowed = new Set(['STEAM_API_KEY', 'SESSION_SECRET', 'BRAND_NAME', 'TELEGRAM_URL', 'PORT', 'BASE_URL', 'ADMIN_STEAMIDS', 'SUPPORT_STEAMIDS', 'DB_DRIVER', 'DB_PATH', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'REDIS_ENABLED', 'REDIS_URL', 'RATE_LIMIT', 'RATE_WINDOW']);
  for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || !allowed.has(match[1]) || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch {}

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);
function normalizeBaseUrl(value, port) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return `http://localhost:${port}`;

  if (!/^https?:\/\//i.test(raw)) return `http://${raw}`;
  return raw;
}
const BASE_URL = normalizeBaseUrl(process.env.BASE_URL, PORT);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const BRAND_NAME = process.env.BRAND_NAME || 'КЕЙСЕР';
const TELEGRAM_URL = process.env.TELEGRAM_URL || 'https://t.me/';
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
try { fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); } catch {}


const RARITIES = {
  consumer:   { name: 'Ширпотреб',       color: '#b0c3d9', rank: 0 },
  industrial: { name: 'Промышленное',    color: '#5e98d9', rank: 1 },
  milspec:    { name: 'Армейское',        color: '#4b69ff', rank: 2 },
  restricted: { name: 'Запрещённое',     color: '#8847ff', rank: 3 },
  classified: { name: 'Засекреченное',   color: '#d32ce6', rank: 4 },
  covert:     { name: 'Тайное',           color: '#eb4b4b', rank: 5 },
  contraband: { name: 'Контрабандное',    color: '#e4ae39', rank: 6 }
};

function catalogItem(id, name, image, priceCents, rarity, wear = '') {
  const [weapon, skin = ''] = name.split(' | ');
  return {
    catalogId: id,
    id,
    name,
    weapon,
    skin,
    marketName: skin,
    wear,
    icon: `/static/items/${image}.png`,
    priceCents,
    rarity: RARITIES[rarity].name,
    rarityKey: rarity,
    rarityColor: RARITIES[rarity].color,
    rarityRank: RARITIES[rarity].rank
  };
}

const STATIC_CATALOG = [
  catalogItem('p250-sand-dune', 'P250 | Sand Dune', 'p250-sand-dune', 3500, 'consumer', 'FN'),
  catalogItem('awp-safari-mesh', 'AWP | Safari Mesh', 'awp-safari-mesh', 8900, 'industrial', 'BS'),
  catalogItem('mp7-cirrus', 'MP7 | Cirrus', 'mp7-cirrus', 14600, 'milspec', 'MW'),
  catalogItem('ak47-elite-build', 'AK-47 | Elite Build', 'ak47-elite-build', 22500, 'milspec', 'FT'),
  catalogItem('awp-worm-god', 'AWP | Worm God', 'awp-worm-god', 38900, 'restricted', 'WW'),
  catalogItem('ak47-slate', 'AK-47 | Slate', 'ak47-slate', 64900, 'restricted', 'FT'),
  catalogItem('usp-cortex', 'USP-S | Cortex', 'usp-cortex', 125000, 'classified', 'MW'),
  catalogItem('glock-vogue', 'Glock-18 | Vogue', 'glock-vogue', 185000, 'classified', 'FN'),
  catalogItem('mac10-disco-tech', 'MAC-10 | Disco Tech', 'mac10-disco-tech', 230000, 'classified', 'FT'),
  catalogItem('m4a1-hyper-beast', 'M4A1-S | Hyper Beast', 'm4a1-hyper-beast', 420000, 'covert', 'MW'),
  catalogItem('ak47-neon-rider', 'AK-47 | Neon Rider', 'ak47-neon-rider', 650000, 'covert', 'FN'),
  catalogItem('awp-asiimov', 'AWP | Asiimov', 'awp-asiimov', 980000, 'covert', 'FT'),
  catalogItem('deagle-printstream', 'Desert Eagle | Printstream', 'deagle-printstream', 1350000, 'covert', 'FN'),
  catalogItem('ak47-wild-lotus', 'AK-47 | Wild Lotus', 'ak47-wild-lotus', 9500000, 'covert', 'FN'),
  catalogItem('m4a4-howl', 'M4A4 | Howl', 'm4a4-howl', 35000000, 'contraband', 'FT'),
catalogItem('ak47-redline', 'AK-47 | Redline', 'ak47-redline', 105000, 'restricted', 'MW'),
  catalogItem('ak47-frontside-misty', 'AK-47 | Frontside Misty', 'ak47-frontside-misty', 98000, 'restricted', 'FT'),
  catalogItem('ak47-aquamarine-revenge', 'AK-47 | Aquamarine Revenge', 'ak47-aquamarine-revenge', 620000, 'covert', 'MW'),
  catalogItem('ak47-neon-revolution', 'AK-47 | Neon Revolution', 'ak47-neon-revolution', 550000, 'covert', 'FT'),
  catalogItem('ak47-bloodsport', 'AK-47 | Bloodsport', 'ak47-bloodsport', 890000, 'covert', 'FN'),
  catalogItem('ak47-vulcan', 'AK-47 | Vulcan', 'ak47-vulcan', 1150000, 'covert', 'FN'),
  catalogItem('ak47-wasteland-rebel', 'AK-47 | Wasteland Rebel', 'ak47-wasteland-rebel', 72000, 'restricted', 'FT'),
  catalogItem('m4a4-dragon-king', 'M4A4 | 龍王 (Dragon King)', 'm4a4-dragon-king', 76000, 'restricted', 'MW'),
  catalogItem('m4a4-royal-paladin', 'M4A4 | Royal Paladin', 'm4a4-royal-paladin', 168000, 'classified', 'FN'),
  catalogItem('m4a4-the-emperor', 'M4A4 | The Emperor', 'm4a4-the-emperor', 740000, 'covert', 'MW'),
  catalogItem('m4a4-desolate-space', 'M4A4 | Desolate Space', 'm4a4-desolate-space', 155000, 'classified', 'FT'),
  catalogItem('m4a4-neo-noir', 'M4A4 | Neo-Noir', 'm4a4-neo-noir', 830000, 'covert', 'FN'),
  catalogItem('m4a1-golden-coil', 'M4A1-S | Golden Coil', 'm4a1-golden-coil', 680000, 'covert', 'MW'),
  catalogItem('m4a1-chanticos-fire', "M4A1-S | Chantico's Fire", 'm4a1-chanticos-fire', 640000, 'covert', 'FT'),
  catalogItem('m4a1-mecha-industries', 'M4A1-S | Mecha Industries', 'm4a1-mecha-industries', 178000, 'classified', 'FN'),
  catalogItem('m4a1-briefing', 'M4A1-S | Briefing', 'm4a1-briefing', 149000, 'classified', 'MW'),
  catalogItem('m4a1-decimator', 'M4A1-S | Decimator', 'm4a1-decimator', 92000, 'restricted', 'FT'),
  catalogItem('awp-dragon-lore', 'AWP | Dragon Lore', 'awp-dragon-lore', 8500000, 'contraband', 'FT'),
  catalogItem('awp-medusa', 'AWP | Medusa', 'awp-medusa', 6200000, 'contraband', 'WW'),
  catalogItem('awp-lightning-strike', 'AWP | Lightning Strike', 'awp-lightning-strike', 980000, 'covert', 'FN'),
  catalogItem('awp-graphite', 'AWP | Graphite', 'awp-graphite', 210000, 'classified', 'MW'),
  catalogItem('awp-redline', 'AWP | Redline', 'awp-redline', 118000, 'restricted', 'MW'),
  catalogItem('awp-hyper-beast', 'AWP | Hyper Beast', 'awp-hyper-beast', 760000, 'covert', 'FT'),
  catalogItem('awp-fever-dream', 'AWP | Fever Dream', 'awp-fever-dream', 108000, 'restricted', 'MW'),
  catalogItem('awp-mortis', 'AWP | Mortis', 'awp-mortis', 640000, 'covert', 'MW'),
  catalogItem('awp-atheris', 'AWP | Atheris', 'awp-atheris', 95000, 'restricted', 'FT'),
  catalogItem('awp-neo-noir', 'AWP | Neo-Noir', 'awp-neo-noir', 880000, 'covert', 'MW'),
  catalogItem('famas-roll-cage', 'FAMAS | Roll Cage', 'famas-roll-cage', 132000, 'classified', 'MW'),
  catalogItem('famas-commemoration', 'FAMAS | Commemoration', 'famas-commemoration', 480000, 'covert', 'MW'),
  catalogItem('famas-neural-net', 'FAMAS | Neural Net', 'famas-neural-net', 56000, 'restricted', 'MW'),
  catalogItem('famas-afterimage', 'FAMAS | Afterimage', 'famas-afterimage', 62000, 'restricted', 'FT'),
  catalogItem('galil-eco', 'Galil AR | Eco', 'galil-eco', 28000, 'milspec', 'FN'),
  catalogItem('galil-rocket-pop', 'Galil AR | Rocket Pop', 'galil-rocket-pop', 66000, 'restricted', 'FT'),
  catalogItem('galil-chatterbox', 'Galil AR | Chatterbox', 'galil-chatterbox', 350000, 'covert', 'FN'),
  catalogItem('galil-sugar-rush', 'Galil AR | Sugar Rush', 'galil-sugar-rush', 61000, 'restricted', 'MW'),
  catalogItem('aug-chameleon', 'AUG | Chameleon', 'aug-chameleon', 27000, 'milspec', 'FN'),
  catalogItem('aug-bengal-tiger', 'AUG | Bengal Tiger', 'aug-bengal-tiger', 54000, 'restricted', 'MW'),
  catalogItem('aug-syd-mead', 'AUG | Syd Mead', 'aug-syd-mead', 420000, 'covert', 'MW'),
  catalogItem('aug-ricochet', 'AUG | Ricochet', 'aug-ricochet', 29000, 'milspec', 'FN'),
  catalogItem('ssg-dragonfire', 'SSG 08 | Dragonfire', 'ssg-dragonfire', 520000, 'covert', 'FN'),
  catalogItem('ssg-blood-in-the-water', 'SSG 08 | Blood in the Water', 'ssg-blood-in-the-water', 195000, 'classified', 'MW'),
  catalogItem('ssg-death-strike', 'SSG 08 | Death Strike', 'ssg-death-strike', 75000, 'restricted', 'FT'),
  catalogItem('ssg-detour', 'SSG 08 | Detour', 'ssg-detour', 24000, 'milspec', 'FN'),
  catalogItem('p90-death-by-kitty', 'P90 | Death by Kitty', 'p90-death-by-kitty', 470000, 'covert', 'MW'),
  catalogItem('p90-asiimov', 'P90 | Asiimov', 'p90-asiimov', 450000, 'covert', 'FT'),
  catalogItem('p90-emerald-dragon', 'P90 | Emerald Dragon', 'p90-emerald-dragon', 158000, 'classified', 'FN'),
  catalogItem('p90-shallow-grave', 'P90 | Shallow Grave', 'p90-shallow-grave', 144000, 'classified', 'MW'),
  catalogItem('p90-neoqueen', 'P90 | Neoqueen', 'p90-neoqueen', 82000, 'restricted', 'FT'),
  catalogItem('mp7-bloodsport', 'MP7 | Bloodsport', 'mp7-bloodsport', 166000, 'classified', 'FN'),
  catalogItem('mp7-nemesis', 'MP7 | Nemesis', 'mp7-nemesis', 78000, 'restricted', 'MW'),
  catalogItem('mp7-neon-ply', 'MP7 | Neon Ply', 'mp7-neon-ply', 32000, 'milspec', 'FN'),
  catalogItem('mp7-special-delivery', 'MP7 | Special Delivery', 'mp7-special-delivery', 74000, 'restricted', 'FT'),
  catalogItem('mp9-hot-rod', 'MP9 | Hot Rod', 'mp9-hot-rod', 140000, 'classified', 'FN'),
  catalogItem('mp9-bioleak', 'MP9 | Bioleak', 'mp9-bioleak', 35000, 'milspec', 'FN'),
  catalogItem('mp9-ruby-poison-dart', 'MP9 | Ruby Poison Dart', 'mp9-ruby-poison-dart', 70000, 'restricted', 'MW'),
  catalogItem('mp9-starlight-protector', 'MP9 | Starlight Protector', 'mp9-starlight-protector', 138000, 'classified', 'FN'),
  catalogItem('ump-primal-saber', 'UMP-45 | Primal Saber', 'ump-primal-saber', 380000, 'covert', 'MW'),
  catalogItem('ump-momentum', 'UMP-45 | Momentum', 'ump-momentum', 63000, 'restricted', 'FT'),
  catalogItem('ump-metal-flowers', 'UMP-45 | Metal Flowers', 'ump-metal-flowers', 33000, 'milspec', 'FN'),
  catalogItem('ump-crime-scene', 'UMP-45 | Crime Scene', 'ump-crime-scene', 59000, 'restricted', 'WW'),
  catalogItem('mac10-stalker', 'MAC-10 | Stalker', 'mac10-stalker', 34000, 'milspec', 'FN'),
  catalogItem('mac10-whitefish', 'MAC-10 | Whitefish', 'mac10-whitefish', 65000, 'restricted', 'MW'),
  catalogItem('mac10-toybox', 'MAC-10 | Toybox', 'mac10-toybox', 67000, 'restricted', 'FT'),
  catalogItem('mac10-pipe-down', 'MAC-10 | Pipe Down', 'mac10-pipe-down', 30000, 'milspec', 'FN'),
  catalogItem('mp5-phosphor', 'MP5-SD | Phosphor', 'mp5-phosphor', 86000, 'restricted', 'MW'),
  catalogItem('mp5-agent', 'MP5-SD | Agent', 'mp5-agent', 148000, 'classified', 'MW'),
  catalogItem('mp5-gauss', 'MP5-SD | Gauss', 'mp5-gauss', 29000, 'milspec', 'FN'),
  catalogItem('mp5-oxide-oasis', 'MP5-SD | Oxide Oasis', 'mp5-oxide-oasis', 79000, 'restricted', 'FT'),
  catalogItem('p250-see-ya-later', 'P250 | See Ya Later', 'p250-see-ya-later', 87000, 'restricted', 'MW'),
  catalogItem('p250-asiimov', 'P250 | Asiimov', 'p250-asiimov', 186000, 'classified', 'FN'),
  catalogItem('p250-vino-primo', 'P250 | Vino Primo', 'p250-vino-primo', 30000, 'milspec', 'FN'),
  catalogItem('p250-nevermore', 'P250 | Nevermore', 'p250-nevermore', 28000, 'milspec', 'MW'),
  catalogItem('glock-fade', 'Glock-18 | Fade', 'glock-fade', 780000, 'covert', 'FN'),
  catalogItem('glock-dragon-tattoo', 'Glock-18 | Dragon Tattoo', 'glock-dragon-tattoo', 165000, 'classified', 'MW'),
  catalogItem('glock-water-elemental', 'Glock-18 | Water Elemental', 'glock-water-elemental', 158000, 'classified', 'FN'),
  catalogItem('glock-moonrise', 'Glock-18 | Moonrise', 'glock-moonrise', 69000, 'restricted', 'FT'),
  catalogItem('glock-neo-noir', 'Glock-18 | Neo-Noir', 'glock-neo-noir', 33000, 'milspec', 'FN'),
  catalogItem('usp-kill-confirmed', 'USP-S | Kill Confirmed', 'usp-kill-confirmed', 990000, 'covert', 'FN'),
  catalogItem('usp-neo-noir', 'USP-S | Neo-Noir', 'usp-neo-noir', 720000, 'covert', 'MW'),
  catalogItem('usp-cyrex', 'USP-S | Cyrex', 'usp-cyrex', 170000, 'classified', 'FN'),
  catalogItem('usp-orion', 'USP-S | Orion', 'usp-orion', 162000, 'classified', 'MW'),
  catalogItem('usp-blueprint', 'USP-S | Blueprint', 'usp-blueprint', 37000, 'milspec', 'FN'),
  catalogItem('deagle-blaze', 'Desert Eagle | Blaze', 'deagle-blaze', 240000, 'classified', 'FN'),
  catalogItem('deagle-code-red', 'Desert Eagle | Code Red', 'deagle-code-red', 210000, 'classified', 'FN'),
  catalogItem('deagle-kumicho-dragon', 'Desert Eagle | Kumicho Dragon', 'deagle-kumicho-dragon', 460000, 'covert', 'MW'),
  catalogItem('deagle-directive', 'Desert Eagle | Directive', 'deagle-directive', 94000, 'restricted', 'FT'),
  catalogItem('deagle-oxide-blaze', 'Desert Eagle | Oxide Blaze', 'deagle-oxide-blaze', 39000, 'milspec', 'FN'),
  catalogItem('tec9-fuel-injector', 'Tec-9 | Fuel Injector', 'tec9-fuel-injector', 340000, 'covert', 'MW'),
  catalogItem('tec9-avalanche', 'Tec-9 | Avalanche', 'tec9-avalanche', 88000, 'restricted', 'MW'),
  catalogItem('tec9-re-entry', 'Tec-9 | Re-Entry', 'tec9-re-entry', 40000, 'milspec', 'FN'),
  catalogItem('tec9-ice-cap', 'Tec-9 | Ice Cap', 'tec9-ice-cap', 85000, 'restricted', 'FT'),
  catalogItem('fiveseven-hyper-beast', 'Five-SeveN | Hyper Beast', 'fiveseven-hyper-beast', 560000, 'covert', 'MW'),
  catalogItem('fiveseven-monkey-business', 'Five-SeveN | Monkey Business', 'fiveseven-monkey-business', 176000, 'classified', 'FN'),
  catalogItem('fiveseven-flame-test', 'Five-SeveN | Flame Test', 'fiveseven-flame-test', 90000, 'restricted', 'MW'),
  catalogItem('fiveseven-boost-protocol', 'Five-SeveN | Boost Protocol', 'fiveseven-boost-protocol', 39000, 'milspec', 'FN'),
  catalogItem('duals-melondrama', 'Dual Berettas | Melondrama', 'duals-melondrama', 31000, 'milspec', 'FN'),
  catalogItem('duals-dezastre', 'Dual Berettas | Dezastre', 'duals-dezastre', 68000, 'restricted', 'MW'),
  catalogItem('duals-marina', 'Dual Berettas | Marina', 'duals-marina', 5400, 'consumer', 'FT'),
  catalogItem('nova-hyper-beast', 'Nova | Hyper Beast', 'nova-hyper-beast', 320000, 'covert', 'MW'),
  catalogItem('nova-antique', 'Nova | Antique', 'nova-antique', 122000, 'classified', 'MW'),
  catalogItem('nova-toy-soldier', 'Nova | Toy Soldier', 'nova-toy-soldier', 62000, 'restricted', 'FT'),
  catalogItem('xm1014-zombie-offensive', 'XM1014 | Zombie Offensive', 'xm1014-zombie-offensive', 66000, 'restricted', 'MW'),
  catalogItem('xm1014-red-python', 'XM1014 | Red Python', 'xm1014-red-python', 26000, 'milspec', 'FN'),
  catalogItem('xm1014-seasons', 'XM1014 | Seasons', 'xm1014-seasons', 63000, 'restricted', 'FT'),
  catalogItem('mag7-justice', 'MAG-7 | Justice', 'mag7-justice', 118000, 'classified', 'MW'),
  catalogItem('mag7-bulldozer', 'MAG-7 | Bulldozer', 'mag7-bulldozer', 64000, 'restricted', 'FN'),
  catalogItem('mag7-heat', 'MAG-7 | Heat', 'mag7-heat', 24000, 'milspec', 'FN'),
  catalogItem('sawed-the-kraken', 'Sawed-Off | The Kraken', 'sawed-the-kraken', 300000, 'covert', 'MW'),
  catalogItem('sawed-wasteland-princess', 'Sawed-Off | Wasteland Princess', 'sawed-wasteland-princess', 116000, 'classified', 'MW'),
  catalogItem('sawed-yorick', 'Sawed-Off | Yorick', 'sawed-yorick', 60000, 'restricted', 'FT'),
  catalogItem('m249-nebula-crusader', 'M249 | Nebula Crusader', 'm249-nebula-crusader', 310000, 'covert', 'MW'),
  catalogItem('m249-magma', 'M249 | Magma', 'm249-magma', 114000, 'classified', 'MW'),
  catalogItem('m249-emerald-poison-dart', 'M249 | Emerald Poison Dart', 'm249-emerald-poison-dart', 24000, 'milspec', 'FN'),
  catalogItem('negev-ultralight', 'Negev | Ultralight', 'negev-ultralight', 112000, 'classified', 'FN'),
  catalogItem('negev-lionfish', 'Negev | Lionfish', 'negev-lionfish', 57000, 'restricted', 'MW'),
  catalogItem('negev-power-loader', 'Negev | Power Loader', 'negev-power-loader', 23000, 'milspec', 'FN'),
  catalogItem('scar-bloodsport', 'SCAR-20 | Bloodsport', 'scar-bloodsport', 128000, 'classified', 'FN'),
  catalogItem('scar-cardiac', 'SCAR-20 | Cardiac', 'scar-cardiac', 66000, 'restricted', 'MW'),
  catalogItem('scar-emerald', 'SCAR-20 | Emerald', 'scar-emerald', 25000, 'milspec', 'FN'),
  catalogItem('g3-executioner', 'G3SG1 | The Executioner', 'g3-executioner', 126000, 'classified', 'MW'),
  catalogItem('g3-murky', 'G3SG1 | Murky', 'g3-murky', 64000, 'restricted', 'WW'),
  catalogItem('g3-flux', 'G3SG1 | Flux', 'g3-flux', 8500, 'industrial', 'FT'),
  catalogItem('karambit-fade', '★ Karambit | Fade', 'karambit-fade', 6200000, 'contraband', 'FN'),
  catalogItem('karambit-doppler', '★ Karambit | Doppler', 'karambit-doppler', 4800000, 'contraband', 'MW'),
  catalogItem('bayonet-marble-fade', '★ Bayonet | Marble Fade', 'bayonet-marble-fade', 4100000, 'contraband', 'FN'),
  catalogItem('butterfly-slaughter', '★ Butterfly Knife | Slaughter', 'butterfly-slaughter', 5600000, 'contraband', 'MW'),
  catalogItem('flip-doppler', '★ Flip Knife | Doppler', 'flip-doppler', 2600000, 'contraband', 'FN'),
  catalogItem('gut-tiger-tooth', '★ Gut Knife | Tiger Tooth', 'gut-tiger-tooth', 1500000, 'contraband', 'FN'),
  catalogItem('falchion-case-hardened', '★ Falchion Knife | Case Hardened', 'falchion-case-hardened', 1200000, 'contraband', 'WW'),
  catalogItem('karambit-crimson-web', '★ Karambit | Crimson Web', 'karambit-crimson-web', 1900000, 'covert', 'FT'),
];
let CATALOG_BY_ID = new Map(STATIC_CATALOG.map(item => [item.catalogId, item]));

let CATALOG = STATIC_CATALOG.slice();

const RARITY_KEY_BY_NAME = {
  'Consumer Grade': 'consumer',
  'Industrial Grade': 'industrial',
  'Mil-Spec Grade': 'milspec',
  'Restricted': 'restricted',
  'Classified': 'classified',
  'Covert': 'covert',
  'Extraordinary': 'covert',
  'Contraband': 'contraband'
};

let STEAM_SKINS_PROMISE = null;
function fetchSteamSkins() {
  if (STEAM_SKINS_PROMISE) return STEAM_SKINS_PROMISE;
  STEAM_SKINS_PROMISE = (async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
        { signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined }
      );
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const skins = await response.json();
      console.log(`[skins] Каталог скинов Steam загружен: ${Array.isArray(skins) ? skins.length : 0}`);
      return Array.isArray(skins) ? skins : [];
    } catch (error) {
      console.warn('[skins] Каталог Steam недоступен:', error.message);
      STEAM_SKINS_PROMISE = null;
      return [];
    }
  })();
  return STEAM_SKINS_PROMISE;
}

function steamKey(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  const parts = raw.split('|');
  const weapon = parts.shift() || '';
  const skin = parts.join('|') || '';
  const w = String(weapon).toLowerCase().replace(/★/g, ' ').replace(/knife/g, ' ').replace(/[^a-z0-9]+/g, '');
  const s = String(skin).toLowerCase().replace(/[^a-z0-9]+/g, '');
  return w ? `${w}|${s}` : '';
}

async function loadSteamSkinMap() {
  const skins = await fetchSteamSkins();
  const map = new Map();
  for (const skin of skins) {
    if (!skin || !skin.image) continue;
    const key = steamKey(skin.name);
    if (key && !map.has(key)) map.set(key, skin.image);
  }
  return map;
}

let STEAM_SKIN_MAP_PROMISE = null;
function steamSkinMap() {
  if (!STEAM_SKIN_MAP_PROMISE) STEAM_SKIN_MAP_PROMISE = loadSteamSkinMap();
  return STEAM_SKIN_MAP_PROMISE;
}

function steamIconFor(name) {
  const map = STEAM_SKIN_MAP;
  return map ? map.get(steamKey(name)) || '' : '';
}
let STEAM_SKIN_MAP = null;
steamSkinMap().then(map => { STEAM_SKIN_MAP = map; }).catch(() => {});

function withSteamIcon(item) {
  if (!item || typeof item !== 'object') return item;
  const local = item.localIcon || item.icon || '';
  const steam = item.icon && String(item.icon).startsWith('http') ? item.icon : steamIconFor(item.name || item.itemName);
  return { ...item, localIcon: local, icon: steam || local };
}

function slugId(name) {
  const slug = String(name || '').toLowerCase().replace(/★/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'item-' + Math.random().toString(36).slice(2,8);
}

let PRICE_LOADING = false;
let PRICE_PROGRESS = { total: 0, done: 0, ok: 0 };
const PRICE_SPEED_HISTORY = [];
const WEAR_FULL = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred'
};
const WEAR_SHORT = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS'
};

const ESTIMATED_BY_RARITY = {
  consumer: 3500,
  industrial: 12000,
  milspec: 30000,
  restricted: 90000,
  classified: 250000,
  covert: 750000,
  contraband: 5000000
};
function estimatePriceByRarity(rarityKey) {
  const base = ESTIMATED_BY_RARITY[rarityKey] || 30000;
  const jitter = 0.7 + Math.random() * 0.6;
  return Math.max(100, Math.round(base * jitter));
}
function getMarketNamesForItem(item) {
  const baseName = String(item.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (!baseName) return [];
  const exactWear = item.wear ? String(item.wear).toUpperCase() : '';
  const wearsOrder = exactWear ? [exactWear, 'FT','MW','FN','WW','BS'].filter((v,i,a)=>a.indexOf(v)===i) : ['FT','MW','FN','WW','BS'];
  return wearsOrder.map(w => {
    const suffix = WEAR_FULL[w] ? ' (' + WEAR_FULL[w] + ')' : '';
    return baseName + suffix;
  });
}
function uniqueSlug(base, used) {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(base + '-' + i)) i++;
  return base + '-' + i;
}

function wearSuffix(wear) {
  if (!wear) return '';
  if (WEAR_FULL[wear]) return ` (${WEAR_FULL[wear]})`;
  if (WEAR_SHORT[wear]) return ` (${wear})`;
  return '';
}
function steamMarketName(name, wear) {
  const base = String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return `${base}${wearSuffix(wear)}`;
}
function parseRubles(s) {
  if (!s) return 0;
  let cleaned = String(s).replace(/\u00a0/g, ' ').trim();
  if (/,\d{1,2}\s*(pуб|руб|RUB)?/i.test(cleaned) && cleaned.includes(',')) {
    cleaned = cleaned.replace(/[^\d,]/g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/[^\d.]/g, '');
  }
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
}
const STEAM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://steamcommunity.com/market/'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function recordPriceHistory(marketHashName, price, source) {
  if (!price) return;
  try {
    const previous = db.prepare('SELECT price FROM steam_price_history WHERE market_hash_name=? ORDER BY id DESC LIMIT 1').get(marketHashName);
    if (previous && Number(previous.price) === Number(price)) return;
    const changePercent = previous?.price ? (Number(price) - Number(previous.price)) / Number(previous.price) * 100 : 0;
    db.prepare('INSERT INTO steam_price_history(market_hash_name,price,source,change_percent,created_at) VALUES(?,?,?,?,?)')
      .run(marketHashName, price, source, changePercent, Date.now());
    const threshold = Math.max(5, Number(settingGetRaw('price_alert_percent','35')) || 35);
    if (previous && Math.abs(changePercent) >= threshold) {
      const title = 'Резкое изменение цены';
      const body = `${marketHashName}: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
      const result = db.prepare(`INSERT INTO notifications(title,body,kind,audience,created_at,expires_at,sent_at) VALUES(?,?,?,?,?,?,?)`)
        .run(title, body, 'price_alert', 'staff', Date.now(), Date.now()+24*3600000, Date.now());
      broadcast('notify', { id:Number(result.lastInsertRowid), title, body, audience:'staff', createdAt:Date.now() });
    }
  } catch (_) {}
}

let skinportCache = { at:0, map:new Map() };
let skinportPromise = null;
async function loadSkinportPrices() {
  if (Date.now() - skinportCache.at < 15 * 60_000 && skinportCache.map.size) return skinportCache.map;
  if (skinportPromise) return skinportPromise;
  skinportPromise = (async () => {
    try {
      const response = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=RUB&tradable=0', { headers:{'Accept-Encoding':'br,gzip,deflate','User-Agent':STEAM_HEADERS['User-Agent']}, signal:AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Skinport HTTP ${response.status}`);
      const rows = await response.json();
      const map = new Map();
      for (const row of Array.isArray(rows) ? rows : []) {
        const value = Number(row.min_price || row.suggested_price || 0);
        if (row.market_hash_name && value > 0) map.set(String(row.market_hash_name), Math.round(value * 100));
      }
      skinportCache = { at:Date.now(), map };
      return map;
    } catch (error) {
      console.warn('[skinport]', error.message);
      return skinportCache.map;
    } finally { skinportPromise = null; }
  })();
  return skinportPromise;
}
async function fetchSkinportPrice(marketHashName) {
  const map = await loadSkinportPrices();
  const price = Number(map.get(marketHashName) || 0);
  if (price > 0) {
    try {
      db.prepare(`INSERT INTO steam_prices(market_hash_name,lowest_price,median_price,volume,currency,source,updated_at) VALUES(?,?,?,0,'RUB','skinport',?)
        ON CONFLICT(market_hash_name) DO UPDATE SET lowest_price=excluded.lowest_price,median_price=excluded.median_price,source='skinport',updated_at=excluded.updated_at`)
        .run(marketHashName, price, price, Date.now());
      recordPriceHistory(marketHashName, price, 'skinport');
    } catch (_) {}
  }
  return price;
}

async function fetchSteamPriceRaw(marketHashName) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=5&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await fetch(url, { headers: STEAM_HEADERS, signal: AbortSignal.timeout(15000) });
    if (res.status === 429) return { __rateLimited: true };
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

let rateLimitedUntil = 0;
async function waitForRateLimit() {
  const now = Date.now();
  if (now < rateLimitedUntil) await sleep(rateLimitedUntil - now);
}
async function fetchSteamPriceSingle(marketHashName) {
  if (!marketHashName) return 0;
  await waitForRateLimit();
  try {
    const data = await fetchSteamPriceRaw(marketHashName);
    if (data && data.__rateLimited) {
      rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + 30000);
      return 0;
    }
    if (data && data.success) {
      const lowest = parseRubles(data.lowest_price);
      const median = parseRubles(data.median_price);
      const volume = parseInt(String(data.volume || '0').replace(/[^\d]/g, ''), 10) || 0;
      const price = lowest || median;
      if (price > 0) {
        try {
          db.prepare(`INSERT INTO steam_prices(market_hash_name, lowest_price, median_price, volume, currency, source, updated_at)
          VALUES (?, ?, ?, ?, 'RUB', 'steam', ?)
          ON CONFLICT(market_hash_name) DO UPDATE SET lowest_price=excluded.lowest_price,
            median_price=excluded.median_price, volume=excluded.volume, updated_at=excluded.updated_at`)
          .run(marketHashName, lowest, median, volume, Date.now());
        } catch {}
        recordPriceHistory(marketHashName, price, 'steam');
        return price;
      }
      try {
        db.prepare(`INSERT INTO steam_prices(market_hash_name, lowest_price, median_price, volume, currency, source, updated_at)
        VALUES (?, 0, 0, 0, 'RUB', 'steam', ?)
        ON CONFLICT(market_hash_name) DO UPDATE SET updated_at=excluded.updated_at`).run(marketHashName, Date.now());
      } catch {}
      return 0;
    }
    if (data && data.success === false) {
      try {
        db.prepare(`INSERT INTO steam_prices(market_hash_name, lowest_price, median_price, volume, currency, source, updated_at)
        VALUES (?, 0, 0, 0, 'RUB', 'steam', ?)
        ON CONFLICT(market_hash_name) DO UPDATE SET updated_at=excluded.updated_at`).run(marketHashName, Date.now());
      } catch {}
    }
  } catch (e) {}
  return 0;
}
async function fetchPriceForItem(item) {
  const names = getMarketNamesForItem(item);
  const source = settingGetRaw('price_source','auto');
  for (const marketName of names) {
    if (source === 'skinport') {
      const price = await fetchSkinportPrice(marketName); if (price > 0) return price;
    } else {
      if (source === 'auto' && Date.now() < rateLimitedUntil) { const fallback = await fetchSkinportPrice(marketName); if (fallback > 0) return fallback; }
      const steamPrice = await fetchSteamPriceSingle(marketName); if (steamPrice > 0) return steamPrice;
      if (source === 'auto') { const fallback = await fetchSkinportPrice(marketName); if (fallback > 0) return fallback; }
    }
  }
  return 0;
}
async function fetchSteamPrice(marketHashName) {
  if (!marketHashName) return 0;
  return await fetchSteamPriceSingle(marketHashName);
}
function cachedSteamPrice(marketHashName, maxAgeMs = 7 * 24 * 3600 * 1000) {
  try {
    const row = db.prepare('SELECT lowest_price, median_price, updated_at FROM steam_prices WHERE market_hash_name = ?').get(marketHashName);
    if (!row) return { hit: false, price: 0 };
    if (maxAgeMs > 0 && Date.now() - Number(row.updated_at) > maxAgeMs) {
      const price = Number(row.lowest_price) || Number(row.median_price) || 0;
      return { hit: false, price, stale: true, zero: !price };
    }
    return { hit: true, price: Number(row.lowest_price) || Number(row.median_price) || 0, zero: !row.lowest_price && !row.median_price };
  } catch {
    return { hit: false, price: 0 };
  }
}
function cachedPriceForItem(item) {
  const names = getMarketNamesForItem(item);
  for (const mn of names) {
    const c = cachedSteamPrice(mn);
    if (c.hit && c.price) return c;
  }
  for (const mn of names) {
    const c = cachedSteamPrice(mn, 0);
    if (c.price) return { hit: true, price: c.price, stale: true };
  }
  return { hit: false, price: 0 };
}


async function runPool(tasks, concurrency, onResult) {
  const results = new Array(tasks.length);
  let idx = 0;
  let done = 0;
  let ok = 0;
  const actualConcurrency = Math.max(1, Math.min(concurrency, tasks.length));
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
        if (results[i]) ok++;
        if (onResult) onResult({ i, value: results[i], done: ++done, ok });
      } catch (e) {
        results[i] = 0;
        if (onResult) onResult({ i, value: 0, done: ++done, ok });
      }
      await sleep(50);
    }
  }
  await Promise.all(Array.from({ length: actualConcurrency }, worker));
  return { results, ok };
}


function lookupPriceSync(name, wear) {
  const fake = { name, wear };
  return cachedPriceForItem(fake).price || cachedSteamPrice(steamMarketName(name, wear)).price;
}

function dynamicCatalogItem(skin, priceCents, forcedId) {
  const [weapon, skinName = ''] = String(skin.name || '').split('|');
  const rarityKey = RARITY_KEY_BY_NAME[skin.rarity && skin.rarity.name] || 'milspec';
  const R = RARITIES[rarityKey] || RARITIES.milspec;
  const id = forcedId || slugId(skin.name);
  const finalPrice = priceCents > 0 ? priceCents : estimatePriceByRarity(rarityKey);
  return {
    catalogId: id,
    id,
    name: skin.name,
    weapon: String(weapon).trim(),
    skin: String(skinName).trim(),
    marketName: String(skinName).trim(),
    wear: '',
    icon: skin.image || '',
    localIcon: '',
    priceCents: finalPrice,
    rarity: R.name,
    rarityKey,
    rarityColor: R.color,
    rarityRank: R.rank,
    _isEstimated: !priceCents
  };
}

async function buildFullCatalog() {
  const skins = await fetchSteamSkins();
  const staticNames = new Set(STATIC_CATALOG.map(item => item.name));
  const usedIds = new Set(CATALOG_BY_ID.keys());
  const dynamic = [];
  for (const item of STATIC_CATALOG) {
    const cp = cachedPriceForItem(item);
    if (cp.hit && cp.price) {
      item.priceCents = cp.price;
      item._isEstimated = false;
    } else {
      if (!item.priceCents) item.priceCents = estimatePriceByRarity(item.rarityKey);
    }
  }
  for (const skin of skins) {
    if (!skin || !skin.name) continue;
    if (staticNames.has(skin.name)) continue;
    const baseId = slugId(skin.name);
    const id = uniqueSlug(baseId, usedIds);
    usedIds.add(id);
    const fakeItem = { name: skin.name, wear: '' };
    const cp = cachedPriceForItem(fakeItem);
    const priceCents = cp.hit && cp.price ? cp.price : 0;
    dynamic.push(dynamicCatalogItem({ ...skin, name: skin.name }, priceCents, id));
  }
  CATALOG = [...STATIC_CATALOG, ...dynamic];
  CATALOG_BY_ID = new Map(CATALOG.map(item => [item.catalogId, item]));
  try { cache.del('catalog:public'); } catch {}
  const withPrice = CATALOG.filter(i => i.priceCents > 0).length;
  const estimated = CATALOG.filter(i => i._isEstimated).length;
  console.log(`[catalog] Предметов: ${CATALOG.length} (статичных ${STATIC_CATALOG.length}, динамических ${dynamic.length}); с ценой: ${withPrice} (оценочных ${estimated})`);
  setTimeout(async () => {
    try {
      const priceQueue = global.__priceQueue;
      const proxyCount = priceQueue?.stats?.().proxies || 0;
      if (proxyCount > 0 && priceQueue.validateCurrentProxies) {
        console.log(`[prices] Проверяю ${proxyCount} прокси перед загрузкой цен…`);
        const proxyConfig = getPriceManagerConfig();
        const checked = await priceQueue.validateCurrentProxies({ concurrency: proxyConfig.workers, timeoutMs: proxyConfig.timeoutMs, persist: true });
        if (!checked.working) {
          console.warn('[prices] Рабочих прокси не найдено — автоматическая полная загрузка цен пропущена. Добавьте приватные прокси или запустите обновление вручную.');
          return;
        }
      }
    } catch (error) {
      console.warn('[prices] Проверка прокси не завершена:', error.message);
    }
    refreshAllSteamPrices().catch(e => console.warn('[prices]', e.message));
  }, 3000);
  return CATALOG;
}

async function refreshAllSteamPrices() {
  if (PRICE_LOADING) return PRICE_PROGRESS;
  PRICE_LOADING = true;
  try {
    const items = CATALOG.slice().sort((a,b) => {
      const aEst = a._isEstimated ? 1 : 0;
      const bEst = b._isEstimated ? 1 : 0;
      if (aEst !== bEst) return bEst - aEst;
      return 0;
    });
    const tasks = items.map(item => async () => {
      const price = await fetchPriceForItem(item);
      if (price) {
        item.priceCents = price;
        item._isEstimated = false;
      }
      return price;
    });
    PRICE_PROGRESS = { total: tasks.length, done: 0, ok: CATALOG.filter(i=>!i._isEstimated).length };
    const start = Date.now();
    let lastLog = 0;
    const proxyCount = (global.__priceQueue && global.__priceQueue.stats ? global.__priceQueue.stats().proxies : 0) || 0;
    const concurrency = Math.min(12, Math.max(4, proxyCount + 1));
    console.log(`[prices] Старт: ${tasks.length} предметов, concurrency=${concurrency}, proxies=${proxyCount}`);
    const { ok } = await runPool(tasks, concurrency, ({ value, done, ok: okCount }) => {
      PRICE_PROGRESS.done = done;
      PRICE_PROGRESS.ok = okCount;
      if (Date.now() - lastLog > 5000) {
        lastLog = Date.now();
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        const pct = ((done / tasks.length) * 100).toFixed(1);
        const eta = done ? ((tasks.length - done) * (Date.now() - start) / done / 1000).toFixed(0) : '?';
        const rate = done / Math.max(1, (Date.now()-start)/1000);
        PRICE_SPEED_HISTORY.push({ at:Date.now(), done, rate });
        if (PRICE_SPEED_HISTORY.length>60) PRICE_SPEED_HISTORY.shift();
        console.log(`[prices] ${done}/${tasks.length} (${pct}%) за ${elapsed}с, реальных цен ${okCount}, ETA ~${eta}с, conc=${concurrency}`);
      }
    });
    try { cache.del('catalog:public'); } catch {}
    console.log(`[prices] Готово: ${ok}/${tasks.length} реальных цен за ${((Date.now() - start) / 1000).toFixed(0)}с`);
    return { total: tasks.length, updated: ok };
  } finally {
    PRICE_LOADING = false;
  }
}

async function refreshSteamPrices(limit = 0) {
  if (PRICE_LOADING) return { alreadyRunning: true, ...PRICE_PROGRESS };
  let items = CATALOG.filter(i => {
    if (i._isEstimated) return true;
    const names = getMarketNamesForItem(i);
    for (const mn of names) {
      const c = cachedSteamPrice(mn, 24 * 3600 * 1000);
      if (!c.hit) return true;
      if (c.stale) return true;
    }
    return false;
  });
  if (limit > 0) items = items.slice(0, limit);
  const tasks = items.map(item => async () => {
    const price = await fetchPriceForItem(item);
    if (price) {
      item.priceCents = price;
      item._isEstimated = false;
    }
    return price;
  });
  let ok = 0;
  const proxyCount = (global.__priceQueue && global.__priceQueue.stats ? global.__priceQueue.stats().proxies : 0) || 0;
  const concurrency = Math.min(8, Math.max(2, proxyCount + 1));
  await runPool(tasks, concurrency, ({ value }) => { if (value) ok++; });
  try { cache.del('catalog:public'); } catch {}
  return { checked: items.length, updated: ok };
}

const DEFAULT_CASES = [
  {
    id: 'starter', name: 'СТАРТОВЫЙ КЕЙС', priceCents: 0, once: true,
    description: 'Один бесплатный кейс для нового игрока',
    image: '',
    max_openings: 0, level_min: 0, starts_at: null, ends_at: null, discount_percent: 0,
    contents: [
      ['p250-sand-dune', 46], ['awp-safari-mesh', 28], ['mp7-cirrus', 16],
      ['ak47-elite-build', 7], ['awp-worm-god', 2.5], ['usp-cortex', 0.5]
    ]
  },
  {
    id: 'neon', name: 'NEON CASE', priceCents: 24900,
    description: 'Яркие скины разных редкостей',
    image: '',
    max_openings: 0, level_min: 0, starts_at: null, ends_at: null, discount_percent: 0,
    contents: [
      ['mp7-cirrus', 36], ['ak47-elite-build', 27], ['awp-worm-god', 19],
      ['ak47-slate', 11], ['usp-cortex', 5], ['glock-vogue', 1.6], ['m4a1-hyper-beast', 0.4]
    ]
  },
  {
    id: 'classified', name: 'CLASSIFIED', priceCents: 99900,
    description: 'Повышенный шанс на розовую редкость',
    image: '',
    max_openings: 0, level_min: 0, starts_at: null, ends_at: null, discount_percent: 0,
    contents: [
      ['awp-worm-god', 34], ['ak47-slate', 27], ['usp-cortex', 16],
      ['glock-vogue', 11], ['mac10-disco-tech', 8], ['m4a1-hyper-beast', 3], ['ak47-neon-rider', 1]
    ]
  },
  {
    id: 'legend', name: 'LEGEND', priceCents: 299900,
    description: 'Редкие красные и контрабандные предметы',
    image: '',
    max_openings: 0, level_min: 0, starts_at: null, ends_at: null, discount_percent: 0,
    contents: [
      ['usp-cortex', 30], ['glock-vogue', 24], ['mac10-disco-tech', 18],
      ['m4a1-hyper-beast', 12], ['ak47-neon-rider', 8], ['awp-asiimov', 5],
      ['deagle-printstream', 2], ['ak47-wild-lotus', 0.8], ['m4a4-howl', 0.2]
    ]
  }
];

function dbRowToCase(row) {
  try {
    const contents = JSON.parse(row.contents || '[]');
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      priceCents: Number(row.price_cents || 0),
      once: !!row.once,
      enabled: !!row.enabled,
      image: row.image || '',
      max_openings: Number(row.max_openings || 0),
      level_min: Number(row.level_min || 0),
      starts_at: row.starts_at ? Number(row.starts_at) : null,
      ends_at: row.ends_at ? Number(row.ends_at) : null,
      discount_percent: Number(row.discount_percent || 0),
      contents: Array.isArray(contents) ? contents : []
    };
  } catch {
    return null;
  }
}

function ensureCasesDir() {
  try { fs.mkdirSync(path.join(__dirname, 'static', 'cases'), { recursive: true }); } catch {}
}
ensureCasesDir();

let CASES = [];
let CASES_BY_ID = new Map();
function loadCasesFromDB() {
  try {
    const rows = db.prepare('SELECT * FROM custom_cases ORDER BY created_at ASC').all();
    if (!rows.length) return [];
    return rows.map(dbRowToCase).filter(Boolean);
  } catch {
    return [];
  }
}
function refreshCasesCache() {
  try {
    const rows = loadCasesFromDB();
    if (!rows.length) {
      CASES = DEFAULT_CASES.slice();
    } else {
      CASES = rows;
    }
    CASES_BY_ID = new Map(CASES.map(item => [item.id, item]));
  } catch (e) {
    console.warn('[cases] failed to load from DB, using defaults', e.message);
    CASES = DEFAULT_CASES.slice();
    CASES_BY_ID = new Map(CASES.map(item => [item.id, item]));
  }
}

const RATE_LIMIT = Number(process.env.RATE_LIMIT || 120);
const RATE_WINDOW = Number(process.env.RATE_WINDOW || 60);
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (req.path === '/api/events') return next();
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'local';
  const count = cache.hit(`rl:${ip}`, RATE_WINDOW);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - count));
  if (count > RATE_LIMIT) {
    res.setHeader('Retry-After', RATE_WINDOW);
    return res.status(429).json({ error: 'Слишком много запросов, попробуйте позже' });
  }
  next();
});
app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const maintenance = settingGetRaw('maintenance', '');
  if (!maintenance) return next();
  if (req.path.startsWith('/api/')) {
    const account = currentUser(req);
    if (account && isAdmin(account)) return next();
    return res.status(503).json({ error: 'На сайте технические работы, попробуйте позже', maintenance: true });
  }
  next();
});
app.get('/favicon.ico', (_, res) => res.type('svg').sendFile(path.join(__dirname, 'favicon.svg')));
app.get(['/admin', '/admin.html'], (req, res) => {
  const account = currentUser(req);
  if (!account || !isStaff(account)) return res.status(404).sendFile(path.join(__dirname, 'index.html'));
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const STATIC_DIRS = [
  { url: '/static', dir: path.join(__dirname, 'static') },
  { url: '/chunks', dir: path.join(__dirname, 'chunks') }
];
for (const { url, dir } of STATIC_DIRS) {
  app.use(url, express.static(dir, {
    maxAge: '7d',
    index: false,
    fallthrough: true
  }));
}
const STATIC_ROOT_FILES = new Set([
  '/favicon.svg',
  '/manifest.json',
  '/index.html',
  '/tos.html',
  '/privacy.html',
  '/cookies.html',
  '/aml.html',
  '/robots.txt'
]);
app.get([...STATIC_ROOT_FILES], (req, res) => {
  res.sendFile(path.join(__dirname, req.path));
});

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

const db = require('./lib/db');
const cache = require('./lib/cache');
console.log(`[db] ${db.describe()}`);
setTimeout(() => console.log(`[cache] ${cache.describe()}`), 300);
const { createQueue } = require('./lib/queue');
const queue = createQueue({ cache });
db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steamid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    balance_cents INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions(
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS live_drops(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_icon TEXT NOT NULL DEFAULT '',
    price_cents INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS site_inventory(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    catalog_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    weapon_name TEXT NOT NULL,
    skin_name TEXT NOT NULL,
    item_icon TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    rarity TEXT NOT NULL,
    rarity_color TEXT NOT NULL,
    rarity_rank INTEGER NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS case_openings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    case_id TEXT NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    cost_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS upgrade_rounds(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_item_id INTEGER NOT NULL,
    target_catalog_id TEXT NOT NULL,
    chance REAL NOT NULL,
    won INTEGER NOT NULL,
    result_item_id INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory_sales(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_drops_created ON live_drops(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_site_inventory_user ON site_inventory(user_id, status, id DESC);
  CREATE INDEX IF NOT EXISTS idx_case_openings_user ON case_openings(user_id, case_id);
`);

function tableColumns(table) {
  if (db.driver === 'postgres') {

    return db.prepare(`SELECT column_name AS name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ?`)
      .all(table).map(row => row.name);
  }
  return db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
}
function ensureColumn(table, column, definition) {
  if (tableColumns(table).includes(column)) return;
  const sql = db.driver === 'postgres'
    ? definition.replace(/\bREAL\b/gi, 'DOUBLE PRECISION').replace(/\b(INTEGER|DATETIME)\b/gi, 'BIGINT')
    : definition;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${sql}`);
}
ensureColumn('live_drops', 'rarity', "TEXT NOT NULL DEFAULT ''");
ensureColumn('live_drops', 'rarity_color', "TEXT NOT NULL DEFAULT '#74ffca'");
ensureColumn('live_drops', 'rarity_rank', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('live_drops', 'source', "TEXT NOT NULL DEFAULT 'case'");
ensureColumn('live_drops', 'user_id', 'INTEGER');
ensureColumn('users', 'trade_link', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'profile_privacy', "TEXT NOT NULL DEFAULT 'private'");
ensureColumn('users', 'streamer_mode', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'nickname_custom', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'support_email', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'role', "TEXT NOT NULL DEFAULT 'user'");
ensureColumn('users', 'banned', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'ban_reason', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'is_bot', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'luck_modifier', 'REAL NOT NULL DEFAULT 0');
ensureColumn('support_messages', 'from_staff', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('support_messages', 'staff_id', 'INTEGER');
ensureColumn('support_messages', 'read_at', 'INTEGER');
ensureColumn('users', 'email_optout', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'frozen', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'freeze_reason', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'tags', "TEXT NOT NULL DEFAULT '[]'");

db.exec(`
  CREATE TABLE IF NOT EXISTS support_tickets(
    user_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'open',
    updated_at INTEGER NOT NULL,
    closed_at INTEGER,
    purge_at INTEGER
  );
`);
ensureColumn('support_tickets', 'category', "TEXT NOT NULL DEFAULT 'account'");
ensureColumn('support_tickets', 'priority', "TEXT NOT NULL DEFAULT 'normal'");

db.exec(`
  CREATE TABLE IF NOT EXISTS support_ticket_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    staff_id INTEGER,
    event TEXT NOT NULL,
    old_value TEXT NOT NULL DEFAULT '',
    new_value TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_support_history_user ON support_ticket_history(user_id, id DESC);
  CREATE TABLE IF NOT EXISTS steam_price_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_hash_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    source TEXT NOT NULL,
    change_percent REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_price_history_name ON steam_price_history(market_hash_name, id DESC);
`);

db.prepare(`
  INSERT INTO support_tickets(user_id,status,updated_at)
  SELECT user_id,'open',MAX(created_at) FROM support_messages
  WHERE user_id IS NOT NULL GROUP BY user_id
  ON CONFLICT(user_id) DO NOTHING
`).run();

function purgeClosedSupportTickets() {
  const now = Date.now();
  const expired = db.prepare("SELECT user_id FROM support_tickets WHERE status = 'closed' AND purge_at IS NOT NULL AND purge_at <= ?").all(now);
  if (!expired.length) return 0;
  const removeMessages = db.prepare('DELETE FROM support_messages WHERE user_id = ?');
  const removeTicket = db.prepare('DELETE FROM support_tickets WHERE user_id = ?');
  const removeHistory = db.prepare('DELETE FROM support_ticket_history WHERE user_id = ?');
  db.transaction(() => {
    for (const row of expired) {
      removeMessages.run(row.user_id);
      removeHistory.run(row.user_id);
      removeTicket.run(row.user_id);
    }
  })();
  return expired.length;
}
setInterval(() => { try { purgeClosedSupportTickets(); } catch (_) {} }, 60_000).unref();

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS promo_codes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL DEFAULT 'balance',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS promo_redemptions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(promo_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS case_overrides(
    case_id TEXT PRIMARY KEY,
    price_cents INTEGER,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings(
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_support_user ON support_messages(user_id, id DESC);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS email_messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    user_id INTEGER,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    sent_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_email_status ON email_messages(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_email_user ON email_messages(user_id);
  CREATE TABLE IF NOT EXISTS notifications(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'info',
    audience TEXT NOT NULL DEFAULT 'all',
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS steam_prices(
    market_hash_name TEXT PRIMARY KEY,
    lowest_price INTEGER NOT NULL,
    median_price INTEGER NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RUB',
    source TEXT NOT NULL DEFAULT 'steam',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS custom_cases(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL,
    once INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    image TEXT NOT NULL DEFAULT '',
    max_openings INTEGER NOT NULL DEFAULT 0,
    level_min INTEGER NOT NULL DEFAULT 0,
    starts_at INTEGER,
    ends_at INTEGER,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    contents TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_case_openings_case ON case_openings(case_id);
`);

ensureColumn('notifications', 'scheduled_at', 'INTEGER');
ensureColumn('notifications', 'sent_at', 'INTEGER');

(function seedCases() {
  try {
    const count = db.prepare('SELECT COUNT(*) AS c FROM custom_cases').get().c;
    if (count === 0) {
      console.log('[cases] Seeding default cases into DB');
      const now = Date.now();
      const ins = db.prepare('INSERT INTO custom_cases(id,name,description,price_cents,once,enabled,image,max_openings,level_min,starts_at,ends_at,discount_percent,contents,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      for (const c of DEFAULT_CASES) {
        ins.run(c.id, c.name, c.description||'', c.priceCents, c.once?1:0, c.enabled?1:0, c.image||'', c.max_openings||0, c.level_min||0, c.starts_at||null, c.ends_at||null, c.discount_percent||0, JSON.stringify(c.contents||[]), now, now);
      }
    }
    refreshCasesCache();
  } catch (e) {
    console.warn('[cases] seed failed', e.message);
    refreshCasesCache();
  }
})();

const mailer = require('./lib/mailer');

const ADMIN_STEAMIDS = String(process.env.ADMIN_STEAMIDS || '').split(',').map(v => v.trim()).filter(Boolean);
const SUPPORT_STEAMIDS = String(process.env.SUPPORT_STEAMIDS || '').split(',').map(v => v.trim()).filter(Boolean);
if (ADMIN_STEAMIDS.length) {
  const mark = db.prepare("UPDATE users SET role = 'admin' WHERE steamid = ? AND role <> 'admin'");
  for (const id of ADMIN_STEAMIDS) mark.run(id);
}
if (SUPPORT_STEAMIDS.length) {
  const mark = db.prepare("UPDATE users SET role = 'support' WHERE steamid = ? AND role = 'user'");
  for (const id of SUPPORT_STEAMIDS) mark.run(id);
}

function settingGetRaw(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}
function settingGet(key, fallback) {
  const raw = settingGetRaw(key, null);
  if (raw == null) return fallback;
  if (raw === '') return fallback;
  const number = Number(raw);
  return Number.isFinite(number) ? number : fallback;
}
function settingSet(key, value) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value));
}
function roleOf(account) {
  if (!account) return 'user';
  const steamid = String(account.steamid);

  if (ADMIN_STEAMIDS.includes(steamid)) return 'admin';
  if (SUPPORT_STEAMIDS.includes(steamid)) return 'support';
  return account.role || 'user';
}
function isAdmin(account) { return roleOf(account) === 'admin'; }
function isStaff(account) { const r = roleOf(account); return r === 'admin' || r === 'support'; }
function recordTransaction(userId, kind, amountCents, balanceAfter, note = '', now = Date.now()) {
  db.prepare('INSERT INTO transactions(user_id,kind,amount_cents,balance_after,note,created_at) VALUES(?,?,?,?,?,?)')
    .run(userId, kind, amountCents, balanceAfter, note, now);
}
function adminLog(account, action, target = '', details = '') {
  queue.publish('audit.write', {
    adminId: account.id,
    adminName: account.name,
    action,
    target: String(target),
    details: String(details),
    createdAt: Date.now()
  });
}
function requireAdmin(req, res, next) {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Требуется авторизация' });
  if (!isAdmin(account)) return res.status(403).json({ error: 'Недостаточно прав' });
  req.account = account;
  next();
}
function requireStaff(req, res, next) {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Требуется авторизация' });
  if (!isStaff(account)) return res.status(403).json({ error: 'Недостаточно прав' });
  req.account = account;
  next();
}

const onlineClients = new Map();
function uniqueOnlineClients() {
  const unique = new Map();
  for (const entry of onlineClients.values()) {
    const previous = unique.get(entry.visitorKey);
    if (!previous || previous.connectedAt < entry.connectedAt) unique.set(entry.visitorKey, entry);
  }
  return Array.from(unique.values());
}
function onlineCount() { return uniqueOnlineClients().length; }
function cleanSessions() { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); }
setInterval(cleanSessions, 600000).unref();
function updateOnlineActivity(req) {
  try {
    const account = currentUser(req);
    if (!account) return;
    for (const entry of onlineClients.values()) {
      if (entry.user && entry.user.id === account.id) {
        entry.lastPath = req.path;
        entry.lastAction = Date.now();
        entry.action = req.path.replace('/api/','').split('/')[0] || 'online';
      }
    }
  } catch {}
}
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/events' && req.path !== '/api/online') {
    updateOnlineActivity(req);
  }
  next();
});
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/') || req.method === 'GET') return next();
  const account = currentUser(req);
  if (!account || !account.frozen || isStaff(account)) return next();
  const allowed = ['/api/support/contact', '/api/support/messages', '/api/auth/logout', '/auth/logout'];
  if (allowed.some(pathname => req.path.startsWith(pathname))) return next();
  res.status(423).json({ error: account.freeze_reason || 'Аккаунт временно заморожен. Доступна только поддержка.', frozen: true });
});

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}
function createSession(userId) {
  const raw = `${crypto.randomBytes(24).toString('hex')}.${Date.now()}`;
  const token = `${raw}.${sign(raw)}`;
  db.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)')
    .run(token, userId, Date.now() + 2592000000);
  return token;
}
function cookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}
function currentUser(req) {
  const token = cookies(req.headers.cookie || '').session;
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const raw = parts.join('.');
    const expected = sign(raw);
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch { return null; }
  try {
    return db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ?
  `).get(token, Date.now()) || null;
  } catch { return null; }
}
function setCookie(res, token) {
  const parts = [
    `session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=2592000'
  ];

  if (BASE_URL.startsWith('https://')) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function clearCookie(res, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
  const parts = ['session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (BASE_URL.startsWith('https://')) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function broadcast(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const entry of onlineClients.values()) {
    try { entry.res.write(data); } catch {}
  }
}
function requestBase(req) {
  if (process.env.BASE_URL) return BASE_URL;
  return `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
}
function steamLogin(req) {
  const base = requestBase(req);
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${base}/auth/steam/callback`,
    'openid.realm': base,
    'openid.ns.sreg': 'http://openid.net/extensions/sreg/1.1',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return `https://steamcommunity.com/openid/login?${params}`;
}
async function verifySteam(req) {
  // Принимаем return_to как по BASE_URL, так и по реальному хосту запроса.
  // Это чинит "OpenID return_to mismatch", когда сайт открыт по IP/домену,
  // а BASE_URL в .env задан иначе (или наоборот).
  const normalizeUrl = u => String(u || '').trim().toLowerCase().replace(/\/+$/, '');
  const baseFromEnv = normalizeUrl(BASE_URL);
  const baseFromReq = normalizeUrl(`${req.protocol}://${req.get('host')}`);
  const expectedSet = new Set([baseFromEnv, baseFromReq].filter(Boolean).map(b => `${b}/auth/steam/callback`));
  const providedReturnTo = String(req.query['openid.return_to'] || req.query.openid_return_to || '');
  if (!providedReturnTo) throw new Error('OpenID return_to missing');
  if (!expectedSet.has(normalizeUrl(providedReturnTo))) throw new Error('OpenID return_to mismatch');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) params.set(key, String(value));
  params.set('openid.mode', 'check_authentication');

  const makeHeaders = () => ({
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
    'Referer': 'https://steamcommunity.com/'
  });

  async function doFetch(dispatcher) {
    const opts = {
      method: 'POST',
      headers: makeHeaders(),
      body: params.toString(),
      signal: AbortSignal.timeout(15000),
      ...(dispatcher ? { dispatcher } : {})
    };
    return await fetch('https://steamcommunity.com/openid/login', opts);
  }

  function proxyDispatcherFor(proxyUrl) {
    try {
      const { ProxyAgent } = require('undici');
      return new ProxyAgent(proxyUrl);
    } catch {
      return null;
    }
  }

  let response = null;
  let text = '';
  const attempts = [];

  // 1) Прямое подключение
  try {
    response = await doFetch();
    text = await response.text();
  } catch (e) {
    attempts.push('direct: ' + (e && e.message));
  }

  const looksBlocked = !response || !response.ok || /Access Denied|Reference #18\.|is_valid\s*:\s*false/i.test(text);

  // 2) Если прямой запрос не прошёл — пробуем прокси по очереди
  if (looksBlocked) {
    let list = [];
    try {
      const pq = global.__priceQueue;
      if (pq && pq.stats) list = (pq.stats().proxyStats || []).filter(p => !p.blocked);
    } catch {}
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    for (const p of list.slice(0, 10)) {
      const dispatcher = proxyDispatcherFor(p.url);
      if (!dispatcher) continue;
      try {
        const r2 = await doFetch(dispatcher);
        const t2 = await r2.text();
        attempts.push('proxy ' + p.url + ': HTTP ' + r2.status);
        if (r2.ok && !/Access Denied|Reference #18\./i.test(t2) && /is_valid\s*:\s*true/i.test(t2)) {
          response = r2;
          text = t2;
          break;
        }
      } catch (e) {
        attempts.push('proxy ' + p.url + ': ' + (e && e.message));
      }
    }
  }

  if (!response || !response.ok || !/is_valid\s*:\s*true/i.test(text)) {
    if (/Access Denied|Reference #18\./i.test(text || '')) {
      console.error('[steam] Access Denied from Steam. Попытки:', attempts.join(' | '));
      throw new Error('Steam вернул Access Denied (Reference #18) — это защита Akamai, Steam заблокировал твой IP. Вход через Steam возможен только с незаблокированного интернета: 1) смени IP (перезагрузи роутер / мобильный интернет / другой Wi-Fi) 2) включи VPN с чистым IP 3) подожди 24-48 часов, блок снимается сам. Если блокирует сам сервер — добавь рабочие прокси в data/proxies.txt и нажми "Прокси -> Перезагрузить" в админке.');
    }
    console.error('[steam] verification failed:', response && response.status, (text || '').slice(0, 500));
    throw new Error('Steam OpenID verification failed');
  }
  const match = String(req.query.openid_claimed_id || req.query['openid.claimed_id'] || '').match(/\/id\/(\d{17})$/);
  if (!match) throw new Error('SteamID not found');
  return match[1];
}

function decodeXml(value = '') {
  return String(value).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function xmlValue(xml, tag) {
  const match = String(xml).match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}
async function steamProfile(id) {
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8'
  };
  if (STEAM_API_KEY) {
    try {
      const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
      url.searchParams.set('key', STEAM_API_KEY);
      url.searchParams.set('steamids', id);
      const response = await fetch(url, { headers: { 'User-Agent': 'Keyser/2.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) });
      const profile = response.ok ? (await response.json())?.response?.players?.[0] : null;
      if (profile?.personaname || profile?.avatarfull) {
        return { name: profile.personaname || `Steam ${id.slice(-6)}`, avatar: profile.avatarfull || '' };
      }
    } catch {}
  }
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${id}/?xml=1`, {
      headers: commonHeaders,
      signal: AbortSignal.timeout(8000)
    });
    if (response.ok) {
      const txt = await response.text();
      if (/Access Denied|Reference #18/i.test(txt)) {
        console.warn('[steam] profile Access Denied for', id);
        return { name: `Steam ${id.slice(-6)}`, avatar: '' };
      }
      const xml = txt;
      const name = xmlValue(xml, 'steamID');
      const avatar = xmlValue(xml, 'avatarFull') || xmlValue(xml, 'avatarMedium');
      if (name || avatar) return { name: name || `Steam ${id.slice(-6)}`, avatar };
    }
  } catch {}
  return { name: `Steam ${id.slice(-6)}`, avatar: '' };
}
function publicCatalogItem(item) {
  return withSteamIcon({ ...item });
}
function inventoryRows(userId) {
  return db.prepare(`
    SELECT id AS assetid, catalog_id AS catalogId, item_name AS name,
      weapon_name AS weapon, skin_name AS skin, skin_name AS marketName,
      item_icon AS icon, price_cents AS priceCents, rarity,
      rarity_color AS rarityColor, rarity_rank AS rarityRank,
      source, created_at AS createdAt
    FROM site_inventory
    WHERE user_id = ? AND status = 'active'
    ORDER BY id DESC
  `).all(userId).map(row => withSteamIcon({
    ...row,
    assetid: String(row.assetid),
    wear: CATALOG_BY_ID.get(row.catalogId)?.wear || ''
  }));
}
function inventoryFeedRows(userId, limit = 60) {
  return db.prepare(`
    SELECT id AS assetid, catalog_id AS catalogId, item_name AS name,
      weapon_name AS weapon, skin_name AS skin, skin_name AS marketName,
      item_icon AS icon, price_cents AS priceCents, rarity,
      rarity_color AS rarityColor, rarity_rank AS rarityRank,
      source, status, created_at AS createdAt
    FROM site_inventory
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(userId, limit).map(row => withSteamIcon({
    ...row,
    assetid: String(row.assetid),
    wear: CATALOG_BY_ID.get(row.catalogId)?.wear || ''
  }));
}
function insertInventoryItem(userId, catalog, source, now = Date.now()) {
  const result = db.prepare(`
    INSERT INTO site_inventory(
      user_id,catalog_id,item_name,weapon_name,skin_name,item_icon,price_cents,
      rarity,rarity_color,rarity_rank,source,status,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,'active',?,?)
  `).run(
    userId, catalog.catalogId, catalog.name, catalog.weapon, catalog.skin, catalog.icon,
    catalog.priceCents, catalog.rarity, catalog.rarityColor, catalog.rarityRank, source, now, now
  );
  return Number(result.lastInsertRowid);
}
function pickWeighted(contents, account = null) {
  const globalLuck = settingGet('case_luck', 0);
  const userLuck = account ? Number(account.luck_modifier || 0) : 0;
  const luck = Math.max(-90, Math.min(300, globalLuck + userLuck));
  const ranked = contents.map(([id, weight]) => {
    const item = CATALOG_BY_ID.get(id);
    return { id, weight, price: Number(item?.priceCents || 0) };
  });
  const prices = ranked.map(row => row.price);
  const maxPrice = Math.max(1, ...prices);
  const minPrice = Math.min(...prices);
  const span = Math.max(1, maxPrice - minPrice);
  const adjusted = ranked.map(row => {
    const rarityShare = (row.price - minPrice) / span;
    const factor = 1 + (luck / 100) * rarityShare;
    return [row.id, Math.max(0.0001, row.weight * factor)];
  });
  const total = adjusted.reduce((sum, [, weight]) => sum + weight, 0);
  let point = (crypto.randomInt(0, 1000000) + Math.random()) / 1000000 * total;
  for (const [id, weight] of adjusted) {
    point -= weight;
    if (point < 0) return CATALOG_BY_ID.get(id);
  }
  return CATALOG_BY_ID.get(adjusted[adjusted.length - 1][0]);
}
function dropPayload(row) {
  return {
    id: row.id,
    userId: row.user_id == null ? null : Number(row.user_id),
    userName: row.user_name,
    userAvatar: row.user_avatar || (row.user_id ? (db.prepare('SELECT avatar FROM users WHERE id=?').get(row.user_id)?.avatar || '') : ''),
    itemName: row.item_name,
    itemIcon: steamIconFor(row.item_name) || row.item_icon,
    localIcon: row.item_icon,
    priceCents: row.price_cents,
    rarity: row.rarity,
    rarityColor: row.rarity_color,
    rarityRank: row.rarity_rank,
    source: row.source,
    createdAt: row.created_at
  };
}
function addLiveDrop(userId, userName, item, source, now = Date.now()) {
  cache.del('drops:latest');
  cache.del('stats:global');
  const result = db.prepare(`
    INSERT INTO live_drops(user_id,user_name,item_name,item_icon,price_cents,rarity,rarity_color,rarity_rank,source,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
  `).run(userId || null, userName, item.name, item.icon, item.priceCents, item.rarity, item.rarityColor, item.rarityRank, source, now);
  return dropPayload(db.prepare('SELECT * FROM live_drops WHERE id = ?').get(result.lastInsertRowid));
}
function caseView(caseData, userId) {
  const opened = userId && caseData.once
    ? !!db.prepare('SELECT 1 FROM case_openings WHERE user_id = ? AND case_id = ? LIMIT 1').get(userId, caseData.id)
    : false;
  const override = db.prepare('SELECT * FROM case_overrides WHERE case_id = ?').get(caseData.id);
  let enabled = override ? !!override.enabled : !!caseData.enabled;
  const now = Date.now();
  const notYet = caseData.starts_at && now < Number(caseData.starts_at);
  const expired = caseData.ends_at && now > Number(caseData.ends_at);
  let totalOpened = 0;
  try { totalOpened = db.prepare('SELECT COUNT(*) AS c FROM case_openings WHERE case_id = ?').get(caseData.id).c; } catch {}
  const maxReached = caseData.max_openings > 0 && totalOpened >= Number(caseData.max_openings);
  if (notYet || expired || maxReached) enabled = false;
  let basePrice = override && override.price_cents != null ? Number(override.price_cents) : Number(caseData.priceCents || 0);
  let discount = Number(caseData.discount_percent || 0);
  let finalPrice = basePrice;
  if (discount > 0) finalPrice = Math.round(basePrice * (100 - Math.min(90, discount)) / 100);
  return {
    id: caseData.id,
    name: caseData.name,
    description: caseData.description,
    priceCents: finalPrice,
    basePriceCents: basePrice,
    discountPercent: discount,
    once: !!caseData.once,
    enabled,
    available: !opened && enabled,
    image: caseData.image || '',
    maxOpenings: Number(caseData.max_openings || 0),
    totalOpened,
    levelMin: Number(caseData.level_min || 0),
    startsAt: caseData.starts_at ? Number(caseData.starts_at) : null,
    endsAt: caseData.ends_at ? Number(caseData.ends_at) : null,
    contents: (caseData.contents || []).map(([id, weight]) => {
      const item = CATALOG_BY_ID.get(id);
      const pub = item ? publicCatalogItem(item) : null;
      return pub ? { ...pub, weight } : null;
    }).filter(Boolean)
  };
}

app.get('/auth/steam', (req, res) => res.redirect(steamLogin(req)));
app.get('/auth/steam/callback', async (req, res) => {
  try {
    const steamid = await verifySteam(req);
    const profile = await steamProfile(steamid);
    const now = Date.now();
    const old = db.prepare('SELECT * FROM users WHERE steamid = ?').get(steamid);
    let userId;
    if (old) {
      db.prepare('UPDATE users SET name = ?, avatar = ?, updated_at = ? WHERE id = ?')
        .run(old.nickname_custom ? old.name : profile.name, profile.avatar, now, old.id);
      userId = old.id;
    } else {
      userId = Number(db.prepare('INSERT INTO users(steamid,name,avatar,created_at,updated_at) VALUES(?,?,?,?,?)')
        .run(steamid, profile.name, profile.avatar, now, now).lastInsertRowid);
    }
    setCookie(res, createSession(userId));
    res.redirect('/');
  } catch (error) {
    console.error('[steam callback]', error.message);
    const msg = String(error.message || '');
    const isAccessDenied = /Access Denied|Reference #18|Akamai|заблокирован/i.test(msg);
    res.status(isAccessDenied ? 403 : 502).setHeader('Content-Type','text/html; charset=utf-8').send(`
<!doctype html><meta charset="utf-8"><title>Steam вход — ошибка</title>
<style>body{margin:0;background:#0a0b0f;color:#e6e9ee;font-family:Segoe UI,Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:20px}
.card{max-width:640px;width:100%;background:#12151f;border:1px solid rgba(86,168,255,.2);border-radius:12px;padding:24px}
h1{margin:0 0 12px;font-size:20px;color:#fff}
p{line-height:1.6;color:#aab4c0}
code{background:#1b2436;padding:2px 6px;border-radius:4px;color:#56A8FF}
a{color:#56A8FF;text-decoration:none}
a:hover{text-decoration:underline}
.btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#56A8FF;color:#000;font-weight:700;border-radius:8px;text-decoration:none}
</style>
<div class="card">
<h1>Не удалось войти через Steam</h1>
<p><b>Причина:</b> ${msg ? msg.replace(/</g,'&lt;') : 'Steam OpenID verification failed'}</p>
${isAccessDenied ? `
<p>Steam вернул <code>Access Denied / Reference #18</code> — это защита Akamai от дата-центров и впн. Твой IP попал в черный список Steam.</p>
<p><b>Что делать:</b></p>
<ol>
<li>Включи <b>VPN</b> (другая страна) и попробуй снова — <a href="/auth/steam">/auth/steam</a></li>
<li>Добавь прокси в <code>data/proxies.txt</code> и включи их в админке → Логи и система → Прокси. Система сама будет проверять Steam через прокси.</li>
<li>Проверь <code>BASE_URL</code> в .env — должен быть твой публичный домен без / в конце, для localhost оставь пустым.</li>
</ol>
` : `<p>Попробуй еще раз: <a href="/auth/steam">Войти через Steam</a></p>`}
<p><a href="/">← На главную</a></p>
</div>
`);
  }
});

app.post('/auth/logout', (req, res) => {
  clearCookie(res, cookies(req.headers.cookie || '').session);
  res.json({ ok: true });
});

queue.on('drop.broadcast', payload => {
  cache.del('drops:latest');
  broadcast('drop', payload);
});
queue.on('stats.refresh', () => {
  cache.del('stats:global');
});
queue.on('audit.write', payload => {
  db.prepare('INSERT INTO admin_logs(admin_id,admin_name,action,target,details,created_at) VALUES(?,?,?,?,?,?)')
    .run(payload.adminId, payload.adminName, payload.action, payload.target, payload.details, payload.createdAt || Date.now());
});
queue.on('notify.user', payload => {
  broadcast('notify', payload);
});

app.get('/api/config', (_, res) => {
  let banner = null;
  try { banner = JSON.parse(settingGetRaw('site_banner', 'null')); } catch {}
  res.json({
    brand: settingGetRaw('site_brand', BRAND_NAME) || BRAND_NAME,
    telegram: settingGetRaw('site_telegram', TELEGRAM_URL) || TELEGRAM_URL,
    supportEmail: settingGetRaw('site_support_email', 'support@caser.gg'),
    marketingEmail: settingGetRaw('site_marketing_email', 'marketing@caser.gg'),
    banner: banner && banner.enabled ? banner : null
  });
});
app.get('/api/stats', (_, res) => {
  const cached = cache.get('stats:global');
  if (cached) return res.json(cached);
  const payload = {
    totalPlayers: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    casesOpened: db.prepare('SELECT COUNT(*) AS count FROM case_openings').get().count,
    upgradesMade: db.prepare('SELECT COUNT(*) AS count FROM upgrade_rounds').get().count
  };
  cache.set('stats:global', payload, 15);
  res.json(payload);
});
app.get('/api/me', async (req, res) => {
  let account = currentUser(req);
  if (!account) return res.json({ authenticated: false });
  if (!account.avatar || /^Steam \d{6}$/.test(account.name)) {
    const fresh = await steamProfile(account.steamid);
    if (fresh.avatar || !/^Steam \d{6}$/.test(fresh.name)) {
      const displayName = account.nickname_custom ? account.name : fresh.name;
      db.prepare('UPDATE users SET name = ?, avatar = ?, updated_at = ? WHERE id = ?')
        .run(displayName, fresh.avatar, Date.now(), account.id);
      account = { ...account, name: displayName, avatar: fresh.avatar };
    }
  }
  res.json({
    authenticated: true,
    user: {
      id: account.id, steamid: account.steamid, name: account.name,
      avatar: account.avatar, balanceCents: account.balance_cents,
      role: roleOf(account), banned: !!account.banned, banReason: account.ban_reason || '',
      frozen: !!account.frozen, freezeReason: account.freeze_reason || '',
      tags: (() => { try { return JSON.parse(account.tags || '[]'); } catch { return []; } })()
    }
  });
});
app.get('/api/users/:id/profile', (req, res) => {
  const userId = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id=? AND banned=0').get(userId);
  if (!user) return res.status(404).json({ error:'Профиль не найден' });
  const viewer = currentUser(req);
  const own = viewer && Number(viewer.id) === userId;
  const staff = viewer && isStaff(viewer);
  const privacy = user.profile_privacy || 'private';
  const showSteamIdentity = own || staff || privacy === 'public';
  const items = db.prepare(`SELECT id AS assetid,catalog_id AS catalogId,item_name AS name,weapon_name AS weapon,skin_name AS skin,item_icon AS icon,price_cents AS priceCents,rarity,rarity_color AS rarityColor,rarity_rank AS rarityRank,source,status,created_at AS createdAt FROM site_inventory WHERE user_id=? AND status='active' ORDER BY id DESC LIMIT 100`).all(userId).map(item=>withSteamIcon({...item,assetid:String(item.assetid)}));
  const history = db.prepare(`SELECT id AS assetid,catalog_id AS catalogId,item_name AS name,weapon_name AS weapon,skin_name AS skin,item_icon AS icon,price_cents AS priceCents,rarity,rarity_color AS rarityColor,rarity_rank AS rarityRank,source,status,created_at AS createdAt FROM site_inventory WHERE user_id=? ORDER BY id DESC LIMIT 50`).all(userId).map(item=>withSteamIcon({...item,assetid:String(item.assetid)}));
  const upgrades = db.prepare(`SELECT r.id,r.chance,r.won,r.target_catalog_id AS targetCatalogId,r.created_at AS createdAt,a.item_name AS fromName,a.item_icon AS fromIcon,a.price_cents AS fromPriceCents,t.item_name AS toName,t.item_icon AS toIcon,t.price_cents AS toPriceCents FROM upgrade_rounds r LEFT JOIN site_inventory a ON a.id=r.from_item_id LEFT JOIN site_inventory t ON t.id=r.result_item_id WHERE r.user_id=? ORDER BY r.id DESC LIMIT 40`).all(userId).map(row=>{const target=CATALOG_BY_ID.get(String(row.targetCatalogId||''));return {...row,won:!!row.won,toName:row.toName||target?.name||'',toIcon:row.toIcon||target?.icon||'',toPriceCents:row.toPriceCents??target?.priceCents??0};});
  const bestDrop = history.slice().sort((a,b)=>Number(b.priceCents)-Number(a.priceCents))[0] || null;
  const stats={casesOpened:db.prepare('SELECT COUNT(*) c FROM case_openings WHERE user_id=?').get(userId).c,upgradesMade:db.prepare('SELECT COUNT(*) c FROM upgrade_rounds WHERE user_id=?').get(userId).c,soldItems:db.prepare('SELECT COUNT(*) c FROM inventory_sales WHERE user_id=?').get(userId).c};
  const withdrawnCents=db.prepare('SELECT COALESCE(SUM(amount_cents),0) s FROM inventory_sales WHERE user_id=?').get(userId).s;
  let tags=[];try{tags=JSON.parse(user.tags||'[]')}catch{}
  res.json({ user:{id:user.id,steamid:showSteamIdentity?user.steamid:'',name:user.name,avatar:showSteamIdentity?user.avatar:'',role:roleOf(user),tags,createdAt:user.created_at}, items,history,upgrades,bestDrop,stats,withdrawnCents,activeItems:items.length,privacy,isOwn:!!own,staffView:!!staff });
});

app.get('/api/profile', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  const bestDrop = db.prepare(`
    SELECT id AS assetid, catalog_id AS catalogId, item_name AS name,
      weapon_name AS weapon, skin_name AS skin, item_icon AS icon,
      price_cents AS priceCents, rarity, rarity_color AS rarityColor,
      rarity_rank AS rarityRank, source, created_at AS createdAt
    FROM site_inventory WHERE user_id = ? ORDER BY price_cents DESC, id DESC LIMIT 1
  `).get(account.id) || null;
  const historyRows = db.prepare(`
    SELECT id AS assetid, item_name AS name, weapon_name AS weapon, skin_name AS skin,
      item_icon AS icon, price_cents AS priceCents, rarity, rarity_color AS rarityColor,
      rarity_rank AS rarityRank, source, status, created_at AS createdAt
    FROM site_inventory WHERE user_id = ? ORDER BY id DESC LIMIT 40
  `).all(account.id).map(row => withSteamIcon({ ...row, assetid: String(row.assetid) }));
  const upgradeRows = db.prepare(`
    SELECT ur.id, ur.chance, ur.won, ur.created_at AS createdAt, ur.target_catalog_id AS targetCatalogId,
      fi.item_name AS fromName, fi.weapon_name AS fromWeapon, fi.skin_name AS fromSkin,
      fi.item_icon AS fromIcon, fi.price_cents AS fromPriceCents,
      fi.rarity AS fromRarity, fi.rarity_color AS fromRarityColor,
      ti.item_name AS toName, ti.weapon_name AS toWeapon, ti.skin_name AS toSkin,
      ti.item_icon AS toIcon, ti.price_cents AS toPriceCents,
      ti.rarity AS toRarity, ti.rarity_color AS toRarityColor
    FROM upgrade_rounds ur
    LEFT JOIN site_inventory fi ON fi.id = ur.from_item_id
    LEFT JOIN site_inventory ti ON ti.id = ur.result_item_id
    WHERE ur.user_id = ? ORDER BY ur.id DESC LIMIT 30
  `).all(account.id).map(row => {
    const target = CATALOG_BY_ID.get(String(row.targetCatalogId || '')) || null;
    const from = withSteamIcon({
      name: row.fromName, weapon: row.fromWeapon, skin: row.fromSkin,
      icon: row.fromIcon, priceCents: row.fromPriceCents,
      rarity: row.fromRarity, rarityColor: row.fromRarityColor
    });
    const to = withSteamIcon({
      name: row.toName || target?.name || '',
      weapon: row.toWeapon || target?.weapon || '',
      skin: row.toSkin || target?.skin || '',
      icon: row.toIcon || target?.icon || '',
      priceCents: row.toPriceCents != null ? row.toPriceCents : (target?.priceCents || 0),
      rarity: row.toRarity || target?.rarity || '',
      rarityColor: row.toRarityColor || target?.rarityColor || ''
    });
    return {
      id: row.id, chance: row.chance, won: !!row.won, createdAt: row.createdAt,
      from, to,
      fromName: row.fromName, fromIcon: from.icon, fromPriceCents: row.fromPriceCents,
      toName: to.name, toIcon: to.icon, toPriceCents: to.priceCents
    };
  });
  const casesOpened = db.prepare('SELECT COUNT(*) AS count FROM case_openings WHERE user_id = ?').get(account.id).count;
  const upgradesMade = db.prepare('SELECT COUNT(*) AS count FROM upgrade_rounds WHERE user_id = ?').get(account.id).count;
  const sold = db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS total FROM inventory_sales WHERE user_id = ?').get(account.id);
  const activeItems = db.prepare("SELECT COUNT(*) AS count FROM site_inventory WHERE user_id = ? AND status = 'active'").get(account.id).count;
  res.json({
    user: { id: account.id, steamid: account.steamid, name: account.name, avatar: account.avatar, role: roleOf(account) },
    balanceCents: account.balance_cents,
    withdrawnCents: 0,
    activeItems,
    bestDrop: bestDrop ? { ...withSteamIcon(bestDrop), assetid: String(bestDrop.assetid) } : null,
    history: historyRows,
    upgrades: upgradeRows,
    stats: { casesOpened, upgradesMade, soldItems: sold.count, soldCents: sold.total }
  });
});
app.get('/api/settings', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  res.json({
    nickname: account.name,
    tradeLink: account.trade_link || '',
    privacy: account.profile_privacy || 'private',
    streamerMode: !!account.streamer_mode,
    emailOptout: !!account.email_optout
  });
});
app.post('/api/settings', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  const nickname = String(req.body?.nickname || '').trim();
  const tradeLink = String(req.body?.tradeLink || '').trim();
  const privacy = String(req.body?.privacy || 'private');
  const streamerMode = !!req.body?.streamerMode;
  if (nickname.length < 2 || nickname.length > 32 || /[<>\r\n]/.test(nickname)) {
    return res.status(400).json({ error: 'Никнейм должен содержать от 2 до 32 символов' });
  }
  if (!['private', 'friends', 'public'].includes(privacy)) {
    return res.status(400).json({ error: 'Некорректная настройка приватности' });
  }
  if (tradeLink) {
    try {
      const url = new URL(tradeLink);
      if (!/(^|\.)steamcommunity\.com$/i.test(url.hostname) || !url.pathname.startsWith('/tradeoffer/new')) {
        throw new Error('invalid');
      }
    } catch {
      return res.status(400).json({ error: 'Введите корректную Steam трейд-ссылку' });
    }
  }
  db.prepare(`
    UPDATE users SET name = ?, trade_link = ?, profile_privacy = ?,
      streamer_mode = ?, nickname_custom = 1, updated_at = ? WHERE id = ?
  `).run(nickname, tradeLink, privacy, streamerMode ? 1 : 0, Date.now(), account.id);
  res.json({ ok: true, nickname, tradeLink, privacy, streamerMode });
});
app.get('/api/catalog', (_, res) => {
  const cached = cache.get('catalog:public');
  if (cached) return res.json(cached);
  const payload = CATALOG.map(publicCatalogItem);
  cache.set('catalog:public', payload, 300);
  res.json(payload);
});
app.get('/api/inventory', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, items: inventoryRows(account.id), feed: inventoryFeedRows(account.id) });
});
app.post('/api/inventory/:id/sell', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  const itemId = Number(req.params.id);
  if (!Number.isSafeInteger(itemId)) return res.status(400).json({ error: 'Предмет не найден' });
  try {
    const result = db.transaction(() => {
      const item = db.prepare("SELECT * FROM site_inventory WHERE id = ? AND user_id = ? AND status = 'active'")
        .get(itemId, account.id);
      if (!item) throw new Error('Предмет уже недоступен');
      const now = Date.now();
      const changed = db.prepare("UPDATE site_inventory SET status = 'sold', updated_at = ? WHERE id = ? AND status = 'active'")
        .run(now, itemId);
      if (!changed.changes) throw new Error('Предмет уже недоступен');
      db.prepare('UPDATE users SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?')
        .run(item.price_cents, now, account.id);
      db.prepare('INSERT INTO inventory_sales(user_id,inventory_item_id,amount_cents,created_at) VALUES(?,?,?,?)')
        .run(account.id, itemId, item.price_cents, now);
      const balance = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
      recordTransaction(account.id, 'item_sale', item.price_cents, balance, item.item_name, now);
      return { amountCents: item.price_cents, balanceCents: balance };
    })();
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось продать предмет' });
  }
});
app.get('/api/cases', (req, res) => {
  const account = currentUser(req);
  res.json({ authenticated: !!account, cases: CASES.map(item => caseView(item, account?.id)) });
});
app.post('/api/cases/open', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  if (account.banned) return res.status(403).json({ error: account.ban_reason || 'Аккаунт заблокирован' });
  const caseData = CASES_BY_ID.get(String(req.body?.caseId || ''));
  if (!caseData) return res.status(404).json({ error: 'Кейс не найден' });
  const override = db.prepare('SELECT * FROM case_overrides WHERE case_id = ?').get(caseData.id);
  if (override && !override.enabled) return res.status(403).json({ error: 'Кейс временно отключён' });
  const casePrice = override && override.price_cents != null ? Number(override.price_cents) : caseData.priceCents;

  try {
    const result = db.transaction(() => {
      if (caseData.once && db.prepare('SELECT 1 FROM case_openings WHERE user_id = ? AND case_id = ? LIMIT 1').get(account.id, caseData.id)) {
        throw new Error('Стартовый кейс уже был открыт');
      }
      if (casePrice > 0) {
        const charged = db.prepare(`
          UPDATE users SET balance_cents = balance_cents - ?, updated_at = ?
          WHERE id = ? AND balance_cents >= ?
        `).run(casePrice, Date.now(), account.id, casePrice);
        if (!charged.changes) throw new Error('Недостаточно средств на балансе');
      }
      const won = pickWeighted(caseData.contents, account);
      const now = Date.now();
      const inventoryId = insertInventoryItem(account.id, won, `case:${caseData.id}`, now);
      db.prepare('INSERT INTO case_openings(user_id,case_id,inventory_item_id,cost_cents,created_at) VALUES(?,?,?,?,?)')
        .run(account.id, caseData.id, inventoryId, casePrice, now);
      if (casePrice > 0) {
        const after = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
        recordTransaction(account.id, 'case_open', -casePrice, after, caseData.name, now);
      }
      const drop = addLiveDrop(account.id, account.name, won, 'case', now);
      const balance = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
      return { won: { ...won, assetid: String(inventoryId) }, drop, balanceCents: balance };
    })();
    queue.publish('drop.broadcast', result.drop);
    queue.publish('stats.refresh', {});
    res.json({ ok: true, item: result.won, balanceCents: result.balanceCents });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось открыть кейс' });
  }
});

app.post('/api/upgrade', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  if (account.banned) return res.status(403).json({ error: account.ban_reason || 'Аккаунт заблокирован' });
  const fromId = Number(req.body?.fromAssetId);
  const target = CATALOG_BY_ID.get(String(req.body?.toCatalogId || ''));
  const boostPercent = Number(req.body?.boostPercent || 30);
  const allowedBoosts = new Set([30, 50, 75, 200, 500, 1000]);
  const addBalanceCents = Math.floor(Number(req.body?.addBalanceCents || 0));
  if (!Number.isSafeInteger(fromId) || !target) return res.status(400).json({ error: 'Выберите оба предмета' });
  if (!allowedBoosts.has(boostPercent)) return res.status(400).json({ error: 'Недопустимый процент апгрейда' });
  if (!Number.isSafeInteger(addBalanceCents) || addBalanceCents < 0) return res.status(400).json({ error: 'Недопустимая сумма из баланса' });

  try {
    const result = db.transaction(() => {
      const from = db.prepare(`
        SELECT * FROM site_inventory WHERE id = ? AND user_id = ? AND status = 'active'
      `).get(fromId, account.id);
      if (!from) throw new Error('Исходный предмет уже недоступен');
      if (addBalanceCents > Number(account.balance_cents || 0)) throw new Error('Недостаточно средств на балансе');
      const totalValue = Number(from.price_cents) + addBalanceCents;

      const minTarget = boostPercent >= 100
        ? Math.ceil(totalValue * boostPercent / 100)
        : Math.ceil(totalValue * 100 / boostPercent);
      if (Number(target.priceCents) < minTarget) {
        throw new Error('Цель не соответствует выбранному проценту апгрейда');
      }

      const currentBalance = Number(
        db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents
      );
      if (addBalanceCents > currentBalance) throw new Error('Недостаточно средств на балансе');
      if (addBalanceCents > 0) {
        const charged = db.prepare(`
          UPDATE users SET balance_cents = balance_cents - ?, updated_at = ?
          WHERE id = ? AND balance_cents >= ?
        `).run(addBalanceCents, Date.now(), account.id, addBalanceCents);
        if (!charged.changes) throw new Error('Недостаточно средств на балансе');
        const after = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
        recordTransaction(account.id, 'upgrade_stake', -addBalanceCents, after, 'Ставка в апгрейде');
      }
      const baseChance = Math.min(100, Math.max(0, Math.floor(totalValue / target.priceCents * 10000) / 100));
      const luck = Math.max(-90, Math.min(300, settingGet('upgrade_luck', 0) + Number(account.luck_modifier || 0)));
      const effectiveChance = Math.min(100, Math.max(0, baseChance * (1 + luck / 100)));
      const chance = Math.round(effectiveChance * 100) / 100;
      const roll = crypto.randomInt(0, 1000000) / 10000;
      const won = roll < effectiveChance;
      const now = Date.now();
      db.prepare("UPDATE site_inventory SET status = 'used', updated_at = ? WHERE id = ?").run(now, fromId);
      let resultItemId = null;
      let drop = null;
      if (won) {
        resultItemId = insertInventoryItem(account.id, target, `upgrade:${fromId}`, now);
        drop = addLiveDrop(account.id, account.name, target, 'upgrade', now);
      }
      db.prepare(`
        INSERT INTO upgrade_rounds(user_id,from_item_id,target_catalog_id,chance,won,result_item_id,created_at)
        VALUES(?,?,?,?,?,?,?)
      `).run(account.id, fromId, target.catalogId, chance, won ? 1 : 0, resultItemId, now);
      return {
        won,
        chance,
        boostPercent,
        addBalanceCents,
        roll: Math.floor(roll * 100) / 100,
        item: won ? { ...target, assetid: String(resultItemId) } : null,
        drop
      };
    })();
    if (result.drop) queue.publish('drop.broadcast', result.drop);
    queue.publish('stats.refresh', {});
    res.json({ ok: true, won: result.won, chance: result.chance, boostPercent: result.boostPercent, addBalanceCents: result.addBalanceCents, item: result.item });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось выполнить апгрейд' });
  }
});

app.get('/api/live-drops', (_, res) => {
  const cached = cache.get('drops:latest');
  if (cached) return res.json(cached);
  const rows = db.prepare('SELECT * FROM live_drops ORDER BY created_at DESC LIMIT 30').all();
  const payload = rows.map(dropPayload);
  cache.set('drops:latest', payload, 5);
  res.json(payload);
});
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const account = currentUser(req);
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'local';
  const ua = req.headers['user-agent'] || '';
  const id = crypto.randomBytes(8).toString('hex');
  const entry = {
    id,
    res,
    user: account ? { id: account.id, name: account.name, avatar: account.avatar, steamid: account.steamid } : null,
    ip,
    ua,
    country: req.headers['cf-ipcountry'] || req.headers['x-country'] || '',
    connectedAt: Date.now(),
    lastAction: Date.now(),
    lastPath: '/events',
    action: 'online',
    visitorKey: account ? `user:${account.id}` : `guest:${ip}|${ua}`
  };
  onlineClients.set(id, entry);
  broadcast('online', { online: onlineCount() });
  req.on('close', () => {
    onlineClients.delete(id);
    broadcast('online', { online: onlineCount() });
  });
});
app.get('/api/online', (_, res) => res.json({ online: onlineCount() }));
app.get('/api/admin/online', requireStaff, (req, res) => {
  const list = uniqueOnlineClients().map(c => ({
    id: c.id,
    user: c.user,
    ip: c.ip,
    ua: c.ua,
    country: c.country,
    connectedAt: c.connectedAt,
    lastAction: c.lastAction,
    lastPath: c.lastPath,
    action: c.action,
    durationSec: Math.round((Date.now() - c.connectedAt)/1000)
  })).sort((a,b)=>b.connectedAt-a.connectedAt);
  res.json({ online: list.length, clients: list });
});

app.get('/api/promo/redeem', (_, res) => res.status(405).json({ error: 'Используйте POST' }));
app.post('/api/promo/redeem', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  if (account.banned) return res.status(403).json({ error: account.ban_reason || 'Аккаунт заблокирован' });
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Введите промокод' });
  try {
    const result = db.transaction(() => {
      const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
      if (!promo || !promo.active) throw new Error('Промокод не найден');
      if (promo.expires_at && promo.expires_at < Date.now()) throw new Error('Срок действия промокода истёк');
      if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) throw new Error('Лимит активаций исчерпан');
      const already = db.prepare('SELECT 1 FROM promo_redemptions WHERE promo_id = ? AND user_id = ?').get(promo.id, account.id);
      if (already) throw new Error('Вы уже использовали этот промокод');
      const now = Date.now();
      db.prepare('INSERT INTO promo_redemptions(promo_id,user_id,created_at) VALUES(?,?,?)').run(promo.id, account.id, now);
      db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
      db.prepare('UPDATE users SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?')
        .run(promo.amount_cents, now, account.id);
      const balance = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
      recordTransaction(account.id, 'promo', promo.amount_cents, balance, code, now);
      return { amountCents: promo.amount_cents, balanceCents: balance };
    })();
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось активировать промокод' });
  }
});

app.get('/api/admin/summary', requireStaff, (req, res) => {
  const staffRole = roleOf(req.account);
  const day = Date.now() - 86400000;
  const totals = {
    users: db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_bot = 0').get().c,
    bots: db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_bot = 1').get().c,
    banned: db.prepare('SELECT COUNT(*) AS c FROM users WHERE banned = 1').get().c,
    online: onlineCount(),
    balanceCents: db.prepare('SELECT COALESCE(SUM(balance_cents),0) AS s FROM users').get().s,
    casesOpened: db.prepare('SELECT COUNT(*) AS c FROM case_openings').get().c,
    casesDay: db.prepare('SELECT COUNT(*) AS c FROM case_openings WHERE created_at > ?').get(day).c,
    upgrades: db.prepare('SELECT COUNT(*) AS c FROM upgrade_rounds').get().c,
    upgradesWon: db.prepare('SELECT COUNT(*) AS c FROM upgrade_rounds WHERE won = 1').get().c,
    caseRevenue: db.prepare('SELECT COALESCE(SUM(cost_cents),0) AS s FROM case_openings').get().s,
    payouts: db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS s FROM inventory_sales').get().s,
    openTickets: db.prepare('SELECT COUNT(DISTINCT user_id) AS c FROM support_messages WHERE from_staff = 0 AND read_at IS NULL').get().c,
    activePromos: db.prepare('SELECT COUNT(*) AS c FROM promo_codes WHERE active = 1').get().c
  };
  res.json({
    role: staffRole,
    totals,
    settings: {
      caseLuck: settingGet('case_luck', 0),
      upgradeLuck: settingGet('upgrade_luck', 0)
    }
  });
});

app.get('/api/admin/users', requireStaff, (req, res) => {
  const query = `%${String(req.query.q || '').trim().toLowerCase()}%`;
  const rows = db.prepare(`
    SELECT id, steamid, name, avatar, balance_cents AS balanceCents, role, banned,
      ban_reason AS banReason, frozen, freeze_reason AS freezeReason, tags, is_bot AS isBot, luck_modifier AS luckModifier, created_at AS createdAt
    FROM users
    WHERE LOWER(name) LIKE ? OR steamid LIKE ?
    ORDER BY id DESC LIMIT 100
  `).all(query, query);
  res.json({ users: rows.map(row => ({ ...row, banned: !!row.banned, frozen: !!row.frozen, tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(), isBot: !!row.isBot })) });
});

app.get('/api/admin/users/:id', requireStaff, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const inventory = db.prepare(`
    SELECT id, item_name AS name, price_cents AS priceCents, status, created_at AS createdAt
    FROM site_inventory WHERE user_id = ? ORDER BY id DESC LIMIT 50
  `).all(id);
  const transactions = db.prepare(`
    SELECT id, kind, amount_cents AS amountCents, balance_after AS balanceAfter, note, created_at AS createdAt
    FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50
  `).all(id);
  res.json({
    user: {
      id: user.id, steamid: user.steamid, name: user.name, avatar: user.avatar,
      balanceCents: user.balance_cents, role: roleOf(user), banned: !!user.banned,
      banReason: user.ban_reason, frozen: !!user.frozen, freezeReason: user.freeze_reason || '', tags: (() => { try { return JSON.parse(user.tags || '[]'); } catch { return []; } })(), isBot: !!user.is_bot, luckModifier: user.luck_modifier,
      email: user.support_email || '', emailOptout: !!user.email_optout,
      createdAt: user.created_at
    },
    inventory, transactions
  });
});

app.post('/api/admin/users/:id/freeze', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const frozen = req.body?.frozen ? 1 : 0;
  const reason = String(req.body?.reason || '').trim().slice(0, 240);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (isStaff(user) && frozen) return res.status(400).json({ error: 'Нельзя заморозить сотрудника' });
  db.prepare('UPDATE users SET frozen=?,freeze_reason=?,updated_at=? WHERE id=?').run(frozen, frozen ? (reason || 'Аккаунт временно заморожен') : '', Date.now(), id);
  adminLog(req.account, frozen ? 'user_freeze' : 'user_unfreeze', user.name, reason);
  res.json({ ok: true, frozen: !!frozen });
});

app.post('/api/admin/users/:id/tags', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const allowed = new Set(['vip','suspicious','verified','partner']);
  const tags = [...new Set((Array.isArray(req.body?.tags) ? req.body.tags : []).map(String).filter(tag => allowed.has(tag)))];
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  db.prepare('UPDATE users SET tags=?,updated_at=? WHERE id=?').run(JSON.stringify(tags), Date.now(), id);
  adminLog(req.account, 'user_tags', user.name, tags.join(', ') || 'без меток');
  res.json({ ok: true, tags });
});

app.post('/api/admin/users/:id/balance', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const amount = Math.round(Number(req.body?.amountCents));
  const note = String(req.body?.note || 'Корректировка баланса').slice(0, 200);
  if (!Number.isSafeInteger(amount) || amount === 0) return res.status(400).json({ error: 'Укажите сумму' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const next = Number(user.balance_cents) + amount;
  if (next < 0) return res.status(400).json({ error: 'Баланс не может быть отрицательным' });
  db.prepare('UPDATE users SET balance_cents = ?, updated_at = ? WHERE id = ?').run(next, Date.now(), id);
  recordTransaction(id, amount > 0 ? 'admin_credit' : 'admin_debit', amount, next, note);
  adminLog(req.account, 'balance', user.name, `${amount > 0 ? '+' : ''}${(amount / 100).toFixed(2)} — ${note}`);
  res.json({ ok: true, balanceCents: next });
});

app.post('/api/admin/users/:id/ban', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const banned = req.body?.banned ? 1 : 0;
  const reason = String(req.body?.reason || '').slice(0, 200);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (isAdmin(user) && banned) return res.status(400).json({ error: 'Нельзя заблокировать администратора' });
  db.prepare('UPDATE users SET banned = ?, ban_reason = ?, updated_at = ? WHERE id = ?')
    .run(banned, banned ? reason : '', Date.now(), id);
  if (banned) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  adminLog(req.account, banned ? 'ban' : 'unban', user.name, reason);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const role = String(req.body?.role || 'user');
  if (!['user', 'support', 'admin'].includes(role)) return res.status(400).json({ error: 'Неизвестная роль' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (ADMIN_STEAMIDS.includes(String(user.steamid)) && role !== 'admin') {
    return res.status(400).json({ error: 'Роль задана через переменную окружения' });
  }
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, Date.now(), id);
  adminLog(req.account, 'role', user.name, role);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/luck', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const value = Math.max(-90, Math.min(300, Number(req.body?.luckModifier || 0)));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  db.prepare('UPDATE users SET luck_modifier = ?, updated_at = ? WHERE id = ?').run(value, Date.now(), id);
  adminLog(req.account, 'luck', user.name, `${value}%`);
  res.json({ ok: true, luckModifier: value });
});

app.post('/api/admin/users/:id/give', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = CATALOG_BY_ID.get(String(req.body?.catalogId || ''));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (!item) return res.status(404).json({ error: 'Предмет не найден в каталоге' });
  const inventoryId = insertInventoryItem(id, item, 'admin');
  adminLog(req.account, 'give_item', user.name, item.name);
  res.json({ ok: true, inventoryId });
});

app.get('/api/admin/transactions', requireStaff, (req, res) => {
  const kind = String(req.query.kind || '').trim();
  const rows = kind
    ? db.prepare(`
        SELECT t.id, t.user_id AS userId, u.name AS userName, t.kind, t.amount_cents AS amountCents,
          t.balance_after AS balanceAfter, t.note, t.created_at AS createdAt
        FROM transactions t LEFT JOIN users u ON u.id = t.user_id
        WHERE t.kind = ? ORDER BY t.id DESC LIMIT 200
      `).all(kind)
    : db.prepare(`
        SELECT t.id, t.user_id AS userId, u.name AS userName, t.kind, t.amount_cents AS amountCents,
          t.balance_after AS balanceAfter, t.note, t.created_at AS createdAt
        FROM transactions t LEFT JOIN users u ON u.id = t.user_id
        ORDER BY t.id DESC LIMIT 200
      `).all();
  const summary = db.prepare(`
    SELECT kind, COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS total
    FROM transactions GROUP BY kind ORDER BY total DESC
  `).all();
  res.json({ transactions: rows, summary });
});

app.get('/api/admin/cases', requireStaff, (_, res) => {
  const overrides = new Map(db.prepare('SELECT * FROM case_overrides').all().map(row => [row.case_id, row]));
  const stats = new Map(db.prepare(`
    SELECT case_id, COUNT(*) AS opened, COALESCE(SUM(cost_cents),0) AS revenue
    FROM case_openings GROUP BY case_id
  `).all().map(row => [row.case_id, row]));
  res.json({
    cases: CASES.map(item => {
      const override = overrides.get(item.id);
      const stat = stats.get(item.id) || { opened: 0, revenue: 0 };
      const view = caseView(item, null);
      const totalWeight = item.contents.reduce((s,[,w])=>s+Number(w||0),0) || 1;
      let ev = 0;
      for (const [cid,w] of item.contents) {
        const it = CATALOG_BY_ID.get(cid);
        if (!it) continue;
        ev += (Number(w)/totalWeight) * Number(it.priceCents||0);
      }
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        basePriceCents: item.priceCents,
        priceCents: view.priceCents,
        originalPriceCents: item.priceCents,
        discountPercent: item.discount_percent || 0,
        enabled: view.enabled,
        once: !!item.once,
        image: item.image || '',
        maxOpenings: item.max_openings || 0,
        totalOpened: view.totalOpened || stat.opened,
        levelMin: item.level_min || 0,
        startsAt: item.starts_at || null,
        endsAt: item.ends_at || null,
        opened: stat.opened,
        revenueCents: stat.revenue,
        evCents: Math.round(ev),
        profitCents: Math.round(view.priceCents - ev),
        contents: item.contents.map(([id, weight]) => {
          const skin = CATALOG_BY_ID.get(id);
          return { catalogId: id, name: skin?.name || id, priceCents: skin?.priceCents || 0, weight, icon: skin?.icon || '' };
        })
      };
    })
  });
});

app.post('/api/admin/cases/:id', requireAdmin, (req, res) => {
  const caseData = CASES_BY_ID.get(String(req.params.id));
  if (!caseData) return res.status(404).json({ error: 'Кейс не найден' });
  const hasPrice = req.body?.priceCents !== undefined && req.body?.priceCents !== null && req.body?.priceCents !== '';
  const price = hasPrice ? Math.max(0, Math.round(Number(req.body.priceCents))) : null;
  if (hasPrice && !Number.isSafeInteger(price)) return res.status(400).json({ error: 'Некорректная цена' });
  const enabled = req.body?.enabled === undefined ? 1 : (req.body.enabled ? 1 : 0);
  db.prepare(`
    INSERT INTO case_overrides(case_id,price_cents,enabled,updated_at) VALUES(?,?,?,?)
    ON CONFLICT(case_id) DO UPDATE SET price_cents = excluded.price_cents, enabled = excluded.enabled, updated_at = excluded.updated_at
  `).run(caseData.id, price, enabled, Date.now());
  adminLog(req.account, 'case_update', caseData.name, `price=${price ?? 'base'} enabled=${enabled}`);
  res.json({ ok: true });
});

function validateCaseInput(body) {
  const id = String(body.id || body.caseId || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const name = String(body.name || '').trim().slice(0, 80);
  const description = String(body.description || '').trim().slice(0, 300);
  const priceCents = Math.max(0, Math.round(Number(body.priceCents || 0)));
  const once = body.once ? 1 : 0;
  const enabled = body.enabled === undefined ? 1 : (body.enabled ? 1 : 0);
  const image = String(body.image || '').trim().slice(0, 300);
  const max_openings = Math.max(0, Math.round(Number(body.max_openings || body.maxOpenings || 0)));
  const level_min = Math.max(0, Math.round(Number(body.level_min || body.levelMin || 0)));
  const starts_at = body.starts_at || body.startsAt ? Number(body.starts_at || body.startsAt) : null;
  const ends_at = body.ends_at || body.endsAt ? Number(body.ends_at || body.endsAt) : null;
  const discount_percent = Math.max(0, Math.min(90, Math.round(Number(body.discount_percent || body.discountPercent || 0))));
  let contents = body.contents;
  if (typeof contents === 'string') { try { contents = JSON.parse(contents); } catch { contents = []; } }
  if (!Array.isArray(contents)) contents = [];
  const cleanContents = [];
  let totalWeight = 0;
  for (const entry of contents) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const catalogId = String(entry[0]).trim();
    const weight = Number(entry[1]);
    if (!catalogId || !CATALOG_BY_ID.has(catalogId)) continue;
    if (!Number.isFinite(weight) || weight <= 0 || weight > 10000) continue;
    cleanContents.push([catalogId, weight]);
    totalWeight += weight;
  }
  if (!id) return { error: 'Укажите ID кейса (латиница, цифры, -, _)' };
  if (!name) return { error: 'Укажите название кейса' };
  if (cleanContents.length === 0) return { error: 'Добавьте хотя бы 1 предмет с весом' };
  if (totalWeight <= 0) return { error: 'Сумма весов должна быть >0' };
  return { id, name, description, priceCents, once, enabled, image, max_openings, level_min, starts_at, ends_at, discount_percent, contents: cleanContents };
}

app.post('/api/admin/cases', requireAdmin, (req, res) => {
  const v = validateCaseInput(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  if (CASES_BY_ID.has(v.id)) return res.status(400).json({ error: 'Кейс с таким ID уже существует' });
  const now = Date.now();
  try {
    db.prepare(`INSERT INTO custom_cases(id,name,description,price_cents,once,enabled,image,max_openings,level_min,starts_at,ends_at,discount_percent,contents,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(v.id, v.name, v.description, v.priceCents, v.once, v.enabled, v.image, v.max_openings, v.level_min, v.starts_at, v.ends_at, v.discount_percent, JSON.stringify(v.contents), now, now);
    refreshCasesCache();
    adminLog(req.account, 'case_create', v.name, v.id);
    res.json({ ok: true, id: v.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/cases/:id', requireAdmin, (req, res) => {
  const existing = CASES_BY_ID.get(String(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Кейс не найден' });
  const body = { ...req.body, id: req.params.id };
  const v = validateCaseInput(body);
  if (v.error) return res.status(400).json({ error: v.error });
  const now = Date.now();
  try {
    const update = db.prepare(`UPDATE custom_cases SET name=?,description=?,price_cents=?,once=?,enabled=?,image=?,max_openings=?,level_min=?,starts_at=?,ends_at=?,discount_percent=?,contents=?,updated_at=? WHERE id=?`)
      .run(v.name, v.description, v.priceCents, v.once, v.enabled, v.image, v.max_openings, v.level_min, v.starts_at, v.ends_at, v.discount_percent, JSON.stringify(v.contents), now, v.id);
    if (!update.changes) return res.status(404).json({ error: 'Кейс отсутствует в базе данных' });
    db.prepare('DELETE FROM case_overrides WHERE case_id = ?').run(v.id);
    refreshCasesCache();
    adminLog(req.account, 'case_edit', v.name, v.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/cases/:id', requireAdmin, (req, res) => {
  const id = String(req.params.id);
  if (DEFAULT_CASES.some(c=>c.id===id) && !req.query.force) {
    return res.status(400).json({ error: 'Стандартный кейс нельзя удалить без ?force=1, можно только выключить' });
  }
  try {
    db.prepare('DELETE FROM custom_cases WHERE id=?').run(id);
    db.prepare('DELETE FROM case_overrides WHERE case_id=?').run(id);
    refreshCasesCache();
    adminLog(req.account, 'case_delete', id, '');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/cases/upload', requireAdmin, (req, res) => {
  try {
    const filename = String(req.body?.filename || '').trim().replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 80) || `case-${Date.now()}.png`;
    const data = String(req.body?.data || req.body?.base64 || '');
    if (!data) return res.status(400).json({ error: 'Нет данных файла' });
    let base64 = data;
    if (base64.includes(',')) base64 = base64.split(',').pop();
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Файл слишком большой (макс 4MB)' });
    const ext = path.extname(filename).toLowerCase();
    if (!['.png','.jpg','.jpeg','.webp','.svg'].includes(ext)) return res.status(400).json({ error: 'Разрешены только png/jpg/webp/svg' });
    ensureCasesDir();
    const safeName = filename.replace(/[^a-z0-9_.-]/gi, '_');
    const fullPath = path.join(__dirname, 'static', 'cases', safeName);
    fs.writeFileSync(fullPath, buffer);
    const url = `/static/cases/${safeName}`;
    adminLog(req.account, 'case_image_upload', safeName, `${buffer.length} bytes`);
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/cases/preview/:id', requireStaff, (req, res) => {
  const caseData = CASES_BY_ID.get(String(req.params.id));
  if (!caseData) return res.status(404).json({ error: 'Кейс не найден' });
  const totalWeight = caseData.contents.reduce((s,[,w])=>s+Number(w||0),0) || 1;
  let ev = 0;
  for (const [cid, w] of caseData.contents) {
    const item = CATALOG_BY_ID.get(cid);
    if (!item) continue;
    ev += (Number(w)/totalWeight) * Number(item.priceCents||0);
  }
  const discount = Number(caseData.discount_percent||0);
  const price = caseData.priceCents;
  const finalPrice = discount ? Math.round(price * (100-Math.min(90,discount))/100) : price;
  const profit = finalPrice - ev;
  const roi = finalPrice ? (profit/finalPrice*100) : 0;
  res.json({ id: caseData.id, name: caseData.name, totalWeight, evCents: Math.round(ev), priceCents: price, finalPriceCents: finalPrice, profitCents: Math.round(profit), roi: Math.round(roi*100)/100 });
});

app.get('/api/admin/drops', requireStaff, (_, res) => {
  const rows = db.prepare(`
    SELECT id, user_name AS userName, item_name AS itemName, price_cents AS priceCents,
      rarity, source, created_at AS createdAt
    FROM live_drops ORDER BY id DESC LIMIT 100
  `).all();
  res.json({ drops: rows });
});

app.delete('/api/admin/drops/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM live_drops WHERE id = ?').run(Number(req.params.id));
  adminLog(req.account, 'drop_delete', req.params.id, '');
  res.json({ ok: true });
});

app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const caseLuck = Math.max(-90, Math.min(300, Number(req.body?.caseLuck ?? 0)));
  const upgradeLuck = Math.max(-90, Math.min(300, Number(req.body?.upgradeLuck ?? 0)));
  settingSet('case_luck', caseLuck);
  settingSet('upgrade_luck', upgradeLuck);
  adminLog(req.account, 'settings', 'coefficients', `case=${caseLuck}% upgrade=${upgradeLuck}%`);
  res.json({ ok: true, caseLuck, upgradeLuck });
});

app.get('/api/admin/bots', requireStaff, (_, res) => {
  const rows = db.prepare(`
    SELECT id, name, avatar, balance_cents AS balanceCents, created_at AS createdAt
    FROM users WHERE is_bot = 1 ORDER BY id DESC LIMIT 100
  `).all();
  res.json({ bots: rows });
});

app.post('/api/admin/bots', requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: 'Укажите имя бота' });
  const now = Date.now();
  const steamid = `bot:${crypto.randomBytes(8).toString('hex')}`;
  const id = Number(db.prepare(`
    INSERT INTO users(steamid,name,avatar,balance_cents,is_bot,created_at,updated_at)
    VALUES(?,?,?,?,1,?,?)
  `).run(steamid, name, '', 0, now, now).lastInsertRowid);
  adminLog(req.account, 'bot_create', name, '');
  res.json({ ok: true, id });
});

app.delete('/api/admin/bots/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const bot = db.prepare('SELECT * FROM users WHERE id = ? AND is_bot = 1').get(id);
  if (!bot) return res.status(404).json({ error: 'Бот не найден' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  adminLog(req.account, 'bot_delete', bot.name, '');
  res.json({ ok: true });
});

app.post('/api/admin/bots/:id/drop', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const bot = db.prepare('SELECT * FROM users WHERE id = ? AND is_bot = 1').get(id);
  if (!bot) return res.status(404).json({ error: 'Бот не найден' });
  const item = req.body?.catalogId
    ? CATALOG_BY_ID.get(String(req.body.catalogId))
    : CATALOG[crypto.randomInt(0, CATALOG.length)];
  if (!item) return res.status(404).json({ error: 'Предмет не найден' });
  const drop = addLiveDrop(bot.id, bot.name, item, 'case');
  broadcast('drop', drop);
  adminLog(req.account, 'bot_drop', bot.name, item.name);
  res.json({ ok: true, drop });
});

app.get('/api/admin/promos', requireStaff, (_, res) => {
  const rows = db.prepare(`
    SELECT id, code, kind, amount_cents AS amountCents, max_uses AS maxUses,
      used_count AS usedCount, expires_at AS expiresAt, active, created_at AS createdAt
    FROM promo_codes ORDER BY id DESC LIMIT 100
  `).all();
  res.json({ promos: rows.map(row => ({ ...row, active: !!row.active })) });
});

app.post('/api/admin/promos', requireAdmin, (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase().slice(0, 32);
  const amount = Math.max(0, Math.round(Number(req.body?.amountCents || 0)));
  const maxUses = Math.max(0, Math.round(Number(req.body?.maxUses || 0)));
  const days = Math.max(0, Number(req.body?.days || 0));
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return res.status(400).json({ error: 'Код: 3-32 символа A-Z, 0-9, _ или -' });
  if (!amount) return res.status(400).json({ error: 'Укажите сумму бонуса' });
  const exists = db.prepare('SELECT 1 FROM promo_codes WHERE code = ?').get(code);
  if (exists) return res.status(400).json({ error: 'Такой промокод уже есть' });
  db.prepare(`
    INSERT INTO promo_codes(code,kind,amount_cents,max_uses,expires_at,active,created_at)
    VALUES(?,'balance',?,?,?,1,?)
  `).run(code, amount, maxUses, days ? Date.now() + days * 86400000 : null, Date.now());
  adminLog(req.account, 'promo_create', code, `${(amount / 100).toFixed(2)} x${maxUses || '∞'}`);
  res.json({ ok: true });
});

app.post('/api/admin/promos/:id/toggle', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(id);
  if (!promo) return res.status(404).json({ error: 'Промокод не найден' });
  db.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(promo.active ? 0 : 1, id);
  adminLog(req.account, 'promo_toggle', promo.code, promo.active ? 'off' : 'on');
  res.json({ ok: true });
});

app.delete('/api/admin/promos/:id', requireAdmin, (req, res) => {
  const promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(Number(req.params.id));
  if (!promo) return res.status(404).json({ error: 'Промокод не найден' });
  db.prepare('DELETE FROM promo_codes WHERE id = ?').run(promo.id);
  adminLog(req.account, 'promo_delete', promo.code, '');
  res.json({ ok: true });
});

const supportTyping = new Map();
function addTicketHistory(userId, staffId, event, oldValue, newValue) {
  db.prepare('INSERT INTO support_ticket_history(user_id,staff_id,event,old_value,new_value,created_at) VALUES(?,?,?,?,?,?)')
    .run(userId, staffId || null, event, String(oldValue || ''), String(newValue || ''), Date.now());
}

app.get('/api/admin/support', requireStaff, (_, res) => {
  purgeClosedSupportTickets();
  const threads = db.prepare(`
    SELECT u.id AS userId, u.name AS userName, u.avatar, u.support_email AS email,
      COUNT(m.id) AS messages,
      SUM(CASE WHEN m.from_staff = 0 AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread,
      MAX(m.created_at) AS lastAt,
      COALESCE(t.status, 'open') AS status, COALESCE(t.category, 'account') AS category, COALESCE(t.priority, 'normal') AS priority, t.closed_at AS closedAt, t.purge_at AS purgeAt
    FROM support_messages m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN support_tickets t ON t.user_id = u.id
    GROUP BY u.id, t.status, t.category, t.priority, t.closed_at, t.purge_at
    ORDER BY MAX(m.created_at) DESC LIMIT 50
  `).all();
  res.json({ threads });
});

app.get('/api/admin/support/:userId', requireStaff, (req, res) => {
  purgeClosedSupportTickets();
  const userId = Number(req.params.userId);
  const user = db.prepare('SELECT id, name, avatar, support_email AS email FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const messages = db.prepare(`
    SELECT id, message, from_staff AS fromStaff, created_at AS createdAt
    FROM support_messages WHERE user_id = ? ORDER BY id ASC LIMIT 200
  `).all(userId);
  if (!messages.length) return res.status(404).json({ error: 'Тикет удалён или не существует' });
  const ticket = db.prepare("SELECT status, category, priority, updated_at AS updatedAt, closed_at AS closedAt, purge_at AS purgeAt FROM support_tickets WHERE user_id = ?").get(userId)
    || { status: 'open', category: 'account', priority: 'normal', updatedAt: Date.now(), closedAt: null, purgeAt: null };
  db.prepare('UPDATE support_messages SET read_at = ? WHERE user_id = ? AND from_staff = 0 AND read_at IS NULL')
    .run(Date.now(), userId);
  const history = db.prepare(`SELECT h.id,h.event,h.old_value AS oldValue,h.new_value AS newValue,h.created_at AS createdAt,
    COALESCE(u.name,'Система') AS staffName FROM support_ticket_history h LEFT JOIN users u ON u.id=h.staff_id
    WHERE h.user_id=? ORDER BY h.id DESC LIMIT 50`).all(userId);
  const typing = supportTyping.get(userId);
  const typingStaff = typing && typing.expiresAt > Date.now() && typing.staffId !== req.account.id ? typing.staffName : '';
  res.json({ user, ticket, history, typingStaff, messages: messages.map(row => ({ ...row, fromStaff: !!row.fromStaff })) });
});

app.post('/api/admin/support/:userId', requireStaff, (req, res) => {
  const userId = Number(req.params.userId);
  const message = String(req.body?.message || '').trim().slice(0, 1000);
  if (!message) return res.status(400).json({ error: 'Пустое сообщение' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const now = Date.now();
  db.transaction(() => {
    db.prepare('INSERT INTO support_messages(user_id,message,from_staff,staff_id,created_at) VALUES(?,?,1,?,?)')
      .run(userId, message, req.account.id, now);
    db.prepare(`INSERT INTO support_tickets(user_id,status,updated_at,closed_at,purge_at) VALUES(?,'pending',?,NULL,NULL)
      ON CONFLICT(user_id) DO UPDATE SET status='pending',updated_at=excluded.updated_at,closed_at=NULL,purge_at=NULL`).run(userId, now);
  })();
  addTicketHistory(userId, req.account.id, 'reply', '', message.slice(0, 120));
  supportTyping.delete(userId);
  adminLog(req.account, 'support_reply', user.name, message.slice(0, 60));
  try { notifyStaffReply(userId, message); } catch (_) {}
  res.json({ ok: true, status: 'pending' });
});

app.patch('/api/admin/support/:userId/status', requireStaff, (req, res) => {
  const userId = Number(req.params.userId);
  const status = String(req.body?.status || '');
  if (!['open', 'pending', 'closed'].includes(status)) return res.status(400).json({ error: 'Неизвестный статус тикета' });
  const exists = db.prepare('SELECT 1 FROM support_messages WHERE user_id = ? LIMIT 1').get(userId);
  if (!exists) return res.status(404).json({ error: 'Тикет не найден' });
  const previous = db.prepare('SELECT status FROM support_tickets WHERE user_id=?').get(userId)?.status || 'open';
  const now = Date.now();
  const closedAt = status === 'closed' ? now : null;
  const purgeAt = status === 'closed' ? now + 5 * 60_000 : null;
  db.prepare(`INSERT INTO support_tickets(user_id,status,updated_at,closed_at,purge_at) VALUES(?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at,closed_at=excluded.closed_at,purge_at=excluded.purge_at`)
    .run(userId, status, now, closedAt, purgeAt);
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
  addTicketHistory(userId, req.account.id, 'status', previous, status);
  adminLog(req.account, 'support_status', user?.name || String(userId), status);
  if (status === 'closed') setTimeout(() => { try { purgeClosedSupportTickets(); } catch (_) {} }, 5 * 60_000 + 1000).unref?.();
  res.json({ ok: true, status, closedAt, purgeAt });
});

app.patch('/api/admin/support/:userId/meta', requireStaff, (req, res) => {
  const userId = Number(req.params.userId);
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE user_id=?').get(userId);
  if (!ticket) return res.status(404).json({ error: 'Тикет не найден' });
  const categories = ['payments','withdrawal','account','errors'];
  const priorities = ['low','normal','high','critical'];
  const category = categories.includes(String(req.body?.category)) ? String(req.body.category) : ticket.category;
  const priority = priorities.includes(String(req.body?.priority)) ? String(req.body.priority) : ticket.priority;
  db.prepare('UPDATE support_tickets SET category=?,priority=?,updated_at=? WHERE user_id=?').run(category, priority, Date.now(), userId);
  if (category !== ticket.category) addTicketHistory(userId, req.account.id, 'category', ticket.category, category);
  if (priority !== ticket.priority) addTicketHistory(userId, req.account.id, 'priority', ticket.priority, priority);
  adminLog(req.account, 'support_meta', String(userId), `category=${category} priority=${priority}`);
  res.json({ ok:true, category, priority });
});

app.post('/api/admin/support/:userId/typing', requireStaff, (req, res) => {
  const userId = Number(req.params.userId);
  supportTyping.set(userId, { staffId:req.account.id, staffName:req.account.name, expiresAt:Date.now()+5000 });
  res.json({ ok:true });
});

app.get('/api/admin/logs', requireStaff, (req, res) => {
  const qAdmin = String(req.query.admin || '').trim();
  const qAction = String(req.query.action || '').trim();
  const qSearch = String(req.query.q || '').trim();
  const from = Number(req.query.from) || 0;
  const to = Number(req.query.to) || 0;
  const limit = Math.min(500, Math.max(20, Number(req.query.limit) || 200));
  let sql = 'SELECT id, admin_name AS adminName, action, target, details, created_at AS createdAt FROM admin_logs WHERE 1=1';
  const params = [];
  if (qAdmin) { sql += ' AND admin_name LIKE ?'; params.push(`%${qAdmin}%`); }
  if (qAction) { sql += ' AND action = ?'; params.push(qAction); }
  if (qSearch) { sql += ' AND (target LIKE ? OR details LIKE ? OR admin_name LIKE ?)'; params.push(`%${qSearch}%`,`%${qSearch}%`,`%${qSearch}%`); }
  if (from) { sql += ' AND created_at >= ?'; params.push(from); }
  if (to) { sql += ' AND created_at <= ?'; params.push(to); }
  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(limit);
  let logs = [];
  try { logs = db.prepare(sql).all(...params); } catch { logs = db.prepare('SELECT id, admin_name AS adminName, action, target, details, created_at AS createdAt FROM admin_logs ORDER BY id DESC LIMIT 200').all(); }
  const memory = process.memoryUsage();
  const actions = db.prepare('SELECT DISTINCT action FROM admin_logs ORDER BY action').all().map(r=>r.action);
  const admins = db.prepare('SELECT DISTINCT admin_name AS name FROM admin_logs ORDER BY admin_name').all().map(r=>r.name);
  res.json({
    logs,
    filters: { admins, actions },
    infra: {
      database: db.describe(),
      databaseDriver: db.driver,
      cache: cache.describe(),
      cacheDriver: cache.driver,
      cacheReady: !!cache.ready,
      queue: queue.stats(),
      recentJobs: queue.recent(),
      failedJobs: queue.failures(),
      rateLimit: `${process.env.RATE_LIMIT || 120} запросов / ${process.env.RATE_WINDOW || 60} c`
    },
    system: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(memory.rss / 1048576),
      heapMb: Math.round(memory.heapUsed / 1048576),
      nodeVersion: process.version,
      online: onlineCount(),
      catalogSize: CATALOG.length,
      dbSizeMb: (() => {
        try { return Math.round(fs.statSync(DB_PATH).size / 1048576 * 10) / 10; } catch { return 0; }
      })(),
      startedAt: Date.now() - Math.round(process.uptime() * 1000)
    }
  });
});

app.get('/api/support/contact', (req, res) => {
  const account = currentUser(req);
  res.json({ authenticated: !!account, email: account?.support_email || '' });
});
app.post('/api/support/contact', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) || email.length > 160) {
    return res.status(400).json({ error: 'Введите корректный email' });
  }
  db.prepare('UPDATE users SET support_email = ?, updated_at = ? WHERE id = ?')
    .run(email, Date.now(), account.id);
  res.json({ ok: true, email });
});
app.get('/api/support/messages', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'login_required' });
  const messages = db.prepare(`SELECT id,message,from_staff AS fromStaff,created_at AS createdAt FROM support_messages
    WHERE user_id = ? ORDER BY id DESC LIMIT 50`).all(account.id).reverse().map(row => ({ ...row, fromStaff: !!row.fromStaff }));
  const ticket = db.prepare('SELECT status,category,priority,updated_at AS updatedAt FROM support_tickets WHERE user_id=?').get(account.id) || null;
  res.json({ messages, ticket });
});
app.post('/api/support/messages', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'login_required' });
  const message = String(req.body?.message || '').trim();
  const categories = ['payments','withdrawal','account','errors'];
  const category = categories.includes(String(req.body?.category)) ? String(req.body.category) : 'account';
  if (!message || message.length > 2000) return res.status(400).json({ error: 'invalid_message' });
  const now = Date.now();
  let result;
  db.transaction(() => {
    result = db.prepare('INSERT INTO support_messages(user_id,message,created_at) VALUES(?,?,?)').run(account.id, message, now);
    db.prepare(`INSERT INTO support_tickets(user_id,status,category,priority,updated_at,closed_at,purge_at) VALUES(?,'open',?,'normal',?,NULL,NULL)
      ON CONFLICT(user_id) DO UPDATE SET status='open',category=excluded.category,updated_at=excluded.updated_at,closed_at=NULL,purge_at=NULL`).run(account.id, category, now);
  })();
  addTicketHistory(account.id, null, 'message', '', message.slice(0,120));
  queue.publish('support.notify', { userId: account.id, message, createdAt: now });
  broadcast('support-ticket', { userId:account.id, userName:account.name, category, priority:'normal', message:message.slice(0,120), createdAt:now });
  res.json({ id: Number(result.lastInsertRowid), message, createdAt: now });
});

app.get('/api/notifications', (req, res) => {
  const now = Date.now();
  const rows = db.prepare(`
    SELECT id, title, body, kind, audience, created_at AS createdAt, expires_at AS expiresAt
    FROM notifications
    WHERE (expires_at IS NULL OR expires_at > ?) AND (scheduled_at IS NULL OR scheduled_at <= ?)
    ORDER BY id DESC LIMIT 20
  `).all(now, now);
  res.json({ notifications: rows });
});

app.get('/api/unsubscribe', (req, res) => {
  const userId = Number(req.query.u);
  const token = String(req.query.t || '');
  if (!Number.isSafeInteger(userId) || !token) return res.status(400).send('Некорректная ссылка');
  if (!mailer.verifyUnsubscribeToken(userId, token)) return res.status(400).send('Ссылка устарела');
  const user = db.prepare('SELECT id, email_optout FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).send('Пользователь не найден');
  if (!user.email_optout) db.prepare('UPDATE users SET email_optout = 1 WHERE id = ?').run(userId);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<!doctype html><meta charset="utf-8"><title>Отписка</title><div style="font-family:Segoe UI,Roboto,sans-serif;text-align:center;padding:60px;color:#e6e9ee;background:#0a0b0f;min-height:100vh"><h2>Вы отписаны от рассылки</h2><p>Мы больше не будем присылать вам письма.</p><p><a style="color:#56a8ff" href="/">Вернуться на сайт</a></p></div>');
});
app.post('/api/unsubscribe', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'login_required' });
  const optout = req.body?.optout !== false;
  db.prepare('UPDATE users SET email_optout = ? WHERE id = ?').run(optout ? 1 : 0, account.id);
  res.json({ ok: true, optout });
});

app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
  const title = String(req.body?.title || '').trim().slice(0, 120);
  const body = String(req.body?.body || '').trim().slice(0, 1000);
  const audience = String(req.body?.audience || 'all');
  const ttlHours = Math.max(0, Math.min(720, Number(req.body?.ttlHours || 24)));
  const scheduledAt = Number(req.body?.scheduledAt || 0) || null;
  if (!title || !body) return res.status(400).json({ error: 'Укажите заголовок и текст' });
  if (!['all', 'authenticated', 'guests'].includes(audience)) return res.status(400).json({ error: 'Некорректная аудитория' });
  const now = Date.now();
  const expires = ttlHours ? now + ttlHours * 3600000 : null;
  const sendNow = !scheduledAt || scheduledAt <= now;
  const result = db.prepare(`INSERT INTO notifications(title,body,kind,audience,created_at,expires_at,scheduled_at,sent_at)
    VALUES(?,?,?,?,?,?,?,?)`).run(title, body, 'broadcast', audience, now, expires, scheduledAt, sendNow ? now : null);
  if (sendNow) broadcast('notify', { id: Number(result.lastInsertRowid), title, body, audience, createdAt: now });
  adminLog(req.account, 'broadcast', title, scheduledAt ? `Запланировано: ${new Date(scheduledAt).toISOString()}` : body.slice(0, 100));
  res.json({ ok: true, id: Number(result.lastInsertRowid) });
});

app.get('/api/admin/broadcasts', requireStaff, (_, res) => {
  const rows = db.prepare(`
    SELECT id, title, body, kind, audience, created_at AS createdAt, expires_at AS expiresAt, scheduled_at AS scheduledAt, sent_at AS sentAt
    FROM notifications ORDER BY id DESC LIMIT 50
  `).all();
  res.json({ broadcasts: rows });
});

app.delete('/api/admin/broadcasts/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(Number(req.params.id));
  adminLog(req.account, 'broadcast_delete', req.params.id, '');
  res.json({ ok: true });
});

function sendScheduledNotifications() {
  const now = Date.now();
  const rows = db.prepare(`SELECT id,title,body,audience,created_at AS createdAt FROM notifications
    WHERE sent_at IS NULL AND scheduled_at IS NOT NULL AND scheduled_at <= ? AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY id ASC LIMIT 50`).all(now, now);
  for (const row of rows) {
    broadcast('notify', row);
    db.prepare('UPDATE notifications SET sent_at=? WHERE id=?').run(now, row.id);
  }
}
setInterval(() => { try { sendScheduledNotifications(); } catch (_) {} }, 30_000).unref();

app.get('/api/admin/site', requireStaff, (_req, res) => {
  let banner = null;
  try { banner = JSON.parse(settingGetRaw('site_banner','null')); } catch {}
  res.json({
    brand: settingGetRaw('site_brand', BRAND_NAME), telegram: settingGetRaw('site_telegram', TELEGRAM_URL),
    supportEmail: settingGetRaw('site_support_email','support@caser.gg'), marketingEmail: settingGetRaw('site_marketing_email','marketing@caser.gg'),
    maintenance: settingGetRaw('maintenance',''), banner
  });
});
app.post('/api/admin/site', requireAdmin, (req, res) => {
  const brand = String(req.body?.brand || BRAND_NAME).trim().slice(0,60);
  const telegram = String(req.body?.telegram || TELEGRAM_URL).trim().slice(0,240);
  const supportEmail = String(req.body?.supportEmail || '').trim().slice(0,160);
  const marketingEmail = String(req.body?.marketingEmail || '').trim().slice(0,160);
  const banner = req.body?.banner && typeof req.body.banner === 'object' ? {
    enabled: !!req.body.banner.enabled, title:String(req.body.banner.title||'').slice(0,120), body:String(req.body.banner.body||'').slice(0,500),
    link:String(req.body.banner.link||'').slice(0,300), tone:['info','warning','danger','success'].includes(req.body.banner.tone)?req.body.banner.tone:'info'
  } : null;
  settingSet('site_brand', brand); settingSet('site_telegram', telegram); settingSet('site_support_email', supportEmail); settingSet('site_marketing_email', marketingEmail); settingSet('site_banner', JSON.stringify(banner));
  adminLog(req.account,'site_config',brand,banner?.enabled?'Баннер включён':'Баннер выключен');
  res.json({ok:true,brand,telegram,supportEmail,marketingEmail,banner});
});

app.post('/api/admin/maintenance', requireAdmin, (req, res) => {
  const enabled = !!req.body?.enabled;
  const message = String(req.body?.message || '').slice(0, 300);
  if (enabled) settingSet('maintenance', message || 'Технические работы');
  else db.prepare("DELETE FROM settings WHERE key = 'maintenance'").run();
  adminLog(req.account, 'maintenance', enabled ? 'on' : 'off', message);
  res.json({ ok: true, enabled, message: enabled ? settingGetRaw('maintenance', '') : '' });
});

app.post('/api/admin/catalog/rebuild', requireAdmin, async (req, res) => {
  try {
    await buildFullCatalog();
    adminLog(req.account, 'catalog_rebuild', '', '');
    res.json({ ok: true, size: CATALOG.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/prices/refresh', requireAdmin, async (req, res) => {
  const limit = Math.max(0, Math.min(5000, Number(req.body?.limit || 50)));
  const full = !!req.body?.full;
  try {
    if (full) {
      if (PRICE_LOADING) return res.json({ ok: true, alreadyRunning: true, ...PRICE_PROGRESS });
      res.json({ ok: true, started: true, total: CATALOG.length });
      refreshAllSteamPrices().catch(() => {});
      return;
    }
    const result = await refreshSteamPrices(limit);
    adminLog(req.account, 'prices_refresh', '', `updated=${result.updated}`);
    res.json({ ok: true, ...result, size: CATALOG.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getPriceManagerConfig() {
  return {
    workers:Number(settingGetRaw('price_workers','12')) || 12,
    timeoutMs:Number(settingGetRaw('proxy_timeout_ms','4000')) || 4000,
    maxFailures:Number(settingGetRaw('proxy_max_failures','3')) || 3,
    block429Minutes:Number(settingGetRaw('proxy_block_429_minutes','30')) || 30,
    checkIntervalMinutes:Number(settingGetRaw('proxy_check_interval_minutes','15')) || 15,
    minInterval:Number(settingGetRaw('price_min_interval','400')) || 400,
    source:settingGetRaw('price_source','auto'), alertPercent:Number(settingGetRaw('price_alert_percent','35')) || 35
  };
}
function applyPriceManagerConfig() {
  const config = getPriceManagerConfig();
  global.__priceQueue?.configure?.(config);
  return config;
}
applyPriceManagerConfig();
let lastScheduledProxyCheck = Date.now();
setInterval(async () => {
  const config = getPriceManagerConfig();
  if (Date.now()-lastScheduledProxyCheck < config.checkIntervalMinutes*60000) return;
  lastScheduledProxyCheck=Date.now();
  const manager=global.__priceQueue;
  if (!manager?.stats?.().proxies || manager.stats().validating) return;
  try { await manager.validateCurrentProxies({concurrency:config.workers,timeoutMs:config.timeoutMs,persist:true}); } catch (_) {}
},60_000).unref();

app.get('/api/admin/prices/config', requireStaff, (_req,res)=>res.json(getPriceManagerConfig()));
app.post('/api/admin/prices/config', requireAdmin, (req,res)=>{
  const source=['steam','skinport','auto'].includes(String(req.body?.source))?String(req.body.source):'auto';
  const values={
    price_workers:Math.max(1,Math.min(24,Number(req.body?.workers)||12)), proxy_timeout_ms:Math.max(1500,Math.min(15000,Number(req.body?.timeoutMs)||4000)),
    proxy_max_failures:Math.max(1,Math.min(20,Number(req.body?.maxFailures)||3)), proxy_block_429_minutes:Math.max(1,Math.min(1440,Number(req.body?.block429Minutes)||30)),
    proxy_check_interval_minutes:Math.max(5,Math.min(1440,Number(req.body?.checkIntervalMinutes)||15)), price_min_interval:Math.max(100,Math.min(10000,Number(req.body?.minInterval)||400)),
    price_source:source, price_alert_percent:Math.max(5,Math.min(500,Number(req.body?.alertPercent)||35))
  };
  for(const [key,value] of Object.entries(values)) settingSet(key,String(value));
  const config=applyPriceManagerConfig(); adminLog(req.account,'price_config','',JSON.stringify(config)); res.json({ok:true,...config});
});
app.get('/api/admin/prices/history', requireStaff, (req,res)=>{
  const query=String(req.query.q||'').trim(); const rows=query?
    db.prepare(`SELECT market_hash_name AS marketHashName,price,source,change_percent AS changePercent,created_at AS createdAt FROM steam_price_history WHERE market_hash_name LIKE ? ORDER BY id DESC LIMIT 200`).all(`%${query}%`):
    db.prepare(`SELECT market_hash_name AS marketHashName,price,source,change_percent AS changePercent,created_at AS createdAt FROM steam_price_history ORDER BY id DESC LIMIT 200`).all();
  res.json({history:rows});
});
app.post('/api/admin/proxies/import', requireAdmin, async (req,res)=>{
  const text=String(req.body?.text||'').slice(0,500000); const values=text.split(/[\r\n,;\s]+/).map(value=>value.trim()).filter(Boolean).slice(0,1000);
  if(!values.length)return res.status(400).json({error:'Файл не содержит прокси'});
  const manager=global.__priceQueue; const checked=await manager.validateProxies(values,{concurrency:getPriceManagerConfig().workers,timeoutMs:getPriceManagerConfig().timeoutMs});
  manager.replaceProxyPool(checked.workingUrls); manager.applyValidationResults(checked.results); manager.persistProxyPool();
  adminLog(req.account,'proxy_import','',`checked=${checked.checked} working=${checked.working}`); res.json({ok:true,...checked,results:undefined});
});
app.get('/api/admin/proxies/export', requireAdmin, (_req,res)=>{
  const rows=(global.__priceQueue?.stats?.().proxyStats||[]).filter(proxy=>!proxy.blocked&&proxy.success>0).map(proxy=>proxy.url.replace(/^https?:\/\//,''));
  res.type('text/plain').setHeader('Content-Disposition','attachment; filename="working-proxies.txt"'); res.send(rows.join('\n')+(rows.length?'\n':''));
});
app.post('/api/admin/proxies/retest', requireAdmin, async (req,res)=>{
  const url=String(req.body?.url||''); const manager=global.__priceQueue; const checked=await manager.validateProxies([url],{concurrency:1,timeoutMs:getPriceManagerConfig().timeoutMs});
  if(checked.working){const current=manager.stats().proxyStats.map(proxy=>proxy.url);manager.replaceProxyPool([...current,...checked.workingUrls]);manager.applyValidationResults(checked.results);manager.persistProxyPool();}
  res.json({ok:!!checked.working,result:checked.results[0]});
});

app.get('/api/admin/prices/status', requireStaff, (_req, res) => {
  const cached = db.prepare('SELECT COUNT(*) c FROM steam_prices').get().c;
  const withPrice = CATALOG.filter(i => i.priceCents > 0).length;
  res.json({
    loading: PRICE_LOADING,
    progress: PRICE_PROGRESS,
    cachedPrices: cached,
    catalogItems: CATALOG.length,
    withPrice,
    speedHistory: PRICE_SPEED_HISTORY,
    estimated: CATALOG.filter(item => item._isEstimated).length
  });
});

app.post('/api/admin/cache/clear', requireAdmin, (req, res) => {
  cache.del('catalog:public');
  cache.del('drops:latest');
  cache.del('stats:global');
  adminLog(req.account, 'cache_clear', '', '');
  res.json({ ok: true });
});

app.get('/api/admin/backup/download', requireAdmin, (req, res) => {
  try {
    try { db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').run(); } catch {}
    const file = DB_PATH;
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'База не найдена' });
    const stat = fs.statSync(file);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.sqlite"`);
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(file);
    stream.pipe(res);
    adminLog(req.account, 'backup_download', '', `${Math.round(stat.size/1024)}KB`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/cleanup', requireAdmin, (req, res) => {
  const type = String(req.body?.type || '').trim();
  const days = Math.max(1, Math.min(365, Number(req.body?.days || 30)));
  const before = Date.now() - days * 86400000;
  let deleted = 0;
  try {
    if (type === 'drops' || type === 'all') {
      const r = db.prepare('DELETE FROM live_drops WHERE created_at < ?').run(before);
      deleted += r.changes;
    }
    if (type === 'emails' || type === 'all') {
      const r = db.prepare('DELETE FROM email_messages WHERE created_at < ? AND status != \'pending\'').run(before);
      deleted += r.changes;
    }
    if (type === 'logs' || type === 'all') {
      const r = db.prepare('DELETE FROM admin_logs WHERE created_at < ?').run(before);
      deleted += r.changes;
    }
    if (type === 'sessions' || type === 'all') {
      const r = db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
      deleted += r.changes;
    }
    if (type === 'prices') {
      const r = db.prepare('DELETE FROM steam_prices WHERE updated_at < ?').run(before);
      deleted += r.changes;
      try {
        const cacheFile = path.join(__dirname, 'data', 'steam-price-cache.json');
        if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
        if (global.__priceQueue && global.__priceQueue.clear) global.__priceQueue.clear();
      } catch {}
    }
    adminLog(req.account, 'cleanup', type, `days=${days} deleted=${deleted}`);
    cache.del('drops:latest');
    cache.del('stats:global');
    res.json({ ok: true, deleted });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/prices/queue/status', requireStaff, (req, res) => {
  const pq = global.__priceQueue || { paused: false, stats: () => ({}) };
  const s = pq.stats ? pq.stats() : {};
  res.json({ paused: !!pq.paused, ...s, loading: PRICE_LOADING, progress: PRICE_PROGRESS });
});
app.post('/api/admin/prices/queue/pause', requireAdmin, (req, res) => {
  if (global.__priceQueue) global.__priceQueue.pause();
  adminLog(req.account, 'price_queue_pause', '', '');
  res.json({ ok: true, paused: true });
});
app.post('/api/admin/prices/queue/resume', requireAdmin, (req, res) => {
  if (global.__priceQueue) global.__priceQueue.resume();
  adminLog(req.account, 'price_queue_resume', '', '');
  res.json({ ok: true, paused: false });
});
app.post('/api/admin/prices/queue/clear', requireAdmin, (req, res) => {
  try {
    const cacheFile = path.join(__dirname, 'data', 'steam-price-cache.json');
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
    if (global.__priceQueue && global.__priceQueue.clear) global.__priceQueue.clear();
    db.prepare('DELETE FROM steam_prices').run();
    cache.del('catalog:public');
    adminLog(req.account, 'price_queue_clear', '', '');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/proxies', requireStaff, (req, res) => {
  const pq = global.__priceQueue;
  const stats = pq && pq.stats ? pq.stats() : { proxies: 0, proxyStats: [] };
  let fileList = [];
  try {
    const txtPath = path.join(__dirname, 'data', 'proxies.txt');
    if (fs.existsSync(txtPath)) {
      fileList = fs.readFileSync(txtPath, 'utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,200);
    }
  } catch {}
  res.json({ count: stats.proxies || 0, proxies: stats.proxyStats || [], fileList, env: (process.env.PROXY_LIST||'').slice(0,500) });
});

app.post('/api/admin/proxies/add', requireAdmin, async (req, res) => {
  const url = String(req.body?.url || req.body?.proxy || '').trim();
  if (!url) return res.status(400).json({ error: 'Укажи прокси в формате ip:port или http://ip:port' });
  const priceQueue = global.__priceQueue;
  if (!priceQueue?.validateProxies) return res.status(503).json({ error: 'Очередь цен недоступна' });
  const checked = await priceQueue.validateProxies([url], { concurrency: 1, timeoutMs: 6000 });
  if (!checked.working) {
    const reason = checked.results?.[0]?.error || 'прокси не отвечает через Steam';
    return res.status(400).json({ error: `Прокси отклонён: ${reason}` });
  }
  const current = priceQueue.stats().proxyStats.map(proxy => proxy.url);
  priceQueue.replaceProxyPool([...current, ...checked.workingUrls]);
  priceQueue.applyValidationResults(checked.results);
  priceQueue.persistProxyPool();
  adminLog(req.account, 'proxy_add', url, 'Проверен через Steam');
  res.json({ ok: true, count: priceQueue.stats().proxies, latency: checked.results[0].latency });
});

app.post('/api/admin/proxies/reload', requireAdmin, async (req, res) => {
  try {
    const priceQueue = global.__priceQueue;
    const found = priceQueue?.reloadProxies ? priceQueue.reloadProxies() : 0;
    if (!priceQueue?.validateCurrentProxies || !found) {
      adminLog(req.account, 'proxy_reload', '', `found=${found} working=${found}`);
      return res.json({ ok: true, found, count: found, rejected: 0 });
    }
    const config = getPriceManagerConfig();
    const checked = await priceQueue.validateCurrentProxies({ concurrency: config.workers, timeoutMs: config.timeoutMs, persist: true });
    adminLog(req.account, 'proxy_reload', '', `found=${found} working=${checked.working} rejected=${checked.rejected}`);
    res.json({ ok: true, found, count: checked.working, rejected: checked.rejected });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Не удалось проверить прокси' });
  }
});

app.post('/api/admin/proxies/fetch-free', requireAdmin, async (req, res) => {
  try {
    const sources = [
      'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
      'https://www.proxy-list.download/api/v1/get?type=http',
      'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt'
    ];
    let fetched = [];
    for (const url of sources) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const txt = await r.text();
        const lines = txt.split(/[\r\n]+/).map(s=>s.trim()).filter(s=>/^\d+\.\d+\.\d+\.\d+:\d+$/.test(s));
        fetched.push(...lines);
        if (fetched.length >= 50) break;
      } catch {}
    }
    fetched = [...new Set(fetched)].slice(0, 100);
    if (!fetched.length) return res.status(502).json({ error: 'Не удалось скачать бесплатные прокси, попробуй добавить вручную' });
    const priceQueue = global.__priceQueue;
    if (!priceQueue?.validateProxies) return res.status(503).json({ error: 'Очередь цен не запущена в процессе сервера' });
    const wasPaused = !!priceQueue.stats().paused;
    if (!wasPaused) priceQueue.pause();
    let checked;
    try {
      const config = getPriceManagerConfig();
      checked = await priceQueue.validateProxies(fetched, { concurrency: config.workers, timeoutMs: config.timeoutMs });
      priceQueue.replaceProxyPool(checked.workingUrls);
      priceQueue.applyValidationResults(checked.results);
      priceQueue.persistProxyPool();
    } finally {
      if (!wasPaused) priceQueue.resume();
    }
    adminLog(req.account, 'proxy_fetch_free', '', `fetched=${fetched.length} working=${checked.working} rejected=${checked.rejected}`);
    res.json({ ok: true, fetched: fetched.length, tested: checked.checked, loaded: checked.working, rejected: checked.rejected, proxies: checked.results.filter(item=>item.ok).slice(0,20) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/email/status', requireStaff, (_, res) => {
  const pending = db.prepare("SELECT COUNT(*) AS c FROM email_messages WHERE status='pending'").get().c;
  const sent = db.prepare("SELECT COUNT(*) AS c FROM email_messages WHERE status='sent'").get().c;
  const failed = db.prepare("SELECT COUNT(*) AS c FROM email_messages WHERE status='failed'").get().c;
  res.json({
    configured: mailer.configured(),
    description: mailer.describe(),
    pending, sent, failed
  });
});

app.get('/api/admin/email/queue', requireStaff, (req, res) => {
  const status = String(req.query.status || '').trim();
  const rows = status
    ? db.prepare(`SELECT id, recipient_email AS "to", user_id AS userId, subject, status, attempts, error, created_at AS createdAt, sent_at AS sentAt
        FROM email_messages WHERE status = ? ORDER BY id DESC LIMIT 100`).all(status)
    : db.prepare(`SELECT id, recipient_email AS "to", user_id AS userId, subject, status, attempts, error, created_at AS createdAt, sent_at AS sentAt
        FROM email_messages ORDER BY id DESC LIMIT 100`).all();
  res.json({ messages: rows });
});

function enqueueEmail({ to, userId, subject, html, text = '' }) {
  if (!to || !subject) return 0;
  const result = db.prepare(`
    INSERT INTO email_messages(recipient_email,user_id,subject,body_html,body_text,status,created_at)
    VALUES(?,?,?,?,?, 'pending', ?)
  `).run(to, userId || null, subject, html || '', text, Date.now());
  queue.publish('email.process', { id: Number(result.lastInsertRowid) });
  return Number(result.lastInsertRowid);
}

app.post('/api/admin/email/test', requireAdmin, async (req, res) => {
  const to = String(req.body?.to || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(to)) return res.status(400).json({ error: 'Укажите корректный email' });
  try {
    const result = await mailer.sendMail({
      to,
      subject: 'Тестовое письмо КЕЙСЕР',
      html: '<p>Это тестовое письмо. Если вы его видите — SMTP настроен правильно.</p>',
      text: 'Это тестовое письмо.'
    });
    adminLog(req.account, 'email_test', to, result.messageId || '');
    res.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    res.status(502).json({ error: error.message, code: error.code });
  }
});

app.post('/api/admin/email/broadcast', requireAdmin, (req, res) => {
  const subject = String(req.body?.subject || '').trim().slice(0, 200);
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) return res.status(400).json({ error: 'Укажите тему и текст' });
  if (body.length > 5000) return res.status(400).json({ error: 'Слишком длинное письмо' });
  const rows = db.prepare(`
    SELECT id, support_email AS email FROM users
    WHERE support_email IS NOT NULL AND support_email != '' AND email_optout = 0 AND is_bot = 0 AND banned = 0
  `).all();
  let queued = 0;
  const html = body.replace(/\n/g, '<br>');
  for (const row of rows) {
    try { enqueueEmail({ to: row.email, userId: row.id, subject, html }); queued++; } catch (_) {}
  }
  adminLog(req.account, 'email_broadcast', subject, `recipients=${queued}`);
  res.json({ ok: true, queued, recipients: rows.length });
});

app.post('/api/admin/users/:id/email', requireStaff, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (!user.support_email) return res.status(400).json({ error: 'У пользователя не указан email' });
  const subject = String(req.body?.subject || '').trim().slice(0, 200);
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) return res.status(400).json({ error: 'Укажите тему и текст' });
  const html = body.replace(/\n/g, '<br>');
  const mailId = enqueueEmail({ to: user.support_email, userId: user.id, subject, html });
  adminLog(req.account, 'email_user', user.name, subject);
  res.json({ ok: true, mailId });
});

app.post('/api/admin/users/:id/revoke', requireAdmin, (req, res) => {
  try {
  const id = Number(req.params.id);
  const itemId = Number((req.body && req.body.inventoryId) || NaN);
  if (!Number.isSafeInteger(id) || !Number.isSafeInteger(itemId)) return res.status(400).json({ error: 'Предмет не найден' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const item = db.prepare("SELECT * FROM site_inventory WHERE id = ? AND user_id = ? AND status = 'active'").get(itemId, id);
  if (!item) return res.status(404).json({ error: 'Активный предмет не найден' });
  db.prepare("UPDATE site_inventory SET status = 'revoked', updated_at = ? WHERE id = ?").run(Date.now(), itemId);
  adminLog(req.account, 'item_revoke', user.name, item.item_name);
  res.json({ ok: true });
  } catch (e) {
    console.error('[revoke]', e);
    if (!res.headersSent) res.status(500).json({ error: e.message || 'Ошибка' });
  }
});

queue.on('email.process', async job => {
  const mail = db.prepare('SELECT * FROM email_messages WHERE id = ?').get(job.id);
  if (!mail || mail.status !== 'pending') return;
  try {
    await mailer.sendMail({
      to: mail.recipient_email,
      userId: mail.user_id,
      subject: mail.subject,
      html: mail.body_html,
      text: mail.body_text
    });
    db.prepare("UPDATE email_messages SET status='sent', attempts=attempts+1, sent_at=?, error='' WHERE id=?")
      .run(Date.now(), mail.id);
  } catch (error) {
    const attempts = Number(mail.attempts || 0) + 1;
    const nextStatus = attempts >= 3 ? 'failed' : 'pending';
    db.prepare("UPDATE email_messages SET status=?, attempts=?, error=? WHERE id=?")
      .run(nextStatus, attempts, String(error.message || error).slice(0, 300), mail.id);
    if (nextStatus === 'pending') {
      setTimeout(() => queue.publish('email.process', { id: mail.id }), 60_000 * attempts);
    }
  }
});

queue.on('support.notify', async ({ userId, message }) => {
  try {
    const user = db.prepare('SELECT support_email AS email, name FROM users WHERE id = ?').get(userId);
    if (!user || !user.email || user.email_optout) return;
    const html = `<p>Здравствуйте, ${escapeHtml(user.name) || 'игрок'}!</p>
      <p>Мы получили ваше обращение в поддержку:</p>
      <blockquote style="border-left:3px solid #56a8ff;padding:8px 12px;background:rgba(86,168,255,.08);white-space:pre-wrap;">${escapeHtml(message)}</blockquote>
      <p>Ответ придёт на этот же адрес, как только оператор его напишет.</p>`;
    enqueueEmail({
      to: user.email,
      userId,
      subject: 'Ваше обращение в поддержку принято',
      html
    });
  } catch (_) {}
});

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function notifyStaffReply(userId, message) {
  const user = db.prepare('SELECT support_email AS email, name, email_optout FROM users WHERE id = ?').get(userId);
  if (!user || !user.email || user.email_optout) return;
  const html = `<p>Здравствуйте, ${escapeHtml(user.name) || 'игрок'}!</p>
    <p>Поддержка ответила на ваше обращение:</p>
    <blockquote style="border-left:3px solid #44c987;padding:8px 12px;background:rgba(68,201,135,.08);white-space:pre-wrap;">${escapeHtml(message)}</blockquote>
    <p>Ответить можно прямо в чате на сайте.</p>`;
  enqueueEmail({ to: user.email, userId, subject: 'Ответ поддержки КЕЙСЕР', html });
}

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Маршрут не найден' });
  }
  // Неизвестные auth-адреса не должны попадать в SPA и выглядеть как рабочий вход.
  if (req.path.startsWith('/auth/')) {
    return res.status(404).send('Not found');
  }
  const base = path.basename(req.path);
  if (path.extname(req.path) || base.startsWith('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((error, req, res, _next) => {
  console.error('[error]', error && error.stack ? error.stack : error);
  if (res.headersSent) return;
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
  res.status(500).send('Внутренняя ошибка сервера');
});

(async () => {
  try {
    await buildFullCatalog();
  } catch (error) {
    console.warn('[catalog] Не удалось построить полный каталог:', error.message);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`${BRAND_NAME}: ${BASE_URL}`);
    setInterval(() => {
      refreshSteamPrices(0).catch(() => {});
    }, 24 * 60 * 60 * 1000).unref?.();
  });
})();
