'use strict';

const crypto = require('crypto');

const WEEKLY_UNLOCK_CENTS = 49900;
const WEEKLY_MAX_PRICE_CENTS = 150000;
const WEEKLY_POOL_SIZE = 4;
const WEEKLY_PICK_COUNT = 2;
const WEEKLY_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const TIERS = [
  { max: 20000,    weight: 75 },
  { max: 50000,    weight: 18 },
  { max: 100000,   weight: 5 },
  { max: 150000,   weight: 2 }
];

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      total_deposit_cents INTEGER NOT NULL DEFAULT 0,
      current_pool_json TEXT NOT NULL DEFAULT '[]',
      pool_expires_at INTEGER NOT NULL DEFAULT 0,
      claimed_catalog_ids TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deposit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'payment',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposit_records(user_id, id DESC);
  `);
}

function weightedRandomPick(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let point = (crypto.randomInt(0, 1000000) + Math.random()) / 1000000 * total;
  for (const e of entries) {
    point -= e.weight;
    if (point < 0) return e.item;
  }
  return entries[entries.length - 1].item;
}

function rollWeeklyPool(catalog) {
  const pool = [];
  for (let i = 0; i < WEEKLY_POOL_SIZE; i++) {
    const tier = weightedRandomPick(TIERS.map(t => ({ item: t, weight: t.weight })));
    const idx = TIERS.indexOf(tier);
    const min = idx === 0 ? 500 : TIERS[idx - 1].max + 1;
    const candidates = catalog.filter(c =>
      c.priceCents >= min &&
      c.priceCents <= tier.max &&
      c.priceCents <= WEEKLY_MAX_PRICE_CENTS
    );
    if (candidates.length === 0) {
      const fallback = catalog.filter(c => c.priceCents > 0 && c.priceCents <= WEEKLY_MAX_PRICE_CENTS);
      pool.push(fallback[crypto.randomInt(0, fallback.length)]);
    } else {
      pool.push(candidates[crypto.randomInt(0, candidates.length)]);
    }
  }
  return pool.map(c => ({ catalogId: c.catalogId, name: c.name, icon: c.icon, priceCents: c.priceCents, rarity: c.rarity, rarityColor: c.rarityColor, rarityRank: c.rarityRank, weapon: c.weapon, skin: c.skin, wear: c.wear }));
}

function getUserPack(db, userId, catalog) {
  let row = db.prepare('SELECT * FROM weekly_packs WHERE user_id = ?').get(userId);
  const now = Date.now();
  if (!row) {
    const depositRow = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS total FROM deposit_records WHERE user_id = ?').get(userId);
    const totalDeposit = Number(depositRow && depositRow.total || 0);
    const unlocked = totalDeposit >= WEEKLY_UNLOCK_CENTS;
    const pool = unlocked ? rollWeeklyPool(catalog) : [];
    const expires = unlocked ? now + WEEKLY_DURATION_MS : 0;
    const info = db.prepare(`
      INSERT INTO weekly_packs(user_id,total_deposit_cents,current_pool_json,pool_expires_at,claimed_catalog_ids,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?)
    `).run(userId, totalDeposit, JSON.stringify(pool), expires, '[]', now, now);
    row = db.prepare('SELECT * FROM weekly_packs WHERE id = ?').get(info.lastInsertRowid);
  }
  let pool = [];
  try { pool = JSON.parse(row.current_pool_json || '[]'); } catch (e) { pool = []; }
  let claimed = [];
  try { claimed = JSON.parse(row.claimed_catalog_ids || '[]'); } catch (e) { claimed = []; }
  const totalDeposit = Number(row.total_deposit_cents || 0);
  let unlocked = totalDeposit >= WEEKLY_UNLOCK_CENTS;
  let expired = unlocked && row.pool_expires_at && now > Number(row.pool_expires_at);
  if (unlocked && (!pool.length || expired)) {
    pool = rollWeeklyPool(catalog);
    claimed = [];
    const expires = now + WEEKLY_DURATION_MS;
    db.prepare('UPDATE weekly_packs SET current_pool_json = ?, pool_expires_at = ?, claimed_catalog_ids = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(pool), expires, '[]', now, row.id);
    row = db.prepare('SELECT * FROM weekly_packs WHERE id = ?').get(row.id);
  }
  return {
    unlocked,
    totalDepositCents: totalDeposit,
    requiredCents: WEEKLY_UNLOCK_CENTS,
    expiresAt: unlocked ? Number(row.pool_expires_at) : null,
    pool,
    claimed,
    canClaim: unlocked && claimed.length < WEEKLY_PICK_COUNT,
    picksRemaining: unlocked ? Math.max(0, WEEKLY_PICK_COUNT - claimed.length) : 0
  };
}

function registerDeposit(db, userId, amountCents, source) {
  if (amountCents <= 0) return;
  const now = Date.now();
  db.prepare('INSERT INTO deposit_records(user_id,amount_cents,source,created_at) VALUES(?,?,?,?)')
    .run(userId, amountCents, source || 'payment', now);
  const total = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS t FROM deposit_records WHERE user_id = ?').get(userId).t;
  const existing = db.prepare('SELECT id FROM weekly_packs WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE weekly_packs SET total_deposit_cents = ?, updated_at = ? WHERE user_id = ?').run(Number(total || 0), now, userId);
  }
}

module.exports = function registerWeeklyRoutes(ctx) {
  const { app, db, cache, CATALOG, addLiveDrop, currentUser, withSteamIcon, insertInventoryItem, recordTransaction } = ctx;
  ensureSchema(db);

  app.get('/api/weekly', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь' });
    const pack = getUserPack(db, account.id, CATALOG);
    res.json({
      unlocked: pack.unlocked,
      totalDepositCents: pack.totalDepositCents,
      requiredCents: pack.requiredCents,
      expiresAt: pack.expiresAt,
      pool: pack.pool.map(p => {
        const withIcon = withSteamIcon(p);
        return { ...p, icon: (withIcon && withIcon.icon) || p.icon, claimed: pack.claimed.indexOf(p.catalogId) !== -1 };
      }),
      claimed: pack.claimed,
      picksRemaining: pack.picksRemaining,
      picksTotal: WEEKLY_PICK_COUNT,
      maxPriceCents: WEEKLY_MAX_PRICE_CENTS
    });
  });

  app.post('/api/weekly/claim/:catalogId', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь' });
    const catalogId = String(req.params.catalogId || '');
    const pack = getUserPack(db, account.id, CATALOG);
    if (!pack.unlocked) return res.status(403).json({ error: 'Набор ещё не разблокирован' });
    if (!pack.picksRemaining) return res.status(400).json({ error: 'Вы уже забрали все доступные скины' });
    const item = pack.pool.filter(p => p.catalogId === catalogId)[0];
    if (!item) return res.status(404).json({ error: 'Скин не найден в наборе' });
    if (pack.claimed.indexOf(catalogId) !== -1) return res.status(400).json({ error: 'Этот скин уже забран' });
    const claimed = pack.claimed.concat([catalogId]);
    const now = Date.now();
    const invId = insertInventoryItem(account.id, item, 'weekly', now);
    db.prepare('UPDATE weekly_packs SET claimed_catalog_ids = ?, updated_at = ? WHERE user_id = ?')
      .run(JSON.stringify(claimed), now, account.id);
    const balance = db.prepare('SELECT balance_cents AS b FROM users WHERE id = ?').get(account.id).b;
    const drop = addLiveDrop(account.id, account.name, item, 'reward', now);
    res.json({ ok: true, item: Object.assign({}, withSteamIcon(item), { assetid: String(invId) }), balanceCents: balance, drop: drop, claimed: claimed, picksRemaining: Math.max(0, WEEKLY_PICK_COUNT - claimed.length) });
  });

  app.post('/api/inventory/sell-all', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь' });
    const now = Date.now();
    try {
      const result = db.transaction(() => {
        const items = db.prepare("SELECT id, price_cents, item_name FROM site_inventory WHERE user_id = ? AND status = 'active'").all(account.id);
        if (!items.length) throw new Error('Инвентарь пуст');
        let total = 0;
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          db.prepare("UPDATE site_inventory SET status = 'sold', updated_at = ? WHERE id = ?").run(now, it.id);
          db.prepare('INSERT INTO inventory_sales(user_id,inventory_item_id,amount_cents,created_at) VALUES(?,?,?,?)').run(account.id, it.id, it.price_cents, now);
          total += Number(it.price_cents || 0);
        }
        db.prepare('UPDATE users SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?').run(total, now, account.id);
        const balance = db.prepare('SELECT balance_cents AS b FROM users WHERE id = ?').get(account.id).b;
        db.prepare("INSERT INTO transactions(user_id,kind,amount_cents,balance_after,note,created_at) VALUES(?,?,?,?,?,?)")
          .run(account.id, 'sell_all', total, balance, 'Продано предметов: ' + items.length, now);
        return { count: items.length, totalCents: total, balanceCents: balance };
      })();
      res.json({ ok: true, count: result.count, totalCents: result.totalCents, balanceCents: result.balanceCents });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/payment/simulate', (req, res) => {
    const account = currentUser(req);
    if (!account) return res.status(401).json({ error: 'Сначала авторизуйтесь' });
    const amount = Math.round(Number(req.body && req.body.amountCents || 0));
    if (!Number.isSafeInteger(amount) || amount < 5000) return res.status(400).json({ error: 'Минимальная сумма 50 ₽' });
    const now = Date.now();
    const next = Number(account.balance_cents) + amount;
    db.prepare('UPDATE users SET balance_cents = ?, updated_at = ? WHERE id = ?').run(next, now, account.id);
    registerDeposit(db, account.id, amount, 'payment');
    recordTransaction(account.id, 'deposit', amount, next, 'Пополнение баланса', now);
    res.json({ ok: true, amountCents: amount, balanceCents: next });
  });

  return { registerDeposit: registerDeposit, WEEKLY_PICK_COUNT: WEEKLY_PICK_COUNT, WEEKLY_MAX_PRICE_CENTS: WEEKLY_MAX_PRICE_CENTS, WEEKLY_UNLOCK_CENTS: WEEKLY_UNLOCK_CENTS };
};
