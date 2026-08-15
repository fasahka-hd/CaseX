'use strict';

const fs = require('fs');
const path = require('path');
const { Worker, receiveMessageOnPort } = require('worker_threads');

const PAYLOAD_BYTES = 8 * 1024 * 1024;

function createSyncClient(config) {
  const status = new Int32Array(new SharedArrayBuffer(8));
  const payload = new Uint8Array(new SharedArrayBuffer(PAYLOAD_BYTES));

  const worker = new Worker(path.join(__dirname, 'pg-worker.js'), {
    workerData: { config, status: status.buffer, payload: payload.buffer }
  });
  worker.unref();

  function call(message) {
    Atomics.store(status, 0, 0);
    Atomics.store(status, 1, 0);
    worker.postMessage(message);

    const deadline = Date.now() + 30000;
    while (Atomics.load(status, 0) === 0) {
      const waited = Atomics.wait(status, 0, 0, 250);
      if (waited === 'timed-out' && Date.now() > deadline) {
        throw new Error('PostgreSQL: таймаут ожидания ответа');
      }
    }

    const length = Atomics.load(status, 1);
    const mode = payload[0];
    const raw = Buffer.from(payload.buffer, payload.byteOffset + 1, length).toString('utf8');
    let text = raw;
    if (mode === 1) {
      text = fs.readFileSync(raw, 'utf8');
      try { fs.unlinkSync(raw); } catch (_) {}
    }

    const parsed = JSON.parse(text);
    if (!parsed.ok) {
      const error = new Error(parsed.error || 'Ошибка PostgreSQL');
      error.code = parsed.code;
      throw error;
    }
    return parsed;
  }

  return {
    query: (sql, params) => call({ type: 'query', sql, params }),
    batch: statements => call({ type: 'batch', statements }),
    ping: () => call({ type: 'ping' }),
    terminate: () => worker.terminate()
  };
}

module.exports = { createSyncClient };
