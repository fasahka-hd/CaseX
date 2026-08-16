'use strict';
const fs = require('fs');
const path = require('path');

const FRESH_TTL = 2 * 60 * 60 * 1000;
const STALE_TTL = 30 * 24 * 60 * 60 * 1000;
let MIN_INTERVAL = 400;
const RETRY_AFTER_429 = 10 * 1000;
const MAX_RETRY_429 = 60 * 1000;
const CACHE_FILE = path.join(process.cwd(), 'data', 'steam-price-cache.json');
const PROXY_FILE_TXT = path.join(process.cwd(), 'data', 'proxies.txt');
const PROXY_FILE_JSON = path.join(process.cwd(), 'data', 'free-proxies.json');

const nativeFetch = global.fetch;
const cache = new Map();
const queue = [];
const queuedUrls = new Set();
let running = false;
let lastRequestAt = 0;
let dirty = false;
let consecutive429 = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadDiskCache() {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(raw);
    let loaded = 0;
    for (const [url, entry] of Object.entries(data)) {
      if (entry && Number(entry.at) > 0 && entry.data && Date.now() - Number(entry.at) <= STALE_TTL) {
        cache.set(url, entry);
        loaded++;
      }
    }
    console.log(`[steam-price-queue] Загружено сохранённых цен: ${loaded}`);
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn(`[steam-price-queue] Ошибка загрузки кеша: ${e.message}`);
  }
}
function saveDiskCache() {
  if (!dirty) return;
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)));
    dirty = false;
  } catch (e) {
    console.warn(`[steam-price-queue] Не удалось сохранить кеш: ${e.message}`);
  }
}

function loadProxiesFromEnv() {
  const list = [];
  const env = process.env.PROXY_LIST || process.env.PROXIES || '';
  if (env) {
    for (const part of env.split(/[,\n\s]+/)) {
      const p = part.trim();
      if (p) list.push(p);
    }
  }
  try {
    if (fs.existsSync(PROXY_FILE_TXT)) {
      const txt = fs.readFileSync(PROXY_FILE_TXT, 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const p = line.trim();
        if (!p || p.startsWith('#')) continue;
        list.push(p);
      }
    }
  } catch {}
  try {
    if (fs.existsSync(PROXY_FILE_JSON)) {
      const j = JSON.parse(fs.readFileSync(PROXY_FILE_JSON, 'utf8'));
      const arr = Array.isArray(j) ? j : (j.proxies || []);
      for (const p of arr) if (p) list.push(String(p).trim());
    }
  } catch {}
  const normalized = [];
  const seen = new Set();
  for (let p of list) {
    p = p.trim();
    if (!p) continue;
    if (!p.includes('://')) p = 'http://' + p;
    try {
      const u = new URL(p);
      if (!u.hostname || !u.port) continue;
      const key = u.hostname + ':' + u.port;
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(p);
    } catch { continue; }
  }
  return normalized;
}

let proxyPool = [];
function buildProxyPool() {
  const proxies = loadProxiesFromEnv();
  proxyPool = proxies.map(url => ({
    url,
    lastAt: 0,
    fails: 0,
    blockedUntil: 0,
    success: 0
  }));
  if (proxyPool.length) console.log(`[steam-price-queue] Загружено прокси: ${proxyPool.length}`);
  else console.log(`[steam-price-queue] Прокси не найдены — работаем напрямую. Добавь в data/proxies.txt или PROXY_LIST env`);
}
buildProxyPool();

function getNextProxy() {
  if (!proxyPool.length) return null;
  const now = Date.now();
  let best = null;
  let bestScore = Infinity;
  for (const p of proxyPool) {
    if (p.blockedUntil > now) continue;
    const wait = (p.lastAt + MIN_INTERVAL) - now;
    const score = Math.max(0, wait) + p.fails * 200;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (!best) return null;
  const wait = (best.lastAt + MIN_INTERVAL) - Date.now();
  return { proxy: best, wait: wait > 0 ? wait : 0 };
}

function requestUrl(input) {
  try { return typeof input === 'string' ? input : String(input?.url || input); } catch (_) { return ''; }
}
function isSteamPriceRequest(url) {
  return /^https?:\/\/steamcommunity\.com\/market\/priceoverview\//i.test(url) && /(?:[?&])appid=730(?:&|$)/i.test(url);
}
function makeResponse(data, state) {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'x-steam-price-cache': state } });
}
function getCached(url) {
  const entry = cache.get(url);
  if (!entry) return null;
  const age = Date.now() - Number(entry.at);
  if (age > STALE_TTL) { cache.delete(url); dirty = true; return null; }
  return { response: makeResponse(entry.data, age <= FRESH_TTL ? 'hit' : 'stale'), stale: age > FRESH_TTL };
}
function enqueue(url, init, foreground = false, resolve = null, reject = null) {
  if (foreground) {
    queuedUrls.add(url);
    queue.push({ url, init, foreground, resolve, reject, attempts: 0 });
    runQueue().catch(e => console.error('[steam-price-queue]', e));
    return;
  }
  if (!queuedUrls.has(url)) {
    queuedUrls.add(url);
    queue.push({ url, init, foreground, resolve, reject, attempts: 0 });
    runQueue().catch(e => console.error('[steam-price-queue]', e));
  }
}

