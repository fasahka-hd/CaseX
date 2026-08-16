'use strict';

// Steam Market priceoverview is rate-limited. Keep the queue, but persist the
// results so a server restart never starts a 2k-item price crawl from zero.
// Cached values are served immediately (stale-while-revalidate) and refreshed
// in the background.
const fs = require('fs');
const path = require('path');

const CACHE_TTL = 24 * 60 * 60 * 1000;
const STALE_TTL = 7 * 24 * 60 * 60 * 1000;
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
      if (entry && entry.at && entry.data && Date.now() - entry.at <= STALE_TTL) {
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
    const data = Object.fromEntries(cache);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
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

function makeResponse(data, cacheState) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-steam-price-cache': cacheState
    }
  });
}

function cached(url) {
  const entry = cache.get(url);
  if (!entry) return null;

  const age = Date.now() - entry.at;
  if (age > STALE_TTL) {
    cache.delete(url);
    return null;
  }

  return makeResponse(entry.data, age <= CACHE_TTL ? 'hit' : 'stale');
}

function enqueueRefresh(url, init) {
  if (queuedUrls.has(url)) return;
  queuedUrls.add(url);
  queue.push({ url, init, background: true });
  runQueue().catch(error => console.error('[steam-price-queue]', error));
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
        if (!task.background && task.reject) task.reject(error);
        continue;
      }

      if (response.status === 429) {
        queue.unshift(task);
        queuedUrls.add(task.url);
        await sleep(RETRY_AFTER_429);
        continue;
      }

      if (response.ok) {
        try {
          const data = await response.clone().json();
          cache.set(task.url, { at: Date.now(), data });
          dirty = true;
          saveDiskCache();
          if (!task.background && task.resolve) task.resolve(makeResponse(data, 'miss'));
          continue;
        } catch (_) {}
      }

      if (!task.background && task.resolve) task.resolve(response);
    }
  } finally {
    running = false;
  }
}

global.fetch = function steamAwareFetch(input, init) {
  const url = requestUrl(input);
  if (!isSteamPriceRequest(url)) return nativeFetch(input, init);

  const hit = cached(url);
  if (hit) {
    // Serve the cached price immediately. If it is older than a day, refresh
    // it in the background instead of delaying server startup.
    if (hit.headers.get('x-steam-price-cache') === 'stale') {
      enqueueRefresh(url, init);
    }
    return Promise.resolve(hit);
  }

  return new Promise((resolve, reject) => {
    if (queuedUrls.has(url)) {
      // Another request is already refreshing this URL. If no cache exists,
      // attach a normal foreground request so the caller still receives data.
      queue.push({ url, init, resolve, reject, background: false });
      return;
    }
    queuedUrls.add(url);
    queue.push({ url, init, resolve, reject, background: false });
    runQueue().catch(error => reject(error));
  });
};

loadDiskCache();
process.once('exit', saveDiskCache);
console.log('[steam-price-queue] Steam prices use persistent cache + background refresh.');
