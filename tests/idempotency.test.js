'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { createIdempotency, ApiError } = require('../lib/idempotency');

function database() {
  const raw = new Database(':memory:');
  return {
    driver: 'sqlite',
    prepare: sql => raw.prepare(sql),
    exec: sql => raw.exec(sql),
    transaction: fn => raw.transaction(fn),
    close: () => raw.close()
  };
}

function request(key, body = { value: 1 }) {
  return {
    method: 'POST',
    params: {},
    body,
    get(name) {
      return String(name).toLowerCase() === 'idempotency-key' ? key : '';
    }
  };
}

test('replays the stored result without executing work twice', () => {
  const db = database();
  const operations = createIdempotency(db);
  let executions = 0;
  const first = operations.run(request('test:operation-00000001'), 7, 'test', () => {
    executions += 1;
    return { ok: true, executions };
  });
  const replay = operations.run(request('test:operation-00000001'), 7, 'test', () => {
    executions += 1;
    return { ok: false };
  });
  assert.equal(executions, 1);
  assert.deepEqual(first.payload, replay.payload);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  db.close();
});

test('rejects reuse of a key with a different payload', () => {
  const db = database();
  const operations = createIdempotency(db);
  operations.run(request('test:operation-00000002', { value: 1 }), 7, 'test', () => ({ ok: true }));
  assert.throws(
    () => operations.run(request('test:operation-00000002', { value: 2 }), 7, 'test', () => ({ ok: true })),
    error => error instanceof ApiError && error.code === 'IDEMPOTENCY_KEY_REUSED'
  );
  db.close();
});

test('rolls back an operation and permits a safe retry after failure', () => {
  const db = database();
  const operations = createIdempotency(db);
  db.exec('CREATE TABLE values_table(value INTEGER NOT NULL)');
  assert.throws(() => operations.run(request('test:operation-00000003'), 7, 'test', () => {
    db.prepare('INSERT INTO values_table(value) VALUES(?)').run(1);
    throw new ApiError(409, 'TEST_FAILURE', 'failure');
  }));
  const result = operations.run(request('test:operation-00000003'), 7, 'test', () => {
    db.prepare('INSERT INTO values_table(value) VALUES(?)').run(2);
    return { ok: true };
  });
  assert.equal(result.payload.ok, true);
  assert.deepEqual(db.prepare('SELECT value FROM values_table').all(), [{ value: 2 }]);
  db.close();
});

test('requires a valid operation key', () => {
  const db = database();
  const operations = createIdempotency(db);
  assert.throws(
    () => operations.run(request('short'), 7, 'test', () => ({ ok: true })),
    error => error instanceof ApiError && error.status === 428
  );
  db.close();
});