async function fetchViaProxy(url, init, proxyUrl) {
  if (!proxyUrl) {
    lastRequestAt = Date.now();
    return await nativeFetch(url, init);
  }
  try {
    const { ProxyAgent } = require('undici');
    const agent = new ProxyAgent(proxyUrl);
    const res = await nativeFetch(url, { ...init, dispatcher: agent });
    return res;
  } catch (e) {
    try {
      const HttpsProxyAgent = require('https-proxy-agent');
      const agentMod = HttpsProxyAgent.HttpsProxyAgent || HttpsProxyAgent;
      const agent = new agentMod(proxyUrl);
      const { fetch: fetchWithAgent } = require('undici');
      return await nativeFetch(url, { ...init, dispatcher: agent });
    } catch (_) {
      return await nativeFetch(url, init);
    }
  }
}

async function runQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      if (global.__priceQueue && global.__priceQueue.paused) {
        await sleep(1000);
        continue;
      }
      const next = getNextProxy();
      let proxyObj = null;
      let wait = 0;
      if (next) {
        proxyObj = next.proxy;
        wait = next.wait;
      } else {
        wait = MIN_INTERVAL - (Date.now() - lastRequestAt);
      }
      if (wait > 0) await sleep(wait);

      const task = queue.shift();
      queuedUrls.delete(task.url);

      let response;
      try {
        if (proxyObj) proxyObj.lastAt = Date.now();
        else lastRequestAt = Date.now();
        response = await fetchViaProxy(task.url, task.init, proxyObj ? proxyObj.url : null);
      } catch (error) {
        if (proxyObj) { proxyObj.fails++; if (proxyObj.fails > 3) proxyObj.blockedUntil = Date.now() + 60*1000; }
        if (task.foreground && task.reject) task.reject(error);
        if (!response) continue;
      }

      if (response && response.status === 429) {
        consecutive429++;
        const backoff = Math.min(RETRY_AFTER_429 * Math.pow(1.5, consecutive429 - 1), MAX_RETRY_429);
        console.warn(`[steam-price-queue] 429 via ${proxyObj ? proxyObj.url : 'direct'} — пауза ${Math.round(backoff/1000)}с`);
        if (proxyObj) {
          proxyObj.fails++;
          proxyObj.blockedUntil = Date.now() + backoff;
        }
        queuedUrls.add(task.url);
        task.attempts = (task.attempts || 0) + 1;
        if (task.attempts < 10) queue.unshift(task);
        else if (task.foreground && task.resolve) task.resolve(response);
        await sleep(Math.min(backoff, 5000));
        continue;
      }

      consecutive429 = 0;
      if (proxyObj) { proxyObj.fails = Math.max(0, proxyObj.fails - 1); proxyObj.success++; }

      if (response && response.ok) {
        try {
          const data = await response.clone().json();
          cache.set(task.url, { at: Date.now(), data });
          dirty = true;
          if (cache.size % 20 === 0) saveDiskCache();
          else if (task.foreground) saveDiskCache();
          if (task.foreground && task.resolve) task.resolve(makeResponse(data, 'miss'));
          continue;
        } catch (_) {}
      }
      if (task.foreground && task.resolve) task.resolve(response);
    }
    saveDiskCache();
  } finally {
    running = false;
  }
}

global.fetch = function steamAwareFetch(input, init) {
  const url = requestUrl(input);
  if (!isSteamPriceRequest(url)) return nativeFetch(input, init);
  const cached = getCached(url);
  if (cached) {
    if (cached.stale) enqueue(url, init, false);
    return Promise.resolve(cached.response);
  }
  return new Promise((resolve, reject) => { enqueue(url, init, true, resolve, reject); });
};

global.__priceQueue = {
  paused: false,
  pause() { this.paused = true; console.log('[steam-price-queue] PAUSED'); },
  resume() { this.paused = false; console.log('[steam-price-queue] RESUMED'); if (queue.length) runQueue().catch(()=>{}); },
  clear() { cache.clear(); dirty = true; saveDiskCache(); console.log('[steam-price-queue] CACHE CLEARED'); },
  stats() { return { size: cache.size, queueLen: queue.length, paused: this.paused, proxies: proxyPool.length, proxyStats: proxyPool.map(p=>({url:p.url, fails:p.fails, success:p.success, blocked: p.blockedUntil>Date.now()})), consecutive429 }; },
  reloadProxies() { buildProxyPool(); return proxyPool.length; },
  addProxy(url) {
    try {
      if (!url.includes('://')) url='http://'+url;
      new URL(url);
      if (!proxyPool.some(p=>p.url===url)) {
        proxyPool.push({ url, lastAt:0, fails:0, blockedUntil:0, success:0 });
        console.log('[steam-price-queue] Добавлен прокси '+url);
        return true;
      }
    } catch {}
    return false;
  }
};

loadDiskCache();
setInterval(saveDiskCache, 10000).unref?.();
process.once('exit', saveDiskCache);
process.once('SIGINT', () => { saveDiskCache(); });
process.once('SIGTERM', () => { saveDiskCache(); });
console.log('[steam-price-queue] Persistent cache enabled; MIN_INTERVAL=' + MIN_INTERVAL + 'ms, proxies=' + proxyPool.length);
