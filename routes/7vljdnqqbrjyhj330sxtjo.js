'use strict';

const crypto = require('crypto');

const UNLOCK_CENTS = 49900;
const MAX_PRICE_CENTS = 150000;
const POOL_SIZE = 4;
const PICK_COUNT = 2;
const DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const TIERS = [
  { max: 5000, weight: 60 },
  { max: 20000, weight: 24 },
  { max: 50000, weight: 10 },
  { max: 100000, weight: 4 },
  { max: 150000, weight: 2 }
];

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cx_weekly(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      total_dep INTEGER NOT NULL DEFAULT 0,
      pool TEXT NOT NULL DEFAULT '[]',
      expires INTEGER NOT NULL DEFAULT 0,
      claimed TEXT NOT NULL DEFAULT '[]',
      version INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL,
      updated INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cx_deposits(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cents INTEGER NOT NULL,
      src TEXT NOT NULL DEFAULT 'pay',
      provider_ref TEXT,
      created INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cx_dep_uid ON cx_deposits(user_id,id DESC);
  `);
  const tableColumns = table => db.driver === 'postgres'
    ? db.prepare(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema='public' AND table_name=?`).all(table).map(row => row.name)
    : db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
  if (!tableColumns('cx_weekly').includes('version')) db.exec('ALTER TABLE cx_weekly ADD COLUMN version INTEGER NOT NULL DEFAULT 0');
  if (!tableColumns('cx_deposits').includes('provider_ref')) db.exec('ALTER TABLE cx_deposits ADD COLUMN provider_ref TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS cx_dep_provider_ref ON cx_deposits(provider_ref)');
}

function weightedTier() {
  const total = TIERS.reduce((sum, item) => sum + item.weight, 0);
  let point = crypto.randomInt(0, total * 1000) / 1000;
  for (const tier of TIERS) {
    point -= tier.weight;
    if (point < 0) return tier;
  }
  return TIERS[TIERS.length - 1];
}

function createPool(catalog) {
  const eligible = catalog.filter(item => item && Number(item.priceCents) > 0 && Number(item.priceCents) <= MAX_PRICE_CENTS);
  if (!eligible.length) return [];
  const selected = [];
  const used = new Set();
  for (let index = 0; index < POOL_SIZE; index += 1) {
    const tier = weightedTier();
    const tierIndex = TIERS.indexOf(tier);
    const minimum = tierIndex === 0 ? 100 : TIERS[tierIndex - 1].max + 1;
    let candidates = eligible.filter(item => Number(item.priceCents) >= minimum && Number(item.priceCents) <= tier.max && !used.has(item.catalogId));
    if (!candidates.length) candidates = eligible.filter(item => !used.has(item.catalogId));
    if (!candidates.length) break;
    const item = candidates[crypto.randomInt(0, candidates.length)];
    used.add(item.catalogId);
    selected.push({
      catalogId: item.catalogId,
      name: item.name,
      icon: item.icon,
      priceCents: item.priceCents,
      rarity: item.rarity,
      rarityColor: item.rarityColor,
      rarityRank: item.rarityRank,
      weapon: item.weapon,
      skin: item.skin,
      wear: item.wear || ''
    });
  }
  return selected;
}

