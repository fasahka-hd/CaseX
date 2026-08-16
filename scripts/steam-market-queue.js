'use strict';

// Steam Market priceoverview is rate-limited. The important part is that a
// restart must NEVER turn into another multi-hour crawl: known prices are
// served from the persistent cache immediately and refreshed in the
// background. We do not bypass Steam limits or rotate/proxy requests.
const fs = require('fs');
const path = require('path');

const FRESH_TTL = 2 * 60 * 60 * 1000;
const STALE_TTL = 30 * 24 * 60 * 60 * 1000;
const MIN_INTERVAL = 4000;
const RETRY_AFTER_429 = 60 * 1000;
const CACHE_FILE = path.join(process.cwd(), 'data', 'steam-price-cache.json');

const nativeFetch = global.fetch;
const cache = new Map();
const queue = [];
const queuedUrls = new Set();
let running = false;
let lastRequestAt = 0;
let dirty = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadDiskCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(raw);
    for (const [url, entry] of Object.entries(data)) {
      if (entry && Number(entry.at) > 0 && entry.data && Date.now() - Number(entry.at) <= STALE_TTL) {
        cache.set(url, entry);
      }
    }
    console.log(`[steam-price-queue] Загружено сохранённых цен: ${cache.size}`);
  } catch (_) {}
}

function saveDiskCache() {
  if (!dirty) return;
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)), 'utf8');
    dirty = false;
  } catch (error) {
    console.warn(`[steam-price-queue] Не удалось сохранить кеш: ${error.message}`);
  }
}

function requestUrl(input) {
  try {
    return typeof input === 'string' ? input : String(input?.url || input);
  } catch (_) {
    return '';
  }
}

function isSteamPriceRequest(url) {
  return /^https?:\/\/steamcommunity\.com\/market\/priceoverview\//i.test(url)
    && /(?:[?&])appid=730(?:&|$)/i.test(url);
}

function makeResponse(data, state) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-steam-price-cache': state
    }
  });
}

function getCached(url) {
  const entry = cache.get(url);
  if (!entry) return null;
  const age = Date.now() - Number(entry.at);
  if (age > STALE_TTL) {
    cache.delete(url);
    return null;
  }
  return { response: makeResponse(entry.data, age <= FRESH_TTL ? 'hit' : 'stale'), stale: age > FRESH_TTL };
}

function enqueue(url, init, foreground = false, resolve = null, reject = null) {
  if (foreground || !queuedUrls.has(url)) {
    queuedUrls.add(url);
    queue.push({ url, init, foreground, resolve, reject });
    runQueue().catch(error => console.error('[steam-price-queue]', error));
  }
}

async function runQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const task = queue.shift();
      queuedUrls.delete(task.url);

      const wait = MIN_INTERVAL - (Date.now() - lastRequestAt);
      if (wait > 0) await sleep(wait);

      let response;
      try {
        lastRequestAt = Date.now();
        response = await nativeFetch(task.url, task.init);
      } catch (error) {
        if (task.foreground && task.reject) task.reject(error);
        continue;
      }

      if (response.status === 429) {
        queuedUrls.add(task.url);
        queue.unshift(task);
        await sleep(RETRY_AFTER_429);
        continue;
      }

      if (response.ok) {
        try {
          const data = await response.clone().json();
          cache.set(task.url, { at: Date.now(), data });
          dirty = true;
          saveDiskCache();
          if (task.foreground && task.resolve) task.resolve(makeResponse(data, 'miss'));
          continue;
        } catch (_) {}
      }

      if (task.foreground && task.resolve) task.resolve(response);
    }
  } finally {
    running = false;
  }
}

global.fetch = function steamAwareFetch(input, init) {
  const url = requestUrl(input);
  if (!isSteamPriceRequest(url)) return nativeFetch(input, init);

  const cached = getCached(url);
  if (cached) {
    // Known price -> return immediately. If older than FRESH_TTL, update it
    // asynchronously. The caller never waits for the network refresh.
    if (cached.stale) enqueue(url, init, false);
    return Promise.resolve(cached.response);
  }

  return new Promise((resolve, reject) => {
    enqueue(url, init, true, resolve, reject);
  });
};

loadDiskCache();
process.once('exit', saveDiskCache);
console.log('[steam-price-queue] Persistent cache enabled; known prices are instant, refresh runs in background.');
