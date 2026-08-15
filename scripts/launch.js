'use strict';

const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const isWindows = process.platform === 'win32';

const args = process.argv.slice(2);
const FORCE_SQLITE = args.includes('--sqlite');
const FORCE_PG = args.includes('--pg');
const NO_DEV = args.includes('--no-dev');

function log(message) {
  console.log(message);
}

function has(command) {
  try {
    execSync(isWindows ? `where ${command}` : `command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

function quiet(command, cmdArgs, options = {}) {
  try {
    return execFileSync(command, cmdArgs, { encoding: 'utf8', stdio: 'pipe', timeout: 60000, ...options });
  } catch (_) {
    return null;
  }
}

function portOpen(port, host = '127.0.0.1', timeout = 700) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

function readEnvFile() {
  const out = {};
  try {
    const text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) out[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch (_) {}
  return out;
}

const fileEnv = readEnvFile();
const setting = key => process.env[key] || fileEnv[key] || '';

const PG_PORT = Number(setting('PGPORT') || 5432);
const PG_USER = setting('PGUSER') || 'upgrader';
const PG_PASS = setting('PGPASSWORD') || 'upgrader_dev_pass';
const PG_DB = setting('PGDATABASE') || 'upgrader';

async function tryStartServices() {
  let pg = await portOpen(PG_PORT);
  let redis = await portOpen(6379);
  if (pg && redis) return { pg, redis, started: false };

  let started = false;

  if (has('docker')) {
    const running = quiet('docker', ['info']);
    if (running) {
      log('  · Найден Docker — поднимаю postgres и redis…');
      quiet('docker', ['compose', 'up', '-d', 'postgres', 'redis'], { cwd: path.join(ROOT, 'deploy') });
      started = true;
    }
  }

  if (!isWindows) {
    if (!pg && has('pg_ctlcluster')) {
      if (quiet('sudo', ['-n', 'pg_ctlcluster', '17', 'main', 'start']) !== null) {
        log('  · Запущен системный PostgreSQL');
        started = true;
      }
    }
    if (!redis && has('redis-server')) {
      if (quiet('sudo', ['-n', 'redis-server', '/etc/redis/redis.conf', '--daemonize', 'yes']) !== null) {
        log('  · Запущен Redis');
        started = true;
      }
    }
  } else {
    if (!pg) {
      const out = quiet('powershell', ['-NoProfile', '-Command',
        "Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Where-Object {$_.Status -ne 'Running'} | Start-Service -PassThru | Select-Object -First 1 -ExpandProperty Name"]);
      if (out && out.trim()) { log(`  · Запущена служба ${out.trim()}`); started = true; }
    }
    if (!redis) {
      const out = quiet('powershell', ['-NoProfile', '-Command',
        "Get-Service -Name 'Memurai*','Redis*' -ErrorAction SilentlyContinue | Where-Object {$_.Status -ne 'Running'} | Start-Service -PassThru | Select-Object -First 1 -ExpandProperty Name"]);
      if (out && out.trim()) { log(`  · Запущена служба ${out.trim()}`); started = true; }
    }
  }

  if (started) {
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      pg = await portOpen(PG_PORT);
      redis = await portOpen(6379);
      if (pg && redis) break;
    }
  }

  return { pg, redis, started };
}

function ensureDatabase() {
  if (isWindows || !has('psql')) return;
  const role = quiet('sudo', ['-n', '-u', 'postgres', 'psql', '-tAc', `SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'`]);
  if (role !== null && !String(role).trim()) {
    quiet('sudo', ['-n', '-u', 'postgres', 'psql', '-c', `CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASS}';`]);
    log(`  · Создан пользователь ${PG_USER}`);
  }
  const database = quiet('sudo', ['-n', '-u', 'postgres', 'psql', '-tAc', `SELECT 1 FROM pg_database WHERE datname='${PG_DB}'`]);
  if (database !== null && !String(database).trim()) {
    quiet('sudo', ['-n', '-u', 'postgres', 'psql', '-c', `CREATE DATABASE ${PG_DB} OWNER ${PG_USER};`]);
    log(`  · Создана база ${PG_DB}`);
  }
}

function canConnectPostgres(env) {
  try {
    const probe = path.join(__dirname, 'pg-probe.js');
    const out = execFileSync(process.execPath, [probe], { env, encoding: 'utf8', timeout: 20000, stdio: 'pipe' });
    return String(out).includes('OK');
  } catch (_) {
    return false;
  }
}

function sqliteHasData() {
  const file = path.join(ROOT, 'data.sqlite');
  if (!fs.existsSync(file)) return false;
  try {
    const Database = require('better-sqlite3');
    const db = new Database(file, { readonly: true });
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!table) { db.close(); return false; }
    const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    db.close();
    return count > 0;
  } catch (_) {
    return false;
  }
}

function postgresIsEmpty(env) {
  try {
    const probe = path.join(__dirname, 'pg-probe.js');
    const out = execFileSync(process.execPath, [probe, '--count'], { env, encoding: 'utf8', timeout: 20000, stdio: 'pipe' });
    const match = String(out).match(/USERS=(-?\d+)/);
    return match ? Number(match[1]) === 0 : false;
  } catch (_) {
    return false;
  }
}

async function main() {
  log('');
  log('  Upgrader — запуск');
  log('  ─────────────────────────────────────────');

  const env = { ...process.env };
  env.PGPORT = String(PG_PORT);
  env.PGUSER = PG_USER;
  env.PGPASSWORD = PG_PASS;
  env.PGDATABASE = PG_DB;

  let mode = 'sqlite';

  if (FORCE_SQLITE) {
    log('  · Режим задан вручную: SQLite');
  } else {
    const services = await tryStartServices();

    if (services.pg) {
      ensureDatabase();
      if (canConnectPostgres({ ...env, DB_DRIVER: 'postgres' })) {
        mode = 'postgres';
      } else {
        log('  · PostgreSQL отвечает, но подключиться не удалось — остаюсь на SQLite');
      }
    }

    if (mode === 'postgres' && services.redis) {
      env.REDIS_ENABLED = '1';
    } else {
      env.REDIS_ENABLED = '0';
    }

    if (mode !== 'postgres' && FORCE_PG) {
      log('  · Флаг --pg задан, но PostgreSQL недоступен. Запускаю на SQLite.');
    }
  }

  if (mode === 'postgres') {
    env.DB_DRIVER = 'postgres';

    if (sqliteHasData() && postgresIsEmpty(env)) {
      log('  · В PostgreSQL пусто, а в SQLite есть данные — переношу…');
      try {
        execFileSync(process.execPath, [path.join(__dirname, 'migrate-to-postgres.js')], {
          env, stdio: 'pipe', timeout: 120000
        });
        log('  · Данные перенесены');
      } catch (error) {
        log('  · Перенести не удалось, продолжаю с чистой базой');
      }
    }
  } else {
    env.DB_DRIVER = 'sqlite';
  }

  const baseUrl = setting('BASE_URL');
  const isLocal = !baseUrl || /localhost|127\.0\.0\.1/.test(baseUrl);
  if (isLocal && !NO_DEV && setting('ALLOW_DEV_LOGIN') !== '0') {
    env.ALLOW_DEV_LOGIN = '1';
  }

  const port = Number(setting('PORT') || 3000);
  log('  ─────────────────────────────────────────');
  log(`  База данных: ${mode === 'postgres' ? 'PostgreSQL' : 'SQLite (файл data.sqlite)'}`);
  log(`  Кеш:         ${env.REDIS_ENABLED === '1' ? 'Redis' : 'память процесса'}`);
  log(`  Адрес:       http://localhost:${port}`);
  if (env.ALLOW_DEV_LOGIN === '1') {
    log(`  Вход без Steam: http://localhost:${port}/auth/dev`);
    if (!setting('ADMIN_STEAMIDS')) {
      log('  Подсказка: чтобы тестовый игрок стал админом, в .env укажите');
      log('             ADMIN_STEAMIDS=76561190000000001');
    }
  }
  log('  ─────────────────────────────────────────');
  log('');

  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], { env, stdio: 'inherit' });
  child.on('exit', code => process.exit(code == null ? 0 : code));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { try { child.kill(signal); } catch (_) {} });
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
