'use strict';

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Client, types } = require('pg');

types.setTypeParser(20, value => (value === null ? null : Number(value)));
types.setTypeParser(1700, value => (value === null ? null : Number(value)));

const status = new Int32Array(workerData.status);
const payload = new Uint8Array(workerData.payload);
const capacity = payload.length;

let client = null;
let connecting = null;

async function ensureClient() {
  if (client) return client;
  if (!connecting) {
    connecting = (async () => {
      const next = new Client(workerData.config);
      await next.connect();
      client = next;
      return client;
    })();
  }
  return connecting;
}

function reply(value) {
  const text = JSON.stringify(value);
  const bytes = Buffer.from(text, 'utf8');
  if (bytes.length + 1 < capacity) {
    payload[0] = 0;
    bytes.copy(Buffer.from(payload.buffer, payload.byteOffset + 1, capacity - 1));
    Atomics.store(status, 1, bytes.length);
  } else {
    const file = path.join(os.tmpdir(), `pgw-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(file, bytes);
    const marker = Buffer.from(file, 'utf8');
    payload[0] = 1;
    marker.copy(Buffer.from(payload.buffer, payload.byteOffset + 1, capacity - 1));
    Atomics.store(status, 1, marker.length);
  }
  Atomics.store(status, 0, 1);
  Atomics.notify(status, 0);
}

parentPort.on('message', async message => {
  try {
    const db = await ensureClient();
    if (message.type === 'ping') return reply({ ok: true });

    if (message.type === 'query') {
      const result = await db.query(message.sql, message.params || []);
      return reply({
        ok: true,
        rows: result.rows || [],
        rowCount: result.rowCount == null ? 0 : result.rowCount
      });
    }

    if (message.type === 'batch') {
      const out = [];
      for (const statement of message.statements) {
        const result = await db.query(statement.sql, statement.params || []);
        out.push({ rows: result.rows || [], rowCount: result.rowCount == null ? 0 : result.rowCount });
      }
      return reply({ ok: true, results: out });
    }

    reply({ ok: false, error: `Неизвестная команда: ${message.type}` });
  } catch (error) {
    reply({ ok: false, error: error.message, code: error.code });
  }
});