function parseList(value) {
  try {
    const result = JSON.parse(value || '[]');
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

function lockPack(db, userId) {
  const sql = db.driver === 'postgres'
    ? 'SELECT * FROM cx_weekly WHERE user_id=? FOR UPDATE'
    : 'SELECT * FROM cx_weekly WHERE user_id=?';
  return db.prepare(sql).get(userId);
}

function getPack(db, userId, catalog) {
  const now = Date.now();
  let row = lockPack(db, userId);
  if (!row) {
    const total = Number(db.prepare('SELECT COALESCE(SUM(cents),0) AS total FROM cx_deposits WHERE user_id=?').get(userId)?.total || 0);
    const unlocked = total >= UNLOCK_CENTS;
    const pool = unlocked ? createPool(catalog) : [];
    db.prepare(`INSERT INTO cx_weekly(user_id,total_dep,pool,expires,claimed,version,created,updated)
      VALUES(?,?,?,?,'[]',0,?,?) ON CONFLICT(user_id) DO NOTHING`)
      .run(userId, total, JSON.stringify(pool), unlocked ? now + DURATION_MS : 0, now, now);
    row = lockPack(db, userId);
  }
  let pool = parseList(row.pool);
  let claimed = parseList(row.claimed);
  const total = Number(row.total_dep || 0);
  const unlocked = total >= UNLOCK_CENTS;
  if (unlocked && (!pool.length || now > Number(row.expires || 0))) {
    pool = createPool(catalog);
    claimed = [];
    db.prepare("UPDATE cx_weekly SET pool=?,expires=?,claimed='[]',version=version+1,updated=? WHERE user_id=?")
      .run(JSON.stringify(pool), now + DURATION_MS, now, userId);
    row = lockPack(db, userId);
  }
  return {
    unlocked,
    total,
    expires: unlocked ? Number(row.expires || 0) : null,
    pool,
    claimed,
    left: unlocked ? Math.max(0, PICK_COUNT - claimed.length) : 0,
    version: Number(row.version || 0)
  };
}

function registerDeposit(db, userId, cents, source, providerRef) {
  if (!Number.isSafeInteger(cents) || cents <= 0) return;
  const now = Date.now();
  db.prepare('INSERT INTO cx_deposits(user_id,cents,src,provider_ref,created) VALUES(?,?,?,?,?)')
    .run(userId, cents, source || 'pay', providerRef || null, now);
  const total = Number(db.prepare('SELECT COALESCE(SUM(cents),0) AS total FROM cx_deposits WHERE user_id=?').get(userId)?.total || 0);
  db.prepare('UPDATE cx_weekly SET total_dep=?,version=version+1,updated=? WHERE user_id=?').run(total, now, userId);
}

module.exports = function registerRoutes(ctx) {
  const { app, db, CATALOG, currentUser, withSteamIcon, insertInventoryItem, addLiveDrop, recordTransaction, operations, ApiError, sendApiError, sendOperationResult, queue, paymentsMode } = ctx;
  ensureSchema(db);

  app.get('/api/cx-weekly', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Требуется авторизация', code: 'AUTH_REQUIRED' });
    const pack = db.transaction(() => getPack(db, account.id, CATALOG))();
    res.json({
      unlocked: pack.unlocked,
      total: pack.total,
      thresh: UNLOCK_CENTS,
      expires: pack.expires,
      pool: pack.pool.map(item => ({ ...withSteamIcon(item), claimed: pack.claimed.includes(item.catalogId) })),
      claimed: pack.claimed,
      left: pack.left,
      pickN: PICK_COUNT
    });
  });

  app.post('/api/cx-weekly/claim/:cid', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Требуется авторизация', code: 'AUTH_REQUIRED' });
    const catalogId = String(req.params.cid || '');
    let dropToPublish = null;
    try {
      const result = operations.run(req, account.id, 'weekly_claim', ({ now }) => {
        const pack = getPack(db, account.id, CATALOG);
        if (!pack.unlocked) throw new ApiError(403, 'WEEKLY_LOCKED', 'Еженедельный набор ещё не разблокирован');
        if (!pack.left) throw new ApiError(409, 'WEEKLY_LIMIT_REACHED', 'Все доступные награды уже получены');
        const stored = pack.pool.find(item => item.catalogId === catalogId);
        if (!stored) throw new ApiError(404, 'WEEKLY_ITEM_NOT_FOUND', 'Предмет не найден в наборе');
        if (pack.claimed.includes(catalogId)) throw new ApiError(409, 'WEEKLY_ITEM_CLAIMED', 'Этот предмет уже получен');
        const current = CATALOG.find(item => item.catalogId === catalogId);
        if (!current) throw new ApiError(422, 'CATALOG_ITEM_UNAVAILABLE', 'Предмет больше не доступен в каталоге');
        const claimed = [...pack.claimed, catalogId];
        const updated = db.prepare('UPDATE cx_weekly SET claimed=?,version=version+1,updated=? WHERE user_id=? AND version=?')
          .run(JSON.stringify(claimed), now, account.id, pack.version);
        if (!updated.changes) throw new ApiError(409, 'WEEKLY_STATE_CHANGED', 'Набор изменился в другой вкладке');
        const item = { ...current, priceCents: Number(stored.priceCents || current.priceCents) };
        const inventoryId = insertInventoryItem(account.id, item, 'weekly', now);
        const fresh = db.prepare('SELECT name,balance_cents FROM users WHERE id=?').get(account.id);
        dropToPublish = addLiveDrop(account.id, fresh.name, item, 'reward', now);
        return {
          ok: true,
          item: { ...withSteamIcon(item), assetid: String(inventoryId) },
          balanceCents: fresh.balance_cents,
          claimed,
          left: Math.max(0, PICK_COUNT - claimed.length)
        };
      }, { cooldown: 300 });
      if (!result.replayed && dropToPublish) queue.publish('drop.broadcast', dropToPublish);
      sendOperationResult(res, result);
    } catch (error) {
      sendApiError(res, error, 'Не удалось получить награду');
    }
  });

  app.post('/api/cx-deposit', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Требуется авторизация', code: 'AUTH_REQUIRED' });
    if (paymentsMode !== 'simulation') return res.status(503).json({ error: 'Платёжный провайдер не настроен', code: 'PAYMENTS_UNAVAILABLE' });
    const amount = Math.round(Number(req.body?.amountCents || 0));
    if (!Number.isSafeInteger(amount) || amount < 5000 || amount > 10_000_000) {
      return res.status(422).json({ error: 'Сумма пополнения вне допустимого диапазона', code: 'PAYMENT_AMOUNT_INVALID' });
    }
    try {
      const result = operations.run(req, account.id, 'payment_simulation', ({ requestId, now }) => {
        const credited = db.prepare('UPDATE users SET balance_cents=balance_cents+?,updated_at=? WHERE id=?').run(amount, now, account.id);
        if (!credited.changes) throw new ApiError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
        registerDeposit(db, account.id, amount, 'simulation', requestId);
        const balance = db.prepare('SELECT balance_cents FROM users WHERE id=?').get(account.id).balance_cents;
        recordTransaction(account.id, 'deposit', amount, balance, `simulation:${requestId}`, now);
        return { ok: true, amountCents: amount, balanceCents: balance, simulated: true };
      }, { cooldown: 1000 });
      sendOperationResult(res, result);
    } catch (error) {
      sendApiError(res, error, 'Не удалось обработать платёж');
    }
  });

  return { registerDeposit };
};
