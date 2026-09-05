'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { createQueue } = require('../lib/queue');

test('очередь: обработка события', async () => {
  const queue = createQueue();
  let received = null;
  queue.on('demo', payload => { received = payload; });
  queue.publish('demo', { value: 42 });
  for (let i = 0; i < 50 && received === null; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.deepStrictEqual(received, { value: 42 });
  assert.strictEqual(queue.stats().processed, 1);
  assert.strictEqual(queue.stats().driver, 'in-process');
});

test('очередь: ретраи при ошибке и отказ после maxAttempts', async () => {
  const queue = createQueue();
  let attempts = 0;
  queue.on('flaky', async () => {
    attempts += 1;
    throw new Error('boom');
  });
  queue.publish('flaky', {}, { maxAttempts: 2 });
  for (let i = 0; i < 80 && queue.stats().errors === 0; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.ok(attempts >= 2);
  assert.strictEqual(queue.stats().errors, 1);
});

test('очередь: нет обработчика — ошибка без падения процесса', async () => {
  const queue = createQueue();
  queue.publish('missing-topic', {});
  for (let i = 0; i < 50 && queue.stats().errors === 0; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.strictEqual(queue.stats().errors, 1);
});
