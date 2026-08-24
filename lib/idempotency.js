'use strict';

const crypto = require('crypto');

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const key of Object.keys(value).sort()) result[key] = stableValue(value[key]);
  return result;
}

function requestFingerprint(req, scope) {
  const payload = {
    method: String(req.method || '').toUpperCase(),
    scope,
    params: req.params || {},
    body: req.body || {}
  };
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(payload))).digest('hex');
}

function requestId(req) {
  const value = String(req.get('Idempotency-Key') || req.body?.requestId || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/.test(value)) {
    throw new ApiError(428, 'IDEMPOTENCY_KEY_REQUIRED', 'Для операции требуется корректный Idempotency-Key');
  }
  return value;
}

function parseResponse(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(500, 'IDEMPOTENCY_RESPONSE_INVALID', 'Сохранённый результат операции повреждён');
  }
}

function createIdempotency(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS idempotency_operations(
      user_id INTEGER NOT NULL,
      scope TEXT NOT NULL,
      request_id TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      response_code INTEGER,
      response_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY(user_id,scope,request_id)
    );
    CREATE TABLE IF NOT EXISTS operation_guards(
      user_id INTEGER NOT NULL,
      scope TEXT NOT NULL,
      last_started_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id,scope)
    );
    CREATE TABLE IF NOT EXISTS operation_audit(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scope TEXT NOT NULL,
      request_id TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      response_code INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_idempotency_expiry ON idempotency_operations(expires_at);
    CREATE INDEX IF NOT EXISTS idx_operation_audit_user ON operation_audit(user_id,id DESC);
  `);

  const insertOperation = db.prepare(`
    INSERT INTO idempotency_operations(user_id,scope,request_id,request_hash,status,response_code,response_json,created_at,updated_at,expires_at)
    VALUES(?,?,?,?,'PROCESSING',NULL,NULL,?,?,?)
    ON CONFLICT(user_id,scope,request_id) DO NOTHING
  `);
  const getOperation = db.prepare('SELECT * FROM idempotency_operations WHERE user_id=? AND scope=? AND request_id=?');
  const completeOperation = db.prepare(`
    UPDATE idempotency_operations
    SET status='COMPLETED',response_code=?,response_json=?,updated_at=?
    WHERE user_id=? AND scope=? AND request_id=? AND status='PROCESSING'
  `);
  const insertGuard = db.prepare(`
    INSERT INTO operation_guards(user_id,scope,last_started_at) VALUES(?,?,0)
    ON CONFLICT(user_id,scope) DO NOTHING
  `);
  const updateGuard = db.prepare(`
    UPDATE operation_guards SET last_started_at=?
    WHERE user_id=? AND scope=? AND last_started_at<=?
  `);
  const insertAudit = db.prepare(`
    INSERT INTO operation_audit(user_id,scope,request_id,request_hash,response_code,created_at)
    VALUES(?,?,?,?,?,?)
  `);

  function run(req, userId, scope, work, options = {}) {
    const key = requestId(req);
    const fingerprint = requestFingerprint(req, scope);
    const ttl = Math.max(60_000, Number(options.ttl || 24 * 60 * 60 * 1000));
    const cooldown = Math.max(0, Number(options.cooldown || 0));
    return db.transaction(() => {
      const now = Date.now();
      const inserted = insertOperation.run(userId, scope, key, fingerprint, now, now, now + ttl);
      if (!inserted.changes) {
        const existing = getOperation.get(userId, scope, key);
        if (!existing) throw new ApiError(409, 'OPERATION_CONFLICT', 'Операция конфликтует с другим запросом');
        if (existing.request_hash !== fingerprint) {
          throw new ApiError(409, 'IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key уже использован для другого запроса');
        }
        if (existing.status === 'COMPLETED' && existing.response_json) {
          return { status: Number(existing.response_code || 200), payload: parseResponse(existing.response_json), replayed: true, requestId: key };
        }
        throw new ApiError(409, 'OPERATION_IN_PROGRESS', 'Операция уже выполняется, повторите запрос позже');
      }
      if (cooldown > 0) {
        insertGuard.run(userId, scope);
        const guarded = updateGuard.run(now, userId, scope, now - cooldown);
        if (!guarded.changes) throw new ApiError(429, 'OPERATION_RATE_LIMITED', 'Операции выполняются слишком часто');
      }
      const value = work({ requestId: key, now });
      const status = Number(value?.status || 200);
      const payload = value && Object.prototype.hasOwnProperty.call(value, 'payload') ? value.payload : value;
      const serialized = JSON.stringify(payload == null ? {} : payload);
      const completed = completeOperation.run(status, serialized, Date.now(), userId, scope, key);
      if (!completed.changes) throw new ApiError(409, 'OPERATION_CONFLICT', 'Не удалось зафиксировать результат операции');
      insertAudit.run(userId, scope, key, fingerprint, status, now);
      return { status, payload, replayed: false, requestId: key };
    })();
  }

  function clean() {
    return db.prepare('DELETE FROM idempotency_operations WHERE expires_at<?').run(Date.now()).changes;
  }

  return { run, clean, requestId };
}

function sendApiError(res, error, fallback = 'Не удалось выполнить операцию') {
  const status = Number(error?.status || error?.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const code = error?.code || (safeStatus === 500 ? 'INTERNAL_ERROR' : 'INVALID_OPERATION');
  const message = safeStatus === 500 && !(error instanceof ApiError) ? fallback : String(error?.message || fallback);
  const payload = { error: message, code };
  if (error?.details !== undefined) payload.details = error.details;
  return res.status(safeStatus).json(payload);
}

module.exports = { ApiError, createIdempotency, sendApiError, stableValue, requestFingerprint };
