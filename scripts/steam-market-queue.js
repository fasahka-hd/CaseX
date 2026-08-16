'use strict';

// Steam Community Market aggressively rate-limits price endpoints by IP.
// The server asks for many item prices in parallel, so serialize only
// priceoverview requests and keep a short in-process cache.
const CACHE_TTL = 15 * 60 * 1000;
const MIN_INTERVAL = 4000;
const RETRY_AFTER_429 = 60 * 1000;

const nativeFetch = global.fetch;
const cache = new Map();
const queue = [];
let running = false;
let lastRequestAt = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

function cached(url) {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL) {
    cache.delete(url);
    return null;
  }
  return new Response(JSON.stringify(entry.data), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-steam-price-cache': 'hit' }
  });
}

async function runQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const task = queue.shift();
      const hit = cached(task.url);
      if (hit) {
        task.resolve(hit);
        continue;
      }

      const wait = MIN_INTERVAL - (Date.now() - lastRequestAt);
      if (wait > 0) await sleep(wait);

      let response;
      try {
        lastRequestAt = Date.now();
        response = await nativeFetch(task.url, task.init);
      } catch (error) {
        task.reject(error);
        continue;
      }

      if (response.status === 429) {
        queue.unshift(task);
        await sleep(RETRY_AFTER_429);
        continue;
      }

      if (response.ok) {
        try {
          const data = await response.clone().json();
          cache.set(task.url, { at: Date.now(), data });
          task.resolve(new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'content-type': 'application/json; charset=utf-8', 'x-steam-price-cache': 'miss' }
          }));
          continue;
        } catch (_) {}
      }

      task.resolve(response);
    }
  } finally {
    running = false;
  }
}

global.fetch = function steamAwareFetch(input, init) {
  const url = requestUrl(input);
  if (!isSteamPriceRequest(url)) return nativeFetch(input, init);

  const hit = cached(url);
  if (hit) return Promise.resolve(hit);

  return new Promise((resolve, reject) => {
    queue.push({ url, init, resolve, reject });
    runQueue().catch(error => {
      console.error('[steam-price-queue]', error);
    });
  });
};

console.log('[steam-price-queue] Steam priceoverview requests are serialized to avoid Market rate limits.');
