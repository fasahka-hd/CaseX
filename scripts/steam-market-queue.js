'use strict';
const fs = require('fs');
const path = require('path');

const FRESH_TTL = 2 * 60 * 60 * 1000;
const STALE_TTL = 30 * 24 * 60 * 60 * 1000;
let MIN_INTERVAL = 400;
let WORKER_LIMIT = 12;
let PROXY_TIMEOUT = 4000;
let MAX_PROXY_FAILURES = 3;
let BLOCK_429_MS = 30 * 60 * 1000;
const RETRY_AFTER_429 = 10 * 1000;
const MAX_RETRY_429 = 60 * 1000;
const PROXY_FILE_TXT = path.join(process.cwd(), 'data', 'proxies.txt');

const nativeFetch = global.fetch;
const cache = new Map();
const queue = [];
const queuedUrls = new Set();
let activeWorkers = 0;
let validating = false;
let validationSummary = { checked: 0, working: 0, rejected: 0, at: 0 };
let lastRequestAt = 0;
let dirty = false;
let consecutive429 = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

let dbAdapter = null;
let attached = false;
function attachDb(db) {
  if (attached || !db || !db.prepare) return;
  attached = true;
  dbAdapter = db;
  try {
    db.exec('CREATE TABLE IF NOT EXISTS price_cache(url TEXT PRIMARY KEY, payload TEXT NOT NULL, cached_at INTEGER NOT NULL)');
    db.exec('CREATE TABLE IF NOT EXISTS proxy_pool(url TEXT PRIMARY KEY)');
  } catch (e) {
    console.warn('[steam-price-queue] Не удалось создать таблицы кеша:', e.message);
  }
  try {
    const rows = db.prepare('SELECT url, payload, cached_at FROM price_cache').all();
    let loaded = 0;
    const now = Date.now();
    for (const row of rows) {
      if (!row || !row.payload) continue;
      const at = Number(row.cached_at || 0);
      if (at > 0 && now - at <= STALE_TTL) {
        try { cache.set(row.url, JSON.parse(row.payload)); loaded++; } catch {}
      }
    }
    if (loaded) console.log(`[steam-price-queue] Загружено сохранённых цен: ${loaded}`);
  } catch (e) {
    console.warn(`[steam-price-queue] Ошибка загрузки кеша из базы: ${e.message}`);
  }
  try {
    const urls = db.prepare('SELECT url FROM proxy_pool').all().map(row => row.url);
    if (urls.length) {
      proxyPool = urls.map(url => ({ url, lastAt: 0, fails: 0, blockedUntil: 0, success: 0, busy: false, lastError: '' }));
      console.log(`[steam-price-queue] Загружено прокси из базы: ${proxyPool.length}`);
    }
  } catch (e) {
    console.warn(`[steam-price-queue] Ошибка загрузки прокси из базы: ${e.message}`);
  }
  setInterval(flushDb, 10000).unref?.();
  process.once('exit', () => { try { flushDb(); } catch {} });
  process.once('SIGINT', () => { try { flushDb(); } catch {} process.exit(0); });
  process.once('SIGTERM', () => { try { flushDb(); } catch {} process.exit(0); });
}
function flushDb() {
  if (!dbAdapter || !dirty) return;
  try {
    const insert = dbAdapter.prepare('INSERT INTO price_cache(url,payload,cached_at) VALUES(?,?,?) ON CONFLICT(url) DO UPDATE SET payload=excluded.payload, cached_at=excluded.cached_at');
    const run = dbAdapter.transaction(() => {
      for (const [url, entry] of cache) {
        if (entry && Number(entry.at) > 0 && entry.data) insert.run(url, JSON.stringify(entry), Number(entry.at));
      }
    });
    run();
    dirty = false;
  } catch (e) {
    console.warn(`[steam-price-queue] Не удалось сохранить кеш в базу: ${e.message}`);
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
    success: 0,
    busy: false,
    lastError: ''
  }));
  if (proxyPool.length) console.log(`[steam-price-queue] Загружено прокси: ${proxyPool.length}`);
  else console.log(`[steam-price-queue] Прокси не найдены — работаем напрямую. Добавь в data/proxies.txt или PROXY_LIST env`);
}
buildProxyPool();

