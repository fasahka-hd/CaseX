'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

try {
  const localEnv = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const allowed = new Set(['STEAM_API_KEY', 'SESSION_SECRET', 'BRAND_NAME', 'TELEGRAM_URL', 'PORT']);
  for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || !allowed.has(match[1]) || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch {}

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const BRAND_NAME = process.env.BRAND_NAME || 'КЕЙСЕР';
const TELEGRAM_URL = process.env.TELEGRAM_URL || 'https://t.me/';
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

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

const CATALOG = [
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
  catalogItem('m4a4-dragon-king', 'M4A4 | Dragon King', 'm4a4-dragon-king', 76000, 'restricted', 'MW'),
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
  catalogItem('scar-green-plaid', 'SCAR-20 | Green Plaid', 'scar-green-plaid', 25000, 'milspec', 'FN'),
  catalogItem('g3-executioner', 'G3SG1 | The Executioner', 'g3-executioner', 126000, 'classified', 'MW'),
  catalogItem('g3-murky', 'G3SG1 | Murky', 'g3-murky', 64000, 'restricted', 'WW'),
  catalogItem('g3-flux', 'G3SG1 | Flux', 'g3-flux', 8500, 'industrial', 'FT'),
  catalogItem('karambit-fade', '★ Karambit | Fade', 'karambit-fade', 6200000, 'contraband', 'FN'),
  catalogItem('karambit-doppler', '★ Karambit | Doppler', 'karambit-doppler', 4800000, 'contraband', 'MW'),
  catalogItem('bayonet-marble-fade', '★ Bayonet | Marble Fade', 'bayonet-marble-fade', 4100000, 'contraband', 'FN'),
  catalogItem('butterfly-slaughter', '★ Butterfly Knife | Slaughter', 'butterfly-slaughter', 5600000, 'contraband', 'MW'),
  catalogItem('flip-doppler', '★ Flip Knife | Doppler', 'flip-doppler', 2600000, 'contraband', 'FN'),
  catalogItem('gut-tiger-tooth', '★ Gut Knife | Tiger Tooth', 'gut-tiger-tooth', 1500000, 'contraband', 'FN'),
  catalogItem('falchion-case-hardened', '★ Falchion | Case Hardened', 'falchion-case-hardened', 1200000, 'contraband', 'WW'),
  catalogItem('karambit-crimson-web', '★ Karambit | Crimson Web', 'karambit-crimson-web', 1900000, 'covert', 'FT'),
];
const CATALOG_BY_ID = new Map(CATALOG.map(item => [item.catalogId, item]));

const CASES = [
  {
    id: 'starter', name: 'СТАРТОВЫЙ КЕЙС', priceCents: 0, once: true,
    description: 'Один бесплатный кейс для нового игрока',
    contents: [
      ['p250-sand-dune', 46], ['awp-safari-mesh', 28], ['mp7-cirrus', 16],
      ['ak47-elite-build', 7], ['awp-worm-god', 2.5], ['usp-cortex', 0.5]
    ]
  },
  {
    id: 'neon', name: 'NEON CASE', priceCents: 24900,
    description: 'Яркие скины разных редкостей',
    contents: [
      ['mp7-cirrus', 36], ['ak47-elite-build', 27], ['awp-worm-god', 19],
      ['ak47-slate', 11], ['usp-cortex', 5], ['glock-vogue', 1.6], ['m4a1-hyper-beast', 0.4]
    ]
  },
  {
    id: 'classified', name: 'CLASSIFIED', priceCents: 99900,
    description: 'Повышенный шанс на розовую редкость',
    contents: [
      ['awp-worm-god', 34], ['ak47-slate', 27], ['usp-cortex', 16],
      ['glock-vogue', 11], ['mac10-disco-tech', 8], ['m4a1-hyper-beast', 3], ['ak47-neon-rider', 1]
    ]
  },
  {
    id: 'legend', name: 'LEGEND', priceCents: 299900,
    description: 'Редкие красные и контрабандные предметы',
    contents: [
      ['usp-cortex', 30], ['glock-vogue', 24], ['mac10-disco-tech', 18],
      ['m4a1-hyper-beast', 12], ['ak47-neon-rider', 8], ['awp-asiimov', 5],
      ['deagle-printstream', 2], ['ak47-wild-lotus', 0.8], ['m4a4-howl', 0.2]
    ]
  }
];
const CASES_BY_ID = new Map(CASES.map(item => [item.id, item]));

app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: false }));
app.get('/favicon.ico', (_, res) => res.type('svg').sendFile(path.join(__dirname, 'favicon.svg')));
app.use(express.static(__dirname, { index: 'index.html' }));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
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

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(row => row.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
ensureColumn('live_drops', 'rarity', "TEXT NOT NULL DEFAULT ''");
ensureColumn('live_drops', 'rarity_color', "TEXT NOT NULL DEFAULT '#74ffca'");
ensureColumn('live_drops', 'rarity_rank', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('live_drops', 'source', "TEXT NOT NULL DEFAULT 'case'");
ensureColumn('users', 'trade_link', "TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'profile_privacy', "TEXT NOT NULL DEFAULT 'private'");
ensureColumn('users', 'streamer_mode', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'nickname_custom', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'support_email', "TEXT NOT NULL DEFAULT ''");

const clients = new Set();
function cleanSessions() { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); }
setInterval(cleanSessions, 600000).unref();

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
  return db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ?
  `).get(token, Date.now()) || null;
}
function setCookie(res, token) {
  res.setHeader('Set-Cookie', `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure=${BASE_URL.startsWith('https://')}; Max-Age=2592000`);
}
function clearCookie(res, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
function broadcast(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of clients) {
    try { response.write(data); } catch { clients.delete(response); }
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
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) params.set(key, String(value));
  params.set('openid.mode', 'check_authentication');
  const response = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString()
  });
  const text = await response.text();
  if (!response.ok || !/is_valid\s*:\s*true/i.test(text)) throw new Error('Steam OpenID verification failed');
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
  if (STEAM_API_KEY) {
    try {
      const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
      url.searchParams.set('key', STEAM_API_KEY);
      url.searchParams.set('steamids', id);
      const response = await fetch(url, { headers: { 'User-Agent': 'Keyser/2.0' } });
      const profile = response.ok ? (await response.json())?.response?.players?.[0] : null;
      if (profile?.personaname || profile?.avatarfull) {
        return { name: profile.personaname || `Steam ${id.slice(-6)}`, avatar: profile.avatarfull || '' };
      }
    } catch {}
  }
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${id}/?xml=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Keyser/2.0)' }
    });
    if (response.ok) {
      const xml = await response.text();
      const name = xmlValue(xml, 'steamID');
      const avatar = xmlValue(xml, 'avatarFull') || xmlValue(xml, 'avatarMedium');
      if (name || avatar) return { name: name || `Steam ${id.slice(-6)}`, avatar };
    }
  } catch {}
  return { name: `Steam ${id.slice(-6)}`, avatar: '' };
}
function publicCatalogItem(item) {
  return { ...item };
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
  `).all(userId).map(row => ({
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
function pickWeighted(contents) {
  const total = contents.reduce((sum, [, weight]) => sum + weight, 0);
  let point = crypto.randomInt(0, 1000000) / 1000000 * total;
  for (const [id, weight] of contents) {
    point -= weight;
    if (point < 0) return CATALOG_BY_ID.get(id);
  }
  return CATALOG_BY_ID.get(contents[contents.length - 1][0]);
}
function dropPayload(row) {
  return {
    id: row.id,
    userName: row.user_name,
    itemName: row.item_name,
    itemIcon: row.item_icon,
    priceCents: row.price_cents,
    rarity: row.rarity,
    rarityColor: row.rarity_color,
    rarityRank: row.rarity_rank,
    source: row.source,
    createdAt: row.created_at
  };
}
function addLiveDrop(userName, item, source, now = Date.now()) {
  const result = db.prepare(`
    INSERT INTO live_drops(user_name,item_name,item_icon,price_cents,rarity,rarity_color,rarity_rank,source,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).run(userName, item.name, item.icon, item.priceCents, item.rarity, item.rarityColor, item.rarityRank, source, now);
  return dropPayload(db.prepare('SELECT * FROM live_drops WHERE id = ?').get(result.lastInsertRowid));
}
function caseView(caseData, userId) {
  const opened = userId && caseData.once
    ? !!db.prepare('SELECT 1 FROM case_openings WHERE user_id = ? AND case_id = ? LIMIT 1').get(userId, caseData.id)
    : false;
  return {
    id: caseData.id,
    name: caseData.name,
    description: caseData.description,
    priceCents: caseData.priceCents,
    once: !!caseData.once,
    available: !opened,
    contents: caseData.contents.map(([id, weight]) => ({ ...publicCatalogItem(CATALOG_BY_ID.get(id)), weight }))
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
    console.error(error);
    res.status(502).send('Не удалось подтвердить вход через Steam. Вернитесь на сайт и попробуйте ещё раз.');
  }
});

if (process.env.ALLOW_DEV_LOGIN === '1') {
  app.get('/auth/dev', (req, res) => {
    const now = Date.now();
    const steamid = '76561190000000001';
    let dev = db.prepare('SELECT * FROM users WHERE steamid = ?').get(steamid);
    if (!dev) {
      const id = Number(db.prepare('INSERT INTO users(steamid,name,avatar,balance_cents,created_at,updated_at) VALUES(?,?,?,?,?,?)')
        .run(steamid, 'Preview Player', '', 500000, now, now).lastInsertRowid);
      dev = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }
    setCookie(res, createSession(dev.id));
    res.redirect('/');
  });
}
app.post('/auth/logout', (req, res) => {
  clearCookie(res, cookies(req.headers.cookie || '').session);
  res.json({ ok: true });
});

app.get('/api/config', (_, res) => res.json({ brand: BRAND_NAME, telegram: TELEGRAM_URL }));
app.get('/api/stats', (_, res) => {
  res.json({
    totalPlayers: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    casesOpened: db.prepare('SELECT COUNT(*) AS count FROM case_openings').get().count,
    upgradesMade: db.prepare('SELECT COUNT(*) AS count FROM upgrade_rounds').get().count
  });
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
      avatar: account.avatar, balanceCents: account.balance_cents
    }
  });
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
  const casesOpened = db.prepare('SELECT COUNT(*) AS count FROM case_openings WHERE user_id = ?').get(account.id).count;
  const upgradesMade = db.prepare('SELECT COUNT(*) AS count FROM upgrade_rounds WHERE user_id = ?').get(account.id).count;
  const sold = db.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS total FROM inventory_sales WHERE user_id = ?').get(account.id);
  const activeItems = db.prepare("SELECT COUNT(*) AS count FROM site_inventory WHERE user_id = ? AND status = 'active'").get(account.id).count;
  res.json({
    user: { id: account.id, steamid: account.steamid, name: account.name, avatar: account.avatar },
    balanceCents: account.balance_cents,
    withdrawnCents: 0,
    activeItems,
    bestDrop: bestDrop ? { ...bestDrop, assetid: String(bestDrop.assetid) } : null,
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
    streamerMode: !!account.streamer_mode
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
app.get('/api/catalog', (_, res) => res.json(CATALOG.map(publicCatalogItem)));
app.get('/api/inventory', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, items: inventoryRows(account.id) });
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
  const caseData = CASES_BY_ID.get(String(req.body?.caseId || ''));
  if (!caseData) return res.status(404).json({ error: 'Кейс не найден' });

  try {
    const result = db.transaction(() => {
      if (caseData.once && db.prepare('SELECT 1 FROM case_openings WHERE user_id = ? AND case_id = ? LIMIT 1').get(account.id, caseData.id)) {
        throw new Error('Стартовый кейс уже был открыт');
      }
      if (caseData.priceCents > 0) {
        const charged = db.prepare(`
          UPDATE users SET balance_cents = balance_cents - ?, updated_at = ?
          WHERE id = ? AND balance_cents >= ?
        `).run(caseData.priceCents, Date.now(), account.id, caseData.priceCents);
        if (!charged.changes) throw new Error('Недостаточно средств на балансе');
      }
      const won = pickWeighted(caseData.contents);
      const now = Date.now();
      const inventoryId = insertInventoryItem(account.id, won, `case:${caseData.id}`, now);
      db.prepare('INSERT INTO case_openings(user_id,case_id,inventory_item_id,cost_cents,created_at) VALUES(?,?,?,?,?)')
        .run(account.id, caseData.id, inventoryId, caseData.priceCents, now);
      const drop = addLiveDrop(account.name, won, 'case', now);
      const balance = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(account.id).balance_cents;
      return { won: { ...won, assetid: String(inventoryId) }, drop, balanceCents: balance };
    })();
    broadcast('drop', result.drop);
    res.json({ ok: true, item: result.won, balanceCents: result.balanceCents });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось открыть кейс' });
  }
});

app.post('/api/upgrade', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь через Steam' });
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
      const minimumTargetPrice = Math.ceil(totalValue * (1 + boostPercent / 100));
      if (target.priceCents < minimumTargetPrice) throw new Error(`Цель для +${boostPercent}% должна стоить не менее ${minimumTargetPrice / 100} ₽`);
      if (addBalanceCents > 0) {
        db.prepare('UPDATE users SET balance_cents = balance_cents - ?, updated_at = ? WHERE id = ?')
          .run(addBalanceCents, Date.now(), account.id);
      }
      const chance = Math.min(95, Math.max(1, Math.floor(totalValue / target.priceCents * 10000) / 100));
      const roll = crypto.randomInt(0, 1000000) / 10000;
      const won = roll < chance;
      const now = Date.now();
      db.prepare("UPDATE site_inventory SET status = 'used', updated_at = ? WHERE id = ?").run(now, fromId);
      let resultItemId = null;
      let drop = null;
      if (won) {
        resultItemId = insertInventoryItem(account.id, target, `upgrade:${fromId}`, now);
        drop = addLiveDrop(account.name, target, 'upgrade', now);
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
    if (result.drop) broadcast('drop', result.drop);
    res.json({ ok: true, won: result.won, chance: result.chance, boostPercent: result.boostPercent, addBalanceCents: result.addBalanceCents, item: result.item });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Не удалось выполнить апгрейд' });
  }
});

app.get('/api/live-drops', (_, res) => {
  const rows = db.prepare('SELECT * FROM live_drops ORDER BY created_at DESC LIMIT 30').all();
  res.json(rows.map(dropPayload));
});
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  clients.add(res);
  broadcast('online', { online: clients.size });
  req.on('close', () => {
    clients.delete(res);
    broadcast('online', { online: clients.size });
  });
});
app.get('/api/online', (_, res) => res.json({ online: clients.size }));

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
  res.json(db.prepare(`
    SELECT id,message,created_at AS createdAt FROM support_messages
    WHERE user_id = ? ORDER BY id DESC LIMIT 50
  `).all(account.id).reverse());
});
app.post('/api/support/messages', (req, res) => {
  const account = currentUser(req);
  if (!account) return res.status(401).json({ error: 'login_required' });
  const message = String(req.body?.message || '').trim();
  if (!message || message.length > 2000) return res.status(400).json({ error: 'invalid_message' });
  const now = Date.now();
  const result = db.prepare('INSERT INTO support_messages(user_id,message,created_at) VALUES(?,?,?)')
    .run(account.id, message, now);
  res.json({ id: result.lastInsertRowid, message, createdAt: now });
});

app.listen(PORT, '0.0.0.0', () => console.log(`${BRAND_NAME}: ${BASE_URL}`));
