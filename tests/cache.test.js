'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

process.env.REDIS_ENABLED = '0';
const cache = require('../lib/cache');

test('кеш: запись и чтение', () => {
  cache.set('t:key', { hello: 'мир' }, 60);
  assert.deepStrictEqual(cache.get('t:key'), { hello: 'мир' });
});

test('кеш: истечение по TTL', async () => {
  cache.set('t:ttl', 'value', 0);
  assert.strictEqual(cache.get('t:ttl'), 'value');
  cache.set('t:ttl2', 'gone', 1);
  await new Promise(resolve => setTimeout(resolve, 1100));
  assert.strictEqual(cache.get('t:ttl2'), null);
});

test('кеш: удаление', () => {
  cache.set('t:del', 1, 60);
  cache.del('t:del');
  assert.strictEqual(cache.get('t:del'), null);
});

test('кеш: счётчик окна', async () => {
  cache.hit('t:rl', 1);
  cache.hit('t:rl', 1);
  const count = cache.hit('t:rl', 1);
  assert.strictEqual(count, 3);
  await new Promise(resolve => setTimeout(resolve, 1100));
  assert.strictEqual(cache.hit('t:rl', 1), 1);
});

test('кеш: драйвер по умолчанию память', () => {
  assert.strictEqual(cache.driver, 'memory');
  assert.strictEqual(cache.ready, true);
});
