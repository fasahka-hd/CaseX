'use strict';

const { execFileSync, execSync } = require('child_process');
const net = require('net');

const action = process.argv[2] || 'up';
const isWindows = process.platform === 'win32';

function has(command) {
  try {
    execSync(isWindows ? `where ${command}` : `command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

function portOpen(port, host = '127.0.0.1', timeout = 900) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;
    const finish = value => {
      if (done) return;
      done = true;
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

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    return null;
  }
}

function dockerCompose(args) {
  if (!has('docker')) return false;
  try {
    execFileSync('docker', ['compose', ...args], { stdio: 'inherit', cwd: `${__dirname}/../deploy` });
    return true;
  } catch (_) {
    return false;
  }
}

async function statusReport() {
  const pg = await portOpen(Number(process.env.PGPORT || 5432));
  const redis = await portOpen(6379);
  console.log('');
  console.log(`  PostgreSQL (5432): ${pg ? 'работает' : 'не отвечает'}`);
  console.log(`  Redis (6379):      ${redis ? 'работает' : 'не отвечает'}`);
  console.log('');
  if (pg && redis) {
    console.log('  Всё готово. Запуск приложения:  npm run start:pg');
  } else {
    console.log('  Полный стек не поднят, но приложение работает и без него:  npm start');
    console.log('  (SQLite + кеш в памяти, вся функциональность доступна)');
  }
  console.log('');
}

async function up() {
  console.log('Запуск инфраструктуры (PostgreSQL + Redis)...\n');

  const pgUp = await portOpen(Number(process.env.PGPORT || 5432));
  const redisUp = await portOpen(6379);

  if (pgUp && redisUp) {
    console.log('  Сервисы уже запущены.');
    return statusReport();
  }

  if (has('docker')) {
    console.log('  Найден Docker — поднимаю контейнеры postgres и redis...');
    if (dockerCompose(['up', '-d', 'postgres', 'redis'])) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      return statusReport();
    }
    console.log('  Docker есть, но запустить не удалось (не запущен Docker Desktop?).');
  }

  if (isWindows) {
    console.log('  Docker не найден или не запущен.');
    console.log('');
    console.log('  Варианты для Windows:');
    console.log('   1. Установить Docker Desktop и повторить  npm run infra:up');
    console.log('   2. Установить PostgreSQL и Redis нативно:');
    console.log('        winget install PostgreSQL.PostgreSQL.17');
    console.log('        winget install Memurai.MemuraiDeveloper     (Redis для Windows)');
    console.log('   3. Ничего не ставить и работать на SQLite:  npm start');
    return statusReport();
  }

  if (has('pg_ctlcluster')) {
    console.log('  Запускаю системный PostgreSQL...');
    run('sudo', ['pg_ctlcluster', '17', 'main', 'start']);
  }
  if (has('redis-server') && !redisUp) {
    console.log('  Запускаю Redis...');
    run('sudo', ['redis-server', '/etc/redis/redis.conf', '--daemonize', 'yes']);
  }

  if (has('psql')) {
    const user = process.env.PGUSER || 'upgrader';
    const pass = process.env.PGPASSWORD || 'upgrader_dev_pass';
    const database = process.env.PGDATABASE || 'upgrader';
    const exists = run('sudo', ['-u', 'postgres', 'psql', '-tAc', `SELECT 1 FROM pg_roles WHERE rolname='${user}'`]);
    if (!exists || !exists.trim()) {
      run('sudo', ['-u', 'postgres', 'psql', '-c', `CREATE USER ${user} WITH PASSWORD '${pass}';`]);
    }
    const dbExists = run('sudo', ['-u', 'postgres', 'psql', '-tAc', `SELECT 1 FROM pg_database WHERE datname='${database}'`]);
    if (!dbExists || !dbExists.trim()) {
      run('sudo', ['-u', 'postgres', 'psql', '-c', `CREATE DATABASE ${database} OWNER ${user};`]);
    }
    console.log(`  База ${database} готова.`);
  }

  await statusReport();
}

async function down() {
  console.log('Остановка инфраструктуры...\n');

  if (has('docker')) {
    if (dockerCompose(['stop', 'postgres', 'redis'])) {
      console.log('  Контейнеры остановлены.');
      return;
    }
  }

  if (isWindows) {
    console.log('  Нативные службы Windows останавливаются через "Службы" или:');
    console.log('    net stop postgresql-x64-17');
    return;
  }

  if (has('redis-cli')) run('redis-cli', ['shutdown', 'nosave']);
  if (has('pg_ctlcluster')) run('sudo', ['pg_ctlcluster', '17', 'main', 'stop']);
  console.log('  Готово.');
}

async function main() {
  if (action === 'down') return down();
  if (action === 'status') return statusReport();
  return up();
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
