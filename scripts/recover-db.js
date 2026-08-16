'use strict';
const fs = require('fs');
const path = require('path');
const file = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
const shm = file + '-shm';
const wal = file + '-wal';

console.log('Проверяю', file);

function tryDelete(p) {
  try { if (fs.existsSync(p)) { fs.unlinkSync(p); console.log('Удалил', path.basename(p)); } } catch (e) { console.warn('Не смог удалить', p, e.message); }
}

if (!fs.existsSync(file)) {
  console.log('Файла нет, будет создана новая база при старте');
  process.exit(0);
}

try {
  const Database = require('better-sqlite3');
  const db = new Database(file, { readonly: true });
  db.prepare('PRAGMA integrity_check').get();
  console.log('База целая, integrity_check ok');
  db.close();
  console.log('Попробуй удалить shm/wal и запустить снова');
  tryDelete(shm);
  tryDelete(wal);
} catch (e) {
  console.error('База повреждена:', e.message);
  console.log('Пробую удалить WAL/SHM...');
  tryDelete(shm);
  tryDelete(wal);
  try {
    const Database = require('better-sqlite3');
    const db = new Database(file, { readonly: true });
    db.prepare('PRAGMA integrity_check').get();
    console.log('После удаления WAL база целая');
    db.close();
    process.exit(0);
  } catch (e2) {
    console.error('Все еще битая:', e2.message);
    console.log('Делаю бекап и создам новую базу...');
    const backup = file + `.corrupt.${Date.now()}.bak`;
    try {
      fs.renameSync(file, backup);
      console.log(`Переименовал битую базу в ${path.basename(backup)}`);
      console.log('При следующем npm start создастся новая пустая база. Старые пользователи/инвентарь потеряются, но можно попробовать восстановить из бекапа через .dump');
      console.log(`Если хочешь попытаться восстановить данные: sqlite3 ${path.basename(backup)} ".recover" | sqlite3 ${path.basename(file)}`);
    } catch (err) {
      console.error('Не смог переименовать:', err.message);
      console.log('Удали файл вручную:', file);
    }
  }
}