function getNextProxy() {
  if (!proxyPool.length) return { proxy: null, wait: Math.max(0, MIN_INTERVAL - (Date.now() - lastRequestAt)), direct: true };
  const now = Date.now();
  const available = proxyPool.filter(proxy => !proxy.busy);
  if (!available.length) return { proxy: null, wait: 50, pending: true };
  let best = null;
  let bestReadyAt = Infinity;
  for (const proxy of available) {
    const readyAt = Math.max(proxy.blockedUntil || 0, (proxy.lastAt || 0) + MIN_INTERVAL);
    if (readyAt < bestReadyAt) { bestReadyAt = readyAt; best = proxy; }
  }
  if (!best) return { proxy: null, wait: 100, pending: true };
  best.busy = true;
  return { proxy: best, wait: Math.max(0, bestReadyAt - now), direct: false };
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

async function fetchViaProxy(url, init, proxyUrl, timeoutMs = PROXY_TIMEOUT) {
  if (!proxyUrl) {
    lastRequestAt = Date.now();
    return await nativeFetch(url, { ...init, signal: AbortSignal.timeout(Math.max(timeoutMs, 8000)) });
  }
  const { ProxyAgent } = require('undici');
  const agent = new ProxyAgent(proxyUrl);
  return await nativeFetch(url, { ...init, dispatcher: agent, signal: AbortSignal.timeout(timeoutMs) });
}

function normalizeProxyUrl(value) {
  let url = String(value || '').trim();
  if (!url) return '';
  if (!url.includes('://')) url = 'http://' + url;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || !parsed.port) return '';
    return url;
  } catch { return ''; }
}

async function probeProxy(url, timeoutMs = 4500) {
  const testUrl = 'https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=' + encodeURIComponent('AK-47 | Redline (Field-Tested)') + '&proxy_test=' + Date.now();
  const started = Date.now();
  try {
    const response = await fetchViaProxy(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, url, timeoutMs);
    if (response.status === 429) return { url, ok: false, status: 429, error: 'Steam rate limit', latency: Date.now() - started };
    if (!response.ok) return { url, ok: false, status: response.status, error: `HTTP ${response.status}`, latency: Date.now() - started };
    const data = await response.json().catch(() => null);
    if (!data || data.success !== true) return { url, ok: false, status: response.status, error: 'Некорректный ответ Steam', latency: Date.now() - started };
    return { url, ok: true, status: response.status, latency: Date.now() - started };
  } catch (error) {
    return { url, ok: false, status: 0, error: /abort|timeout/i.test(String(error.message)) ? 'Таймаут' : String(error.message || 'Ошибка соединения'), latency: Date.now() - started };
  }
}

async function validateProxies(values, options = {}) {
  if (validating) throw new Error('Проверка прокси уже выполняется, дождитесь завершения');
  validating = true;
  try {
    const urls = [...new Set((values || []).map(normalizeProxyUrl).filter(Boolean))];
    const results = new Array(urls.length);
    let cursor = 0;
    const concurrency = Math.min(24, Math.max(1, Number(options.concurrency || 16)));
    const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
      while (cursor < urls.length) {
        const index = cursor++;
        results[index] = await probeProxy(urls[index], Number(options.timeoutMs || 4500));
      }
    });
    await Promise.all(workers);
    const working = results.filter(result => result && result.ok);
    validationSummary = { checked: urls.length, working: working.length, rejected: urls.length - working.length, at: Date.now() };
    return { ...validationSummary, workingUrls: working.map(result => result.url), results };
  } finally {
    validating = false;
  }
}

function replaceProxyPool(urls) {
  const previous = new Map(proxyPool.map(proxy => [proxy.url, proxy]));
  proxyPool = [...new Set((urls || []).map(normalizeProxyUrl).filter(Boolean))].map(url => previous.get(url) || ({ url, lastAt: 0, fails: 0, blockedUntil: 0, success: 0, busy: false, lastError: '' }));
  return proxyPool.length;
}

