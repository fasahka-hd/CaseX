'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const BRAND_NAME = process.env.BRAND_NAME || 'КЕЙСЕР';
const TELEGRAM_URL = process.env.TELEGRAM_URL || 'https://t.me/';

app.use(express.json({limit:'128kb'}));
app.use(express.urlencoded({extended:false}));
app.use(express.static(__dirname, {index:'index.html'}));

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  steamid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS live_drops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_icon TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_drops_created ON live_drops(created_at DESC);
`);

const clients = new Set();

function cleanExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}
setInterval(cleanExpiredSessions, 10 * 60 * 1000).unref();

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}
function makeSession(userId) {
  const raw = `${crypto.randomBytes(24).toString('hex')}.${Date.now()}`;
  const token = `${raw}.${sign(raw)}`;
  db.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)')
    .run(token, userId, Date.now() + 30*24*60*60*1000);
  return token;
}
function parseCookies(header='') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if(i>0) out[part.slice(0,i).trim()] = decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}
function currentUser(req) {
  const token = parseCookies(req.headers.cookie || '').session;
  if(!token) return null;
  const row = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.id=? AND s.expires_at>?
  `).get(token, Date.now());
  return row || null;
}
function setSession(res, token) {
  res.setHeader('Set-Cookie', `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure=${BASE_URL.startsWith('https://')}; Max-Age=${30*24*60*60}`);
}
function clearSession(res, token) {
  if(token) db.prepare('DELETE FROM sessions WHERE id=?').run(token);
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
function broadcast(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try { res.write(data); } catch { clients.delete(res); }
  }
}

function steamOpenIdUrl(req) {
  const returnTo = `${BASE_URL.replace(/\/$/,'')}/auth/steam/callback`;
  const realm = BASE_URL.replace(/\/$/,'');
  const p = new URLSearchParams({
    'openid.ns':'http://specs.openid.net/auth/2.0',
    'openid.mode':'checkid_setup',
    'openid.return_to':returnTo,
    'openid.realm':realm,
    'openid.ns.sreg':'http://openid.net/extensions/sreg/1.1',
    'openid.claimed_id':'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.identity':'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return `https://steamcommunity.com/openid/login?${p.toString()}`;
}

async function verifySteam(req) {
  const params = new URLSearchParams();
  for (const [k,v] of Object.entries(req.query)) params.set(k, String(v));
  params.set('openid.mode','check_authentication');
  const response = await fetch('https://steamcommunity.com/openid/login', {
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Origin':'https://steamcommunity.com',
      'Referer':'https://steamcommunity.com/'
    },
    body:params.toString()
  });
  const text = await response.text();
  if(!response.ok || !/is_valid\s*:\s*true/i.test(text)) throw new Error('Steam OpenID verification failed');
  const claimed = String(req.query['openid.claimed_id'] || '');
  const match = claimed.match(/\/id\/(\d{17})$/);
  if(!match) throw new Error('SteamID not found');
  return match[1];
}

async function steamProfile(steamid) {
  const key = process.env.STEAM_API_KEY;
  if(!key) return {name:`Steam ${steamid.slice(-6)}`, avatar:''};
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  url.searchParams.set('key',key);
  url.searchParams.set('steamids',steamid);
  const r = await fetch(url);
  if(!r.ok) return {name:`Steam ${steamid.slice(-6)}`, avatar:''};
  const j = await r.json();
  const p = j?.response?.players?.[0];
  return {name:p?.personaname || `Steam ${steamid.slice(-6)}`, avatar:p?.avatarfull || ''};
}

app.get('/auth/steam', (req,res) => res.redirect(steamOpenIdUrl(req)));

app.get('/auth/steam/callback', async (req,res) => {
  try {
    const steamid = await verifySteam(req);
    const profile = await steamProfile(steamid);
    const now = Date.now();
    const existing = db.prepare('SELECT * FROM users WHERE steamid=?').get(steamid);
    let userId;
    if(existing) {
      db.prepare('UPDATE users SET name=?, avatar=?, updated_at=? WHERE id=?')
        .run(profile.name, profile.avatar, now, existing.id);
      userId = existing.id;
    } else {
      const info = db.prepare('INSERT INTO users(steamid,name,avatar,created_at,updated_at) VALUES(?,?,?,?,?)')
        .run(steamid, profile.name, profile.avatar, now, now);
      userId = info.lastInsertRowid;
    }
    setSession(res, makeSession(userId));
    res.redirect('/');
  } catch (e) {
    console.error(e);
    res.status(502).send('Не удалось подтвердить вход через Steam. Вернитесь на сайт и попробуйте ещё раз.');
  }
});

app.post('/auth/logout',(req,res)=>{
  const token=parseCookies(req.headers.cookie||'').session;
  clearSession(res, token);
  res.json({ok:true});
});

app.get('/api/config', (_,res)=>res.json({brand:BRAND_NAME,telegram:TELEGRAM_URL}));

app.get('/api/me', async (req,res)=>{
  const user=currentUser(req);
  if(!user) return res.json({authenticated:false});
  res.json({
    authenticated:true,
    user:{id:user.id,steamid:user.steamid,name:user.name,avatar:user.avatar,balanceCents:user.balance_cents}
  });
});

async function steamInventory(steamid) {
  const url = new URL(`https://steamcommunity.com/inventory/${steamid}/730/2`);
  url.searchParams.set('l','english');
  url.searchParams.set('count','2500');
  const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; Keyser/2.0)'}});
  if(!r.ok) throw new Error(`Steam inventory HTTP ${r.status}`);
  const j=await r.json();
  if(j.success !== 1) throw new Error('Steam inventory unavailable');
  const desc = new Map((j.descriptions||[]).map(d=>[`${d.classid}_${d.instanceid}`,d]));
  return (j.assets||[]).map(a=>{
    const d=desc.get(`${a.classid}_${a.instanceid}`);
    if(!d) return null;
    const icon = d.icon_url_large || d.icon_url;
    return {
      assetid:a.assetid,
      classid:a.classid,
      instanceid:a.instanceid,
      name:d.market_hash_name || d.name,
      marketName:d.market_hash_name || d.name,
      icon:icon ? `https://community.cloudflare.steamstatic.com/economy/image/${icon}/256fx256f` : '',
      tradable:!!d.tradable,
      marketable:!!d.marketable,
      type:d.type || ''
    };
  }).filter(Boolean);
}

