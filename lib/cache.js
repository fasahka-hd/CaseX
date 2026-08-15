'use strict';

const FLAG = String(process.env.REDIS_ENABLED == null ? '' : process.env.REDIS_ENABLED).trim().toLowerCase();
const ENABLED = ['0', 'false', 'no', 'off'].includes(FLAG)
  ? false
  : (['1', 'true', 'yes', 'on'].includes(FLAG) || !!process.env.REDIS_URL);

function createMemoryCache() {
  const store = new Map();
  const hits = new Map();

  function purge() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expires && entry.expires < now) store.delete(key);
    }
  }
  setInterval(purge, 60000).unref();

  return {
    driver: 'memory',
    ready: true,
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expires && entry.expires < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key, value, ttlSeconds) {
      store.set(key, { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    },
    del(key) { store.delete(key); },
    hit(key, windowSeconds) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.reset < now) {
        hits.set(key, { count: 1, reset: now + windowSeconds * 1000 });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },
    describe: () => 'Кеш: память процесса',
    close() {}
  };
}

function createRedisCache() {
  const Redis = require('ioredis');
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true
  });

  const fallback = createMemoryCache();
  let healthy = false;

  client.on('ready', () => { healthy = true; });
  client.on('error', () => { healthy = false; });
  client.on('end', () => { healthy = false; });

  const mirror = new Map();

  return {
    driver: 'redis',
    get ready() { return healthy; },
    get(key) {
      const entry = mirror.get(key);
      if (!entry) return fallback.get(key);
      if (entry.expires && entry.expires < Date.now()) {
        mirror.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key, value, ttlSeconds) {
      mirror.set(key, { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
      fallback.set(key, value, ttlSeconds);
      if (!healthy) return;
      const payload = JSON.stringify(value);
      if (ttlSeconds) client.set(key, payload, 'EX', ttlSeconds).catch(() => {});
      else client.set(key, payload).catch(() => {});
    },
    del(key) {
      mirror.delete(key);
      fallback.del(key);
      if (healthy) client.del(key).catch(() => {});
    },
    hit(key, windowSeconds) {
      const count = fallback.hit(key, windowSeconds);
      if (healthy) {
        client.multi().incr(key).expire(key, windowSeconds).exec().catch(() => {});
      }
      return count;
    },
    async getAsync(key) {
      if (!healthy) return fallback.get(key);
      try {
        const raw = await client.get(key);
        return raw == null ? null : JSON.parse(raw);
      } catch (_) {
        return fallback.get(key);
      }
    },
    async ping() {
      try { return (await client.ping()) === 'PONG'; } catch (_) { return false; }
    },
    describe: () => `Кеш: Redis ${url}${healthy ? ' — подключён' : ' (ожидание подключения, работает память)'}`,
    close() { try { client.disconnect(); } catch (_) {} }
  };
}

module.exports = ENABLED ? createRedisCache() : createMemoryCache();