function applyValidationResults(results) {
  const byUrl = new Map((results || []).filter(Boolean).map(result => [result.url, result]));
  for (const proxy of proxyPool) {
    const result = byUrl.get(proxy.url);
    if (!result) continue;
    proxy.lastLatency = Number(result.latency || 0);
    if (result.ok) { proxy.success = Math.max(1, Number(proxy.success || 0)); proxy.fails = 0; proxy.blockedUntil = 0; proxy.lastError = ''; }
    else { proxy.fails = Math.max(1, Number(proxy.fails || 0)); proxy.lastError = result.error || 'Проверка не пройдена'; }
  }
}

function persistProxyPool() {
  if (!dbAdapter) return;
  try {
    const remove = dbAdapter.prepare('DELETE FROM proxy_pool');
    const insert = dbAdapter.prepare('INSERT INTO proxy_pool(url) VALUES(?)');
    const run = dbAdapter.transaction(() => {
      remove.run();
      for (const proxy of proxyPool) insert.run(proxy.url);
    });
    run();
  } catch (error) {
    console.warn('[steam-price-queue] Не удалось сохранить проверенные прокси:', error.message);
  }
}

async function validateCurrentProxies(options = {}) {
  const controller = global.__priceQueue;
  const wasPaused = !!controller?.paused;
  if (controller) controller.paused = true;
  try {
    const result = await validateProxies(proxyPool.map(proxy => proxy.url), options);
    replaceProxyPool(result.workingUrls);
    applyValidationResults(result.results);
    if (options.persist !== false) persistProxyPool();
    console.log(`[steam-price-queue] Проверка завершена: работают ${result.working}/${result.checked}, отклонено ${result.rejected}`);
    return result;
  } finally {
    if (controller) { controller.paused = wasPaused; if (!wasPaused && queue.length) runQueue().catch(() => {}); }
  }
}

async function runQueue() {
  const workerLimit = Math.min(WORKER_LIMIT, Math.max(1, proxyPool.length || 1));
  while (activeWorkers < workerLimit && queue.length) {
    activeWorkers++;
    runWorker().catch(error => console.error('[steam-price-queue]', error)).finally(() => {
      activeWorkers--;
      if (queue.length) runQueue().catch(() => {});
    });
  }
}

