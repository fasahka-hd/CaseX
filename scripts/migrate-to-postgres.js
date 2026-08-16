'use strict';

const path = require('path');
const fs = require('fs');

const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data.sqlite');

if (!fs.existsSync(sqlitePath)) {
  console.error(`Файл SQLite не найден: ${sqlitePath}`);
  process.exit(1);
}

process.env.DB_DRIVER = 'postgres';

const Database = require('better-sqlite3');
const target = require('../lib/db');

const source = new Database(sqlitePath, { readonly: true });

const ORDER = [
  'users',
  'sessions',
  'live_drops',
  'support_messages',
  'site_inventory',
  'case_openings',
  'upgrade_rounds',
  'inventory_sales',
  'transactions',
  'admin_logs',
  'promo_codes',
  'promo_redemptions',
  'case_overrides',
  'settings'
];

const SEQUENCES = {
  users: 'users_id_seq',
  live_drops: 'live_drops_id_seq',
  support_messages: 'support_messages_id_seq',
  site_inventory: 'site_inventory_id_seq',
  case_openings: 'case_openings_id_seq',
  upgrade_rounds: 'upgrade_rounds_id_seq',
  inventory_sales: 'inventory_sales_id_seq',
  transactions: 'transactions_id_seq',
  admin_logs: 'admin_logs_id_seq',
  promo_codes: 'promo_codes_id_seq',
  promo_redemptions: 'promo_redemptions_id_seq'
};

function sourceTables() {
  return source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all().map(row => row.name);
}

function targetColumns(table) {
  return target.prepare(`SELECT column_name AS name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ?`)
    .all(table).map(row => row.name);
}

function migrate() {
  const available = new Set(sourceTables());
  let totalRows = 0;

  console.log(`Источник: ${sqlitePath}`);
  console.log(`Приёмник: ${target.describe()}\n`);

  console.log('Очистка таблиц приёмника...');
  for (const table of [...ORDER].reverse()) {
    try {
      target.prepare(`DELETE FROM ${table}`).run();
    } catch (_) {}
  }

  for (const table of ORDER) {
    if (!available.has(table)) {
      console.log(`· ${table} — нет в SQLite, пропуск`);
      continue;
    }

    const columns = targetColumns(table);
    if (!columns.length) {
      console.log(`· ${table} — нет в PostgreSQL, пропуск (запустите сервер один раз для создания схемы)`);
      continue;
    }

    const rows = source.prepare(`SELECT * FROM ${table}`).all();
    if (!rows.length) {
      console.log(`· ${table} — пусто`);
      continue;
    }

    const usable = Object.keys(rows[0]).filter(key => columns.includes(key));
    const placeholders = usable.map(() => '?').join(',');
    const sql = `INSERT INTO ${table}(${usable.join(',')}) VALUES(${placeholders})`;
    const statement = target.prepare(sql);

    let inserted = 0;
    for (const row of rows) {
      try {
        statement.run(...usable.map(key => row[key]));
        inserted += 1;
      } catch (error) {
        console.warn(`  ! ${table}: строка пропущена — ${error.message}`);
      }
    }

    totalRows += inserted;
    console.log(`· ${table} — перенесено ${inserted} из ${rows.length}`);

    const sequence = SEQUENCES[table];
    if (sequence && inserted) {
      try {
        target.prepare(`SELECT setval('${sequence}', COALESCE((SELECT MAX(id) FROM ${table}), 1))`).get();
      } catch (error) {
        console.warn(`  ! ${table}: не удалось сдвинуть счётчик — ${error.message}`);
      }
    }
  }

  console.log(`\nГотово. Всего перенесено строк: ${totalRows}`);
  source.close();
  target.close();
}

migrate();
