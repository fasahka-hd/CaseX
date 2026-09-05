'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const Database = require('better-sqlite3');
const { ApiError, createIdempotency, sendApiError } = require('../lib/idempotency');

function buildDb() {
  const db = new Database(':memory:');
  return {
    exec: sql => db.exec(sql),
    prepare: sql => db.prepare(sql),
    transaction: fn => (...args) => db.transaction(fn)(...args)
  };
}

function fakeRequest(idempotencyKey, body = {}) {
  return {
    method: 'POST',
    get: name => (name === 'Idempotency-Key' ? idempotencyKey : undefined),
    params: {},
    body
  };
}

test('идемпотентность: повтор ключа возвращает сохранённый ответ', () => {
  const api = createIdempotency(buildDb());
  const key = 'test-key-000000000001';
  const first = api.run(fakeRequest(key, { a: 1 }), 1, 'scope', ({ now }) => ({ ok: true, now }));
  const second = api.run(fakeRequest(key, { a: 1 }), 1, 'scope', () => ({ ok: true }));
  assert.strictEqual(first.replayed, false);
  assert.strictEqual(second.replayed, true);
  assert.deepStrictEqual(second.payload, first.payload);
});

test('идемпотентность: тот же ключ с другим телом отклоняется', () => {
  const api = createIdempotency(buildDb());
  const key = 'test-key-000000000002';
  api.run(fakeRequest(key, { a: 1 }), 1, 'scope', () => ({ ok: true }));
  assert.throws(
    () => api.run(fakeRequest(key, { a: 2 }), 1, 'scope', () => ({ ok: true })),
    error => error instanceof ApiError && error.code === 'IDEMPOTENCY_KEY_REUSED'
  );
});

test('идемпотентность: cooldown ограничивает частоту операций', () => {
  const api = createIdempotency(buildDb());
  const first = api.run(fakeRequest('test-key-000000000003'), 1, 'scope', () => ({ ok: true }), { cooldown: 60000 });
  assert.strictEqual(first.replayed, false);
  assert.throws(
    () => api.run(fakeRequest('test-key-000000000004'), 1, 'scope', () => ({ ok: true }), { cooldown: 60000 }),
    error => error instanceof ApiError && error.code === 'OPERATION_RATE_LIMITED'
  );
});

test('sendApiError не раскрывает внутренние коды ошибок', () => {
  const headers = {};
  const res = {
    status(code) { headers.code = code; return this; },
    json(payload) { headers.payload = payload; return this; }
  };
  const error = new Error('unique constraint');
  error.code = 'SQLITE_CONSTRAINT_UNIQUE';
  sendApiError(res, error, 'Не удалось выполнить операцию');
  assert.strictEqual(headers.code, 500);
  assert.strictEqual(headers.payload.code, 'INTERNAL_ERROR');
});

test('sendApiError сохраняет код ApiError', () => {
  const headers = {};
  const res = {
    status(code) { headers.code = code; return this; },
    json(payload) { headers.payload = payload; return this; }
  };
  sendApiError(res, new ApiError(422, 'CUSTOM_CODE', 'Сообщение'));
  assert.strictEqual(headers.code, 422);
  assert.strictEqual(headers.payload.code, 'CUSTOM_CODE');
});