app.get('/api/inventory', async (req,res)=>{
  const user=currentUser(req);
  if(!user) return res.status(401).json({authenticated:false});
  try {
    const inventory=await steamInventory(user.steamid);
    res.json({authenticated:true,items:inventory});
  } catch(e) {
    console.error(e);
    res.status(502).json({error:'Steam не вернул инвентарь. Проверьте, что инвентарь профиля открыт.'});
  }
});

app.get('/api/live-drops',(_,res)=>{
  const rows=db.prepare(`
    SELECT id,user_name as userName,item_name as itemName,item_icon as itemIcon,
           price_cents as priceCents,created_at as createdAt
    FROM live_drops ORDER BY created_at DESC LIMIT 30
  `).all();
  res.json(rows);
});

app.post('/api/live-drops', (req,res)=>{
  const user=currentUser(req);
  if(!user) return res.status(401).json({error:'login_required'});
  const {itemName,itemIcon='',priceCents=null}=req.body||{};
  if(!itemName || typeof itemName!=='string') return res.status(400).json({error:'itemName required'});
  const info=db.prepare('INSERT INTO live_drops(user_name,item_name,item_icon,price_cents,created_at) VALUES(?,?,?,?,?)')
    .run(user.name,itemName,itemIcon,Number.isFinite(priceCents)?priceCents:null,Date.now());
  const row={id:info.lastInsertRowid,userName:user.name,itemName,itemIcon,priceCents,createdAt:Date.now()};
  broadcast('drop',row);
  res.json(row);
});

app.get('/api/events',(req,res)=>{
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache, no-transform');
  res.setHeader('Connection','keep-alive');
  res.flushHeaders?.();
  clients.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({online:clients.size})}\n\n`);
  req.on('close',()=>clients.delete(res));
});

app.get('/api/support/messages',(req,res)=>{
  const user=currentUser(req);
  if(!user) return res.status(401).json({error:'login_required'});
  const rows=db.prepare('SELECT id,message,created_at as createdAt FROM support_messages WHERE user_id=? ORDER BY id DESC LIMIT 50').all(user.id);
  res.json(rows.reverse());
});
app.post('/api/support/messages',(req,res)=>{
  const user=currentUser(req);
  if(!user) return res.status(401).json({error:'login_required'});
  const message=String(req.body?.message||'').trim();
  if(!message || message.length>2000) return res.status(400).json({error:'invalid_message'});
  const info=db.prepare('INSERT INTO support_messages(user_id,message,created_at) VALUES(?,?,?)').run(user.id,message,Date.now());
  res.json({id:info.lastInsertRowid,message,createdAt:Date.now()});
});

app.get('/api/cases',(req,res)=>{
  const user=currentUser(req);
  if(!user) return res.json({authenticated:false,cases:[]});
  // Real cases must be configured by the site's inventory/finance backend.
  // No fake cases are returned.
  res.json({authenticated:true,cases:[]});
});

app.get('/api/online',(req,res)=>res.json({online:clients.size}));

app.listen(PORT,()=>console.log(`${BRAND_NAME}: http://localhost:${PORT}`));