async function runWorker() {
  while (queue.length) {
    if (global.__priceQueue && global.__priceQueue.paused) { await sleep(500); continue; }
    const next = getNextProxy();
    if (next.pending) { await sleep(next.wait || 50); continue; }
    const proxyObj = next.proxy;
    if (next.wait > 0) await sleep(next.wait);
    const task = queue.shift();
    if (!task) { if (proxyObj) proxyObj.busy = false; continue; }
    queuedUrls.delete(task.url);
    let response = null;
    try {
      if (proxyObj) proxyObj.lastAt = Date.now(); else lastRequestAt = Date.now();
      response = await fetchViaProxy(task.url, task.init, proxyObj ? proxyObj.url : null);
    } catch (error) {
      if (proxyObj) {
        proxyObj.fails++;
        proxyObj.lastError = /abort|timeout/i.test(String(error.message)) ? 'Таймаут' : String(error.message || 'Ошибка соединения');
        proxyObj.blockedUntil = Date.now() + Math.min(BLOCK_429_MS, 60_000 * Math.max(2, proxyObj.fails));
        if (proxyObj.fails >= MAX_PROXY_FAILURES) { proxyPool = proxyPool.filter(item => item !== proxyObj); persistProxyPool(); }
      }
      task.attempts = (task.attempts || 0) + 1;
      const maxAttempts = proxyObj ? Math.min(6, Math.max(2, proxyPool.length)) : 1;
      if (task.attempts < maxAttempts) {
        queuedUrls.add(task.url); queue.push(task);
      } else if (task.foreground && task.reject) task.reject(error);
      if (proxyObj) proxyObj.busy = false;
      continue;
    }

    if (response.status === 429) {
      consecutive429++;
      if (proxyObj) {
        proxyObj.fails++;
        proxyObj.lastError = 'Steam: слишком много запросов (429)';
        proxyObj.blockedUntil = Date.now() + BLOCK_429_MS;
        if (proxyObj.fails >= MAX_PROXY_FAILURES) { proxyPool = proxyPool.filter(item => item !== proxyObj); persistProxyPool(); }
      }
      task.attempts = (task.attempts || 0) + 1;
      const maxAttempts = proxyObj ? Math.min(6, Math.max(2, proxyPool.length)) : 1;
      if (task.attempts < maxAttempts) {
        queuedUrls.add(task.url); queue.push(task);
      } else if (task.foreground && task.resolve) task.resolve(response);
      if (proxyObj) proxyObj.busy = false;
      continue;
    }

    if (!response.ok) {
      if (proxyObj) {
        proxyObj.fails++;
        proxyObj.lastError = `HTTP ${response.status}`;
        proxyObj.blockedUntil = Date.now() + 5 * 60_000;
        if (proxyObj.fails >= MAX_PROXY_FAILURES) { proxyPool = proxyPool.filter(item => item !== proxyObj); persistProxyPool(); }
      }
      task.attempts = (task.attempts || 0) + 1;
      if (proxyObj && task.attempts < 4) { queuedUrls.add(task.url); queue.push(task); }
      else if (task.foreground && task.resolve) task.resolve(response);
      if (proxyObj) proxyObj.busy = false;
      continue;
    }

    consecutive429 = 0;
    if (proxyObj) { proxyObj.fails = Math.max(0, proxyObj.fails - 1); proxyObj.success++; proxyObj.lastError = ''; }
    try {
      const data = await response.clone().json();
      cache.set(task.url, { at: Date.now(), data });
      dirty = true;
      if (cache.size % 20 === 0 || task.foreground) flushDb();
      if (task.foreground && task.resolve) task.resolve(makeResponse(data, 'miss'));
    } catch (error) {
      if (task.foreground && task.resolve) task.resolve(response);
    }
    if (proxyObj) proxyObj.busy = false;
  }
  flushDb();
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
  clear() {
    cache.clear();
    if (dbAdapter) {
      try { dbAdapter.prepare('DELETE FROM price_cache').run(); } catch {}
      dirty = false;
    } else {
      dirty = true;
    }
    console.log('[steam-price-queue] CACHE CLEARED');
  },
  stats() { return { config:{workers:WORKER_LIMIT,timeoutMs:PROXY_TIMEOUT,maxFailures:MAX_PROXY_FAILURES,block429Minutes:Math.round(BLOCK_429_MS/60000),minInterval:MIN_INTERVAL}, size: cache.size, queueLen: queue.length, activeWorkers, paused: this.paused, proxies: proxyPool.length, validating, validation: validationSummary, proxyStats: proxyPool.map(p=>({url:p.url, fails:p.fails, success:p.success, blocked: p.blockedUntil>Date.now(), blockedUntil:p.blockedUntil||0, lastError:p.lastError||'', lastLatency:p.lastLatency||0, busy:!!p.busy})), consecutive429 }; },
  reloadProxies() { buildProxyPool(); return proxyPool.length; },
  validateProxies,
  validateCurrentProxies,
  replaceProxyPool,
  persistProxyPool,
  attachDb,
  applyValidationResults,
  configure(options={}) { WORKER_LIMIT=Math.max(1,Math.min(24,Number(options.workers||WORKER_LIMIT))); PROXY_TIMEOUT=Math.max(1500,Math.min(15000,Number(options.timeoutMs||PROXY_TIMEOUT))); MAX_PROXY_FAILURES=Math.max(1,Math.min(20,Number(options.maxFailures||MAX_PROXY_FAILURES))); BLOCK_429_MS=Math.max(60000,Math.min(24*60*60*1000,Number(options.block429Minutes||30)*60000)); MIN_INTERVAL=Math.max(100,Math.min(10000,Number(options.minInterval||MIN_INTERVAL))); return this.stats().config; },
  addProxy(url) {
    try {
      if (!url.includes('://')) url='http://'+url;
      new URL(url);
      if (!proxyPool.some(p=>p.url===url)) {
        proxyPool.push({ url, lastAt:0, fails:0, blockedUntil:0, success:0, busy:false, lastError:'' });
        console.log('[steam-price-queue] Добавлен прокси '+url);
        return true;
      }
    } catch {}
    return false;
  }
};

console.log('[steam-price-queue] Persistent cache enabled; MIN_INTERVAL=' + MIN_INTERVAL + 'ms, proxies=' + proxyPool.length);
