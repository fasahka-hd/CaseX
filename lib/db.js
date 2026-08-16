'use strict';

const path = require('path');

const DRIVER = String(process.env.DB_DRIVER || 'sqlite').toLowerCase();

function createSqlite() {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const file = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
  const shm = file + '-shm';
  const wal = file + '-wal';

  function cleanupWal() {
    try { if (fs.existsSync(shm)) fs.unlinkSync(shm); } catch {}
    try { if (fs.existsSync(wal)) fs.unlinkSync(wal); } catch {}
  }

  function safeBackupAndDelete() {
    const backup = file + `.corrupt.${Date.now()}.bak`;
    try {
      if (fs.existsSync(file)) {
        try {
          fs.renameSync(file, backup);
          console.warn(`[db] База повреждена, переименована в ${path.basename(backup)}`);
        } catch (e) {
          if (e.code === 'EBUSY' || e.code === 'EPERM') {
            console.warn(`[db] Не удалось переименовать (файл занят), пробую скопировать и удалить...`);
            try {
              fs.copyFileSync(file, backup);
              console.warn(`[db] Скопировал битую базу в ${path.basename(backup)}`);
              try { fs.unlinkSync(file); } catch {}
            } catch (e2) {
              console.warn(`[db] Не удалось даже скопировать, просто удаляю оригинал`);
              try { fs.unlinkSync(file); } catch {}
            }
          } else throw e;
        }
      }
    } catch (err) {
      console.error('[db] Ошибка бекапа:', err.message);
      try { fs.unlinkSync(file); } catch {}
    }
    cleanupWal();
  }

  function tryOpen() {
    let db;
    try {
      db = new Database(file);
    } catch (openErr) {
      throw openErr;
    }
    try {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      return db;
    } catch (pragmaErr) {
      try { db.close(); } catch {}
      throw pragmaErr;
    }
  }

  let db;
  try {
    db = tryOpen();
  } catch (e) {
    const code = e && e.code;
    console.error(`[db] Ошибка открытия ${file}: ${e.message} (${code}), пробую восстановить...`);
    if (code === 'SQLITE_CORRUPT' || /malformed|disk image/i.test(e.message)) {
      cleanupWal();
      try {
        db = tryOpen();
        console.log('[db] Восстановлено после удаления WAL/SHM');
      } catch (e2) {
        console.error(`[db] Повторно битая: ${e2.message}, делаю полный сброс...`);
        safeBackupAndDelete();
        try {
          db = tryOpen();
          console.log('[db] Создана новая база после повреждения');
        } catch (e3) {
          console.error('[db] Не удалось восстановить базу:', e3.message);
          console.error('[db] Удали вручную файлы: data.sqlite, data.sqlite-shm, data.sqlite-wal');
          throw e3;
        }
      }
    } else {
      throw e;
    }
  }

  return {
    driver: 'sqlite',
    raw: db,
    prepare: sql => db.prepare(sql),
    exec: sql => db.exec(sql),
    transaction: fn => db.transaction(fn),
    pragma: (...args) => db.pragma(...args),
    close: () => db.close(),
    describe: () => `SQLite: ${file}`
  };
}

function quoteAliases(sql) {
  return sql.replace(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)/g, (match, alias) => {
    if (!/[A-Z]/.test(alias)) return match;
    return `AS "${alias}"`;
  });
}

function toPgSql(sql) {
  let index = 0;
  let out = '';
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === '?') {
      index += 1;
      out += '$' + index;
      continue;
    }
    out += ch;
  }
  return out;
}

function translateDdl(sql) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, '\u0000SERIAL\u0000')
    .replace(/\bINTEGER\b/gi, 'BIGINT')
    .replace(/\u0000SERIAL\u0000/g, 'BIGSERIAL PRIMARY KEY')
    .replace(/\bDATETIME\b/gi, 'BIGINT')
    .replace(/\bREAL\b/gi, 'DOUBLE PRECISION');
}

function normalize(value) {
  if (typeof value === 'bigint') return Number(value);
  return value;
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const key of Object.keys(row)) out[key] = normalize(row[key]);
  return out;
}

function createPostgres() {
  const { createSyncClient } = require('./pg-sync');
  const config = {
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'upgrader',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'upgrader'
  };

  const client = createSyncClient(config);
  const cache = new Map();

  const NO_ID_TABLES = new Set(['case_overrides', 'settings', 'sessions']);

  function compile(sql) {
    let entry = cache.get(sql);
    if (entry) return entry;
    const pgSql = toPgSql(quoteAliases(sql));
    const isInsert = /^\s*insert\b/i.test(pgSql);
    const target = (pgSql.match(/insert\s+into\s+([A-Za-z_][A-Za-z0-9_]*)/i) || [])[1];
    const canReturn = isInsert && !/returning/i.test(pgSql) && !NO_ID_TABLES.has(String(target || '').toLowerCase());
    entry = {
      pgSql,
      runSql: canReturn ? `${pgSql} RETURNING id` : pgSql
    };
    cache.set(sql, entry);
    return entry;
  }

  return {
    driver: 'postgres',
    config,
    prepare(sql) {
      const { pgSql, runSql } = compile(sql);
      return {
        get(...params) {
          const result = client.query(pgSql, params);
          return normalizeRow(result.rows[0]);
        },
        all(...params) {
          const result = client.query(pgSql, params);
          return result.rows.map(normalizeRow);
        },
        run(...params) {
          const result = client.query(runSql, params);
          const first = result.rows && result.rows[0];
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: first && first.id != null ? Number(first.id) : 0
          };
        }
      };
    },
    exec(sql) {
      const parts = translateDdl(sql)
        .split(';')
        .map(part => part.trim())
        .filter(Boolean);
      for (const part of parts) client.query(part, []);
    },
    transaction(fn) {
      return (...args) => {
        client.query('BEGIN', []);
        try {
          const result = fn(...args);
          client.query('COMMIT', []);
          return result;
        } catch (error) {
          try { client.query('ROLLBACK', []); } catch (_) {}
          throw error;
        }
      };
    },
    pragma() {},
    close() { client.terminate(); },
    describe: () => `PostgreSQL: ${config.user}@${config.host}:${config.port}/${config.database}`
  };
}

module.exports = DRIVER === 'postgres' ? createPostgres() : createSqlite();
