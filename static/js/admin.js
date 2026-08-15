(function () {
  'use strict';

  const root = document.getElementById('admin-root');
  const toastRoot = document.getElementById('admin-toast');

  const state = {
    tab: 'dashboard',
    role: 'user',
    me: null,
    summary: null,
    users: [],
    userQuery: '',
    userDetail: null,
    transactions: [],
    txSummary: [],
    txKind: '',
    cases: [],
    drops: [],
    bots: [],
    promos: [],
    threads: [],
    thread: null,
    logs: [],
    system: null,
    infra: null,
    catalog: []
  };

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 20"/>',
    transactions: '<path d="M3 7h13l-3-3"/><path d="M21 17H8l3 3"/><path d="M3 7v0"/>',
    cases: '<path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/>',
    coefficients: '<path d="M12 4v16"/><path d="M5 8h14"/><path d="M5 8 2.5 14h5L5 8Z"/><path d="M19 8l-2.5 6h5L19 8Z"/>',
    bots: '<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M12 8V4.5"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/>',
    promos: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18"/><path d="M12 9v11"/><path d="M8.5 9a2.5 2.5 0 1 1 3.5-2.3"/><path d="M15.5 9a2.5 2.5 0 1 0-3.5-2.3"/>',
    support: '<path d="M20 15.5A2.5 2.5 0 0 1 17.5 18H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5Z"/>',
    logs: '<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5"/><path d="M9 12h7"/><path d="M9 16h7"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key] || ''}</svg>`;

  const TABS = [
    { key: 'dashboard', label: 'Обзор' },
    { key: 'users', label: 'Пользователи' },
    { key: 'transactions', label: 'Транзакции' },
    { key: 'cases', label: 'Кейсы и дропы' },
    { key: 'coefficients', label: 'Коэффициенты', adminOnly: true },
    { key: 'bots', label: 'Боты' },
    { key: 'promos', label: 'Промокоды' },
    { key: 'support', label: 'Поддержка' },
    { key: 'logs', label: 'Логи и система' }
  ];

  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const money = cents => (Number(cents || 0) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = value => Number(value || 0).toLocaleString('ru-RU');
  const when = ts => ts ? new Date(Number(ts)).toLocaleString('ru-RU') : '—';
  const shortTime = ts => ts ? new Date(Number(ts)).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

  function toast(message, kind) {
    const el = document.createElement('div');
    if (kind) el.className = kind;
    el.textContent = message;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  async function api(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options));
    let data = null;
    try { data = await response.json(); } catch (_) { data = null; }
    if (!response.ok) throw new Error((data && data.error) || `Ошибка ${response.status}`);
    return data;
  }

  const isAdmin = () => state.role === 'admin';

  function guardAdmin() {
    if (isAdmin()) return true;
    toast('Действие доступно только администратору', 'err');
    return false;
  }

  const TX_LABELS = {
    case_open: 'Открытие кейса',
    upgrade_stake: 'Ставка апгрейда',
    item_sale: 'Продажа предмета',
    admin_credit: 'Начисление',
    admin_debit: 'Списание',
    promo: 'Промокод'
  };

  const ROLE_LABELS = { admin: 'Администратор', support: 'Поддержка', user: 'Игрок' };

  function userCell(user) {
    const avatar = user.avatar
      ? `<img src="${esc(user.avatar)}" alt="" referrerpolicy="no-referrer">`
      : '<img src="/chunks/logo.svg" alt="">';
    return `<div class="user-line">${avatar}<div class="nm">${esc(user.name || user.userName || '—')}<small>${esc(user.steamid || ('ID ' + (user.id || user.userId || '')))}</small></div></div>`;
  }

  function render() {
    const tabs = TABS
      .filter(tab => !tab.adminOnly || isAdmin())
      .map(tab => `<button class="${state.tab === tab.key ? 'active' : ''}" data-tab="${tab.key}">${icon(tab.key)}${tab.label}</button>`)
      .join('');

    root.className = '';
    root.innerHTML = `
      <div class="admin-shell">
        <aside class="admin-side">
          <div class="admin-brand"><img src="/chunks/logo.svg" alt="">АДМИН-ПАНЕЛЬ</div>
          ${tabs}
          <div class="side-foot"><a href="/">← Вернуться на сайт</a></div>
        </aside>
        <main class="admin-main">
          <div class="admin-head">
            <h1>${esc((TABS.find(tab => tab.key === state.tab) || {}).label || '')}</h1>
            <div class="who">${esc(state.me ? state.me.name : '')} · <b>${esc(ROLE_LABELS[state.role] || state.role)}</b></div>
          </div>
          <div id="admin-view">${viewFor(state.tab)}</div>
        </main>
      </div>`;

    root.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', () => selectTab(button.dataset.tab));
    });
    bindView();
  }

  function viewFor(tab) {
    if (tab === 'dashboard') return dashboardView();
    if (tab === 'users') return usersView();
    if (tab === 'transactions') return transactionsView();
    if (tab === 'cases') return casesView();
    if (tab === 'coefficients') return coefficientsView();
    if (tab === 'bots') return botsView();
    if (tab === 'promos') return promosView();
    if (tab === 'support') return supportView();
    if (tab === 'logs') return logsView();
    return '';
  }

  function dashboardView() {
    const totals = (state.summary && state.summary.totals) || {};
    const profit = Number(totals.caseRevenue || 0) - Number(totals.payouts || 0);
    return `
      <div class="cards">
        <div class="card"><span>Игроков</span><b>${num(totals.users)}</b></div>
        <div class="card"><span>Онлайн</span><b>${num(totals.online)}</b></div>
        <div class="card bad"><span>Заблокировано</span><b>${num(totals.banned)}</b></div>
        <div class="card"><span>Ботов</span><b>${num(totals.bots)}</b></div>
        <div class="card"><span>Баланс игроков</span><b>${money(totals.balanceCents)}</b></div>
        <div class="card"><span>Открыто кейсов</span><b>${num(totals.casesOpened)}</b></div>
        <div class="card"><span>Кейсов за сутки</span><b>${num(totals.casesDay)}</b></div>
        <div class="card"><span>Апгрейдов</span><b>${num(totals.upgrades)} <small class="muted">/ ${num(totals.upgradesWon)} усп.</small></b></div>
        <div class="card"><span>Сборы с кейсов</span><b>${money(totals.caseRevenue)}</b></div>
        <div class="card"><span>Выплачено за продажи</span><b>${money(totals.payouts)}</b></div>
        <div class="card ${profit >= 0 ? 'good' : 'bad'}"><span>Разница</span><b>${money(profit)}</b></div>
        <div class="card warn"><span>Открытых обращений</span><b>${num(totals.openTickets)}</b></div>
      </div>
      <div class="block">
        <h2>Быстрые действия</h2>
        <div class="block-body row">
          <button class="act" data-go="users">Пользователи</button>
          <button class="act" data-go="transactions">Транзакции</button>
          <button class="act" data-go="support">Поддержка (${num(totals.openTickets)})</button>
          <button class="act" data-go="logs">Логи</button>
        </div>
      </div>`;
  }

  function usersView() {
    const rows = state.users.length ? state.users.map(user => `
      <tr>
        <td>${userCell(user)}</td>
        <td><span class="tag ${esc(user.role)}">${esc(ROLE_LABELS[user.role] || user.role)}</span>${user.isBot ? ' <span class="tag bot">бот</span>' : ''}${user.banned ? ' <span class="tag banned">бан</span>' : ''}</td>
        <td class="num mono">${money(user.balanceCents)}</td>
        <td class="num mono">${Number(user.luckModifier || 0)}%</td>
        <td class="num"><button class="act small" data-user="${user.id}">Открыть</button></td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty-row">Ничего не найдено</td></tr>';

    return `
      <div class="block">
        <h2>Поиск</h2>
        <div class="block-body row">
          <input class="grow" id="user-q" placeholder="Имя или SteamID" value="${esc(state.userQuery)}">
          <button class="act primary" id="user-search">Найти</button>
        </div>
      </div>
      <div class="block">
        <h2>Пользователи</h2>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Игрок</th><th>Статус</th><th class="num">Баланс</th><th class="num">Удача</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      ${state.userDetail ? userModal() : ''}`;
  }

  function userModal() {
    const detail = state.userDetail;
    const user = detail.user;
    const inventory = detail.inventory.length ? detail.inventory.slice(0, 12).map(item => `
      <tr><td>${esc(item.name)}</td><td class="num mono">${money(item.priceCents)}</td><td>${esc(item.status)}</td><td class="muted">${when(item.createdAt)}</td></tr>
    `).join('') : '<tr><td colspan="4" class="empty-row">Инвентарь пуст</td></tr>';
    const transactions = detail.transactions.length ? detail.transactions.slice(0, 12).map(row => `
      <tr>
        <td>${esc(TX_LABELS[row.kind] || row.kind)}</td>
        <td class="num mono ${row.amountCents >= 0 ? 'pos' : 'neg'}">${row.amountCents >= 0 ? '+' : ''}${money(row.amountCents)}</td>
        <td class="num mono">${money(row.balanceAfter)}</td>
        <td class="muted">${when(row.createdAt)}</td>
      </tr>`).join('') : '<tr><td colspan="4" class="empty-row">Операций нет</td></tr>';

    const controls = isAdmin() ? `
      <div class="field">
        <label>Изменить баланс (в рублях, минус — списание)</label>
        <div class="row">
          <input class="grow" id="bal-amount" type="number" step="0.01" placeholder="например 500 или -250">
          <input class="grow" id="bal-note" placeholder="Комментарий">
          <button class="act ok" id="bal-apply">Применить</button>
        </div>
      </div>
      <div class="field">
        <label>Роль</label>
        <div class="row">
          <select id="role-select">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Игрок</option>
            <option value="support" ${user.role === 'support' ? 'selected' : ''}>Поддержка</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
          </select>
          <button class="act" id="role-apply">Сохранить роль</button>
        </div>
      </div>
      <div class="field">
        <label>Модификатор удачи: ${Number(user.luckModifier || 0)}% (влияет на кейсы и апгрейды)</label>
        <div class="row">
          <input class="grow" id="luck-value" type="number" step="1" min="-90" max="300" value="${Number(user.luckModifier || 0)}">
          <button class="act" id="luck-apply">Сохранить</button>
        </div>
      </div>
      <div class="field">
        <label>Выдать предмет по catalogId</label>
        <div class="row">
          <input class="grow" id="give-id" placeholder="например ak47-elite-build" list="catalog-list">
          <button class="act" id="give-apply">Выдать</button>
        </div>
        <datalist id="catalog-list">${state.catalog.slice(0, 300).map(item => `<option value="${esc(item.catalogId)}">${esc(item.name)}</option>`).join('')}</datalist>
      </div>
      <div class="field">
        <label>Блокировка</label>
        <div class="row">
          <input class="grow" id="ban-reason" placeholder="Причина" value="${esc(user.banReason || '')}">
          <button class="act ${user.banned ? 'ok' : 'danger'}" id="ban-toggle">${user.banned ? 'Разблокировать' : 'Заблокировать'}</button>
        </div>
      </div>` : '<p class="muted">Режим поддержки: изменения доступны только администратору.</p>';

    return `
      <div class="modal-back" data-close-modal>
        <div class="modal">
          <header>
            <h3>${esc(user.name)} <span class="tag ${esc(user.role)}">${esc(ROLE_LABELS[user.role] || user.role)}</span>${user.banned ? ' <span class="tag banned">заблокирован</span>' : ''}</h3>
            <button data-close-modal>×</button>
          </header>
          <div class="body">
            <div class="cards">
              <div class="card"><span>Баланс</span><b>${money(user.balanceCents)}</b></div>
              <div class="card"><span>SteamID</span><b style="font-size:13px">${esc(user.steamid)}</b></div>
              <div class="card"><span>Регистрация</span><b style="font-size:13px">${when(user.createdAt)}</b></div>
            </div>
            ${controls}
            <div class="block"><h2>Последние предметы</h2><div class="table-scroll"><table>
              <thead><tr><th>Предмет</th><th class="num">Цена</th><th>Статус</th><th>Дата</th></tr></thead>
              <tbody>${inventory}</tbody></table></div></div>
            <div class="block"><h2>Операции</h2><div class="table-scroll"><table>
              <thead><tr><th>Тип</th><th class="num">Сумма</th><th class="num">Баланс</th><th>Дата</th></tr></thead>
              <tbody>${transactions}</tbody></table></div></div>
          </div>
        </div>
      </div>`;
  }

  function transactionsView() {
    const rows = state.transactions.length ? state.transactions.map(row => `
      <tr>
        <td>${esc(row.userName || ('ID ' + row.userId))}</td>
        <td>${esc(TX_LABELS[row.kind] || row.kind)}</td>
        <td class="num mono ${row.amountCents >= 0 ? 'pos' : 'neg'}">${row.amountCents >= 0 ? '+' : ''}${money(row.amountCents)}</td>
        <td class="num mono">${money(row.balanceAfter)}</td>
        <td class="muted">${esc(row.note || '')}</td>
        <td class="muted">${when(row.createdAt)}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-row">Операций пока нет</td></tr>';

    const summary = state.txSummary.map(row => `
      <div class="card ${row.total >= 0 ? 'good' : 'bad'}">
        <span>${esc(TX_LABELS[row.kind] || row.kind)} · ${num(row.count)}</span>
        <b>${money(row.total)}</b>
      </div>`).join('');

    const options = ['', 'case_open', 'upgrade_stake', 'item_sale', 'admin_credit', 'admin_debit', 'promo']
      .map(kind => `<option value="${kind}" ${state.txKind === kind ? 'selected' : ''}>${kind ? esc(TX_LABELS[kind] || kind) : 'Все типы'}</option>`).join('');

    return `
      <div class="cards">${summary || '<div class="card"><span>Данных нет</span><b>—</b></div>'}</div>
      <div class="block">
        <h2>История операций</h2>
        <div class="block-body row">
          <select id="tx-kind">${options}</select>
          <button class="act" id="tx-refresh">Обновить</button>
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Игрок</th><th>Тип</th><th class="num">Сумма</th><th class="num">Баланс после</th><th>Комментарий</th><th>Дата</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  function casesView() {
    const cases = state.cases.map(item => `
      <tr>
        <td><b>${esc(item.name)}</b><small class="muted" style="display:block">${esc(item.id)}</small></td>
        <td class="num mono">
          <input type="number" step="0.01" style="width:110px" data-price="${esc(item.id)}" value="${(item.priceCents / 100).toFixed(2)}" ${isAdmin() ? '' : 'disabled'}>
        </td>
        <td><span class="tag ${item.enabled ? 'on' : 'off'}">${item.enabled ? 'включён' : 'выключен'}</span></td>
        <td class="num mono">${num(item.opened)}</td>
        <td class="num mono">${money(item.revenueCents)}</td>
        <td class="num">
          ${isAdmin() ? `<button class="act small primary" data-savecase="${esc(item.id)}">Сохранить</button>
          <button class="act small ${item.enabled ? 'danger' : 'ok'}" data-togglecase="${esc(item.id)}" data-enabled="${item.enabled ? 1 : 0}">${item.enabled ? 'Выключить' : 'Включить'}</button>` : ''}
        </td>
      </tr>`).join('');

    const drops = state.drops.length ? state.drops.map(drop => `
      <tr>
        <td>${esc(drop.userName)}</td>
        <td>${esc(drop.itemName)}</td>
        <td class="num mono">${money(drop.priceCents)}</td>
        <td>${esc(drop.source)}</td>
        <td class="muted">${when(drop.createdAt)}</td>
        <td class="num">${isAdmin() ? `<button class="act small danger" data-deldrop="${drop.id}">Удалить</button>` : ''}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-row">Дропов нет</td></tr>';

    return `
      <div class="block">
        <h2>Кейсы</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>Кейс</th><th class="num">Цена ₽</th><th>Статус</th><th class="num">Открытий</th><th class="num">Сборы</th><th></th></tr></thead>
          <tbody>${cases}</tbody>
        </table></div>
      </div>
      <div class="block">
        <h2>Лента дропов</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>Игрок</th><th>Предмет</th><th class="num">Цена</th><th>Источник</th><th>Дата</th><th></th></tr></thead>
          <tbody>${drops}</tbody>
        </table></div>
      </div>`;
  }

  function coefficientsView() {
    const settings = (state.summary && state.summary.settings) || { caseLuck: 0, upgradeLuck: 0 };
    return `
      <div class="block">
        <h2>Глобальные коэффициенты</h2>
        <div class="block-body" style="display:grid;gap:16px;max-width:560px">
          <p class="muted" style="margin:0">
            Положительное значение повышает шанс дорогих предметов и успех апгрейда, отрицательное — понижает.
            0% — честная математика. Допустимый диапазон: от −90% до 300%.
          </p>
          <div class="field">
            <label>Удача в кейсах, %</label>
            <input id="coef-case" type="number" step="1" min="-90" max="300" value="${Number(settings.caseLuck || 0)}">
          </div>
          <div class="field">
            <label>Удача в апгрейдах, %</label>
            <input id="coef-upgrade" type="number" step="1" min="-90" max="300" value="${Number(settings.upgradeLuck || 0)}">
          </div>
          <div class="row"><button class="act primary" id="coef-save">Сохранить</button></div>
        </div>
      </div>`;
  }

  function botsView() {
    const rows = state.bots.length ? state.bots.map(bot => `
      <tr>
        <td>${esc(bot.name)}</td>
        <td class="muted">${when(bot.createdAt)}</td>
        <td class="num">
          ${isAdmin() ? `<button class="act small" data-botdrop="${bot.id}">Сгенерировать дроп</button>
          <button class="act small danger" data-botdel="${bot.id}">Удалить</button>` : ''}
        </td>
      </tr>`).join('') : '<tr><td colspan="3" class="empty-row">Ботов нет</td></tr>';

    return `
      ${isAdmin() ? `<div class="block">
        <h2>Новый бот</h2>
        <div class="block-body row">
          <input class="grow" id="bot-name" placeholder="Имя бота в ленте">
          <button class="act primary" id="bot-create">Создать</button>
        </div>
      </div>` : ''}
      <div class="block">
        <h2>Боты витрины</h2>
        <div class="block-body"><p class="muted" style="margin:0">Боты не участвуют в статистике игроков и нужны для наполнения ленты дропов.</p></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Имя</th><th>Создан</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
  }

  function promosView() {
    const rows = state.promos.length ? state.promos.map(promo => `
      <tr>
        <td><b>${esc(promo.code)}</b></td>
        <td class="num mono">${money(promo.amountCents)}</td>
        <td class="num mono">${num(promo.usedCount)} / ${promo.maxUses ? num(promo.maxUses) : '∞'}</td>
        <td class="muted">${promo.expiresAt ? when(promo.expiresAt) : 'бессрочно'}</td>
        <td><span class="tag ${promo.active ? 'on' : 'off'}">${promo.active ? 'активен' : 'отключён'}</span></td>
        <td class="num">
          ${isAdmin() ? `<button class="act small" data-promotoggle="${promo.id}">${promo.active ? 'Выключить' : 'Включить'}</button>
          <button class="act small danger" data-promodel="${promo.id}">Удалить</button>` : ''}
        </td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-row">Промокодов нет</td></tr>';

    return `
      ${isAdmin() ? `<div class="block">
        <h2>Создать промокод</h2>
        <div class="block-body row">
          <input id="promo-code" class="grow" placeholder="КОД (A-Z, 0-9)">
          <input id="promo-amount" class="grow" type="number" step="0.01" placeholder="Бонус, ₽">
          <input id="promo-uses" class="grow" type="number" step="1" placeholder="Лимит (0 — без лимита)">
          <input id="promo-days" class="grow" type="number" step="1" placeholder="Дней (0 — бессрочно)">
          <button class="act primary" id="promo-create">Создать</button>
        </div>
      </div>` : ''}
      <div class="block">
        <h2>Промокоды и бонусы</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>Код</th><th class="num">Бонус</th><th class="num">Использований</th><th>Истекает</th><th>Статус</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
  }

  function supportView() {
    const threads = state.threads.length ? state.threads.map(thread => {
      const active = state.thread && Number(state.thread.user.id) === Number(thread.userId);
      const avatar = thread.avatar
        ? `<img src="${esc(thread.avatar)}" alt="" referrerpolicy="no-referrer">`
        : '<img src="/chunks/logo.svg" alt="">';
      return `<button class="thread-item ${active ? 'active' : ''}" data-thread="${thread.userId}">
        ${avatar}
        <div class="thread-copy">
          <strong>${esc(thread.userName)}</strong>
          <small>${esc(thread.email || 'без email')}</small>
        </div>
        <div class="thread-meta">
          <time>${shortTime(thread.lastAt)}</time>
          ${thread.unread ? `<i class="thread-unread">${num(thread.unread)}</i>` : ''}
        </div>
      </button>`;
    }).join('') : '<div class="thread-empty">Обращений пока нет</div>';

    return `
      <div class="chat-layout ${state.thread ? 'has-thread' : ''}">
        <aside class="chat-threads">
          <div class="chat-threads-head">
            <span>Диалоги</span>
            <b>${num(state.threads.length)}</b>
          </div>
          <div class="chat-threads-list">${threads}</div>
        </aside>
        <section class="chat-panel">${state.thread ? chatConversation() : chatPlaceholder()}</section>
      </div>`;
  }

  function chatPlaceholder() {
    return `<div class="chat-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 15.5A2.5 2.5 0 0 1 17.5 18H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5Z"/>
      </svg>
      <strong>Выберите диалог</strong>
      <span>Слева список игроков, которые написали в поддержку</span>
    </div>`;
  }

  function dayLabel(ts) {
    const date = new Date(Number(ts));
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const same = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (same(date, today)) return 'Сегодня';
    if (same(date, yesterday)) return 'Вчера';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
  }

  function chatConversation() {
    const thread = state.thread;
    const avatar = thread.user.avatar
      ? `<img src="${esc(thread.user.avatar)}" alt="" referrerpolicy="no-referrer">`
      : '<img src="/chunks/logo.svg" alt="">';

    let bubbles = '';
    let lastDay = '';
    if (!thread.messages.length) {
      bubbles = '<div class="chat-empty">Сообщений пока нет — напишите первым</div>';
    } else {
      thread.messages.forEach(message => {
        const day = dayLabel(message.createdAt);
        if (day !== lastDay) {
          lastDay = day;
          bubbles += `<div class="chat-day"><span>${esc(day)}</span></div>`;
        }
        const time = new Date(Number(message.createdAt)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        bubbles += `<div class="bubble-row ${message.fromStaff ? 'out' : 'in'}">
          <div class="bubble">
            <p>${esc(message.message)}</p>
            <time>${esc(time)}</time>
          </div>
        </div>`;
      });
    }

    return `
      <header class="chat-head">
        <button class="chat-back" data-close-thread aria-label="Назад">‹</button>
        ${avatar}
        <div class="chat-head-copy">
          <strong>${esc(thread.user.name)}</strong>
          <small>${esc(thread.user.email || 'email не указан')}</small>
        </div>
        <button class="act small" data-openuser="${thread.user.id}">Профиль</button>
      </header>
      <div class="chat-scroll" id="chat-log">${bubbles}</div>
      <form class="chat-composer" id="reply-form">
        <textarea id="reply-text" rows="1" maxlength="1000" placeholder="Написать сообщение…"></textarea>
        <button type="submit" class="chat-send" id="reply-send" aria-label="Отправить">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12 20 4l-8 16-2.4-6.2L4 12Z"/>
          </svg>
        </button>
      </form>`;
  }

  function logsView() {
    const system = state.system || {};
    const rows = state.logs.length ? state.logs.map(log => `
      <tr>
        <td>${esc(log.adminName)}</td>
        <td><b>${esc(log.action)}</b></td>
        <td>${esc(log.target)}</td>
        <td class="muted">${esc(log.details)}</td>
        <td class="muted">${when(log.createdAt)}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty-row">Записей нет</td></tr>';

    const uptime = Number(system.uptimeSeconds || 0);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const infra = state.infra;
    const queueInfo = (infra && infra.queue) || {};
    const infraBlock = infra ? `
      <div class="block">
        <h2>Инфраструктура</h2>
        <div class="block-body">
          <div class="cards" style="margin:0">
            <div class="card ${infra.databaseDriver === 'postgres' ? 'good' : 'warn'}">
              <span>База данных</span><b style="font-size:14px">${esc(infra.database)}</b>
            </div>
            <div class="card ${infra.cacheDriver === 'redis' ? 'good' : 'warn'}">
              <span>Кеш и сессии</span><b style="font-size:14px">${esc(infra.cache)}</b>
            </div>
            <div class="card">
              <span>Очередь задач</span><b style="font-size:14px">${esc(queueInfo.driver || '—')}</b>
            </div>
            <div class="card"><span>В очереди</span><b>${num(queueInfo.pending)}</b></div>
            <div class="card good"><span>Обработано задач</span><b>${num(queueInfo.processed)}</b></div>
            <div class="card ${Number(queueInfo.errors) ? 'bad' : ''}"><span>Ошибок в очереди</span><b>${num(queueInfo.errors)}</b></div>
            <div class="card"><span>Rate limit</span><b style="font-size:15px">${esc(infra.rateLimit)}</b></div>
            <div class="card"><span>Топики</span><b style="font-size:12px">${esc((queueInfo.queues || []).join(', '))}</b></div>
          </div>
        </div>
      </div>` : '';

    return `${infraBlock}
      <div class="cards">
        <div class="card"><span>Аптайм</span><b>${hours}ч ${minutes}м</b></div>
        <div class="card"><span>Память (RSS)</span><b>${num(system.memoryMb)} МБ</b></div>
        <div class="card"><span>Heap</span><b>${num(system.heapMb)} МБ</b></div>
        <div class="card"><span>Node.js</span><b style="font-size:15px">${esc(system.nodeVersion)}</b></div>
        <div class="card"><span>Онлайн-соединений</span><b>${num(system.online)}</b></div>
        <div class="card"><span>Размер базы</span><b>${esc(system.dbSizeMb)} МБ</b></div>
        <div class="card"><span>Предметов в каталоге</span><b>${num(system.catalogSize)}</b></div>
        <div class="card"><span>Запущен</span><b style="font-size:13px">${when(system.startedAt)}</b></div>
      </div>
      <div class="block">
        <h2>Журнал действий персонала</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>Кто</th><th>Действие</th><th>Объект</th><th>Детали</th><th>Дата</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
  }

  function bindView() {
    const view = document.getElementById('admin-view');
    if (!view) return;

    view.querySelectorAll('[data-go]').forEach(button => {
      button.addEventListener('click', () => selectTab(button.dataset.go));
    });

    const search = view.querySelector('#user-search');
    if (search) {
      const run = () => {
        state.userQuery = (view.querySelector('#user-q') || {}).value || '';
        loadUsers();
      };
      search.addEventListener('click', run);
      const input = view.querySelector('#user-q');
      if (input) input.addEventListener('keydown', event => { if (event.key === 'Enter') run(); });
    }

    view.querySelectorAll('[data-user]').forEach(button => {
      button.addEventListener('click', () => openUser(button.dataset.user));
    });
    view.querySelectorAll('[data-close-modal]').forEach(node => {
      node.addEventListener('click', event => {
        if (event.target !== node) return;
        state.userDetail = null;
        render();
      });
    });

    bindUserModal(view);

    const txRefresh = view.querySelector('#tx-refresh');
    if (txRefresh) {
      txRefresh.addEventListener('click', () => {
        state.txKind = (view.querySelector('#tx-kind') || {}).value || '';
        loadTransactions();
      });
    }

    view.querySelectorAll('[data-savecase]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const id = button.dataset.savecase;
        const field = view.querySelector(`[data-price="${id}"]`);
        const rubles = Number(field && field.value);
        if (!Number.isFinite(rubles) || rubles < 0) return toast('Некорректная цена', 'err');
        await run(() => api(`/api/admin/cases/${encodeURIComponent(id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceCents: Math.round(rubles * 100), enabled: true })
        }), 'Цена обновлена', loadCases);
      });
    });

    view.querySelectorAll('[data-togglecase]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const id = button.dataset.togglecase;
        const enabled = button.dataset.enabled === '1' ? false : true;
        const field = view.querySelector(`[data-price="${id}"]`);
        const rubles = Number(field && field.value);
        await run(() => api(`/api/admin/cases/${encodeURIComponent(id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceCents: Math.round(rubles * 100), enabled })
        }), enabled ? 'Кейс включён' : 'Кейс выключен', loadCases);
      });
    });

    view.querySelectorAll('[data-deldrop]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/drops/${button.dataset.deldrop}`, { method: 'DELETE' }), 'Дроп удалён', loadCases);
      });
    });

    const coefSave = view.querySelector('#coef-save');
    if (coefSave) {
      coefSave.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const caseLuck = Number((view.querySelector('#coef-case') || {}).value || 0);
        const upgradeLuck = Number((view.querySelector('#coef-upgrade') || {}).value || 0);
        await run(() => api('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseLuck, upgradeLuck })
        }), 'Коэффициенты сохранены', loadSummary);
      });
    }

    const botCreate = view.querySelector('#bot-create');
    if (botCreate) {
      botCreate.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const name = ((view.querySelector('#bot-name') || {}).value || '').trim();
        if (!name) return toast('Укажите имя бота', 'err');
        await run(() => api('/api/admin/bots', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        }), 'Бот создан', loadBots);
      });
    }
    view.querySelectorAll('[data-botdrop]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/bots/${button.dataset.botdrop}/drop`, { method: 'POST' }), 'Дроп добавлен в ленту');
      });
    });
    view.querySelectorAll('[data-botdel]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/bots/${button.dataset.botdel}`, { method: 'DELETE' }), 'Бот удалён', loadBots);
      });
    });

    const promoCreate = view.querySelector('#promo-create');
    if (promoCreate) {
      promoCreate.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const code = ((view.querySelector('#promo-code') || {}).value || '').trim();
        const amount = Number((view.querySelector('#promo-amount') || {}).value || 0);
        const maxUses = Number((view.querySelector('#promo-uses') || {}).value || 0);
        const days = Number((view.querySelector('#promo-days') || {}).value || 0);
        await run(() => api('/api/admin/promos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, amountCents: Math.round(amount * 100), maxUses, days })
        }), 'Промокод создан', loadPromos);
      });
    }
    view.querySelectorAll('[data-promotoggle]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/promos/${button.dataset.promotoggle}/toggle`, { method: 'POST' }), 'Готово', loadPromos);
      });
    });
    view.querySelectorAll('[data-promodel]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/promos/${button.dataset.promodel}`, { method: 'DELETE' }), 'Промокод удалён', loadPromos);
      });
    });

    view.querySelectorAll('[data-thread]').forEach(button => {
      button.addEventListener('click', () => openThread(button.dataset.thread));
    });
    view.querySelectorAll('[data-close-thread]').forEach(node => {
      node.addEventListener('click', () => {
        state.thread = null;
        render();
        loadSupport();
      });
    });
    view.querySelectorAll('[data-openuser]').forEach(button => {
      button.addEventListener('click', async () => {
        state.tab = 'users';
        state.thread = null;
        await loadCatalog();
        await loadUsers();
        await openUser(button.dataset.openuser);
      });
    });

    const form = view.querySelector('#reply-form');
    if (form) {
      const field = view.querySelector('#reply-text');
      const resize = () => {
        field.style.height = 'auto';
        field.style.height = Math.min(120, field.scrollHeight) + 'px';
      };
      const send = async () => {
        const message = (field.value || '').trim();
        if (!message) return;
        field.value = '';
        resize();
        try {
          await api(`/api/admin/support/${state.thread.user.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
          });
          await openThread(state.thread.user.id, true);
        } catch (error) {
          toast(error.message, 'err');
        }
      };
      form.addEventListener('submit', event => { event.preventDefault(); send(); });
      field.addEventListener('input', resize);
      field.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
      });
      field.focus();
      const log = view.querySelector('#chat-log');
      if (log) log.scrollTop = log.scrollHeight;
    }
  }

  function bindUserModal(view) {
    if (!state.userDetail) return;
    const id = state.userDetail.user.id;

    const balApply = view.querySelector('#bal-apply');
    if (balApply) {
      balApply.addEventListener('click', async () => {
        const rubles = Number((view.querySelector('#bal-amount') || {}).value);
        const note = ((view.querySelector('#bal-note') || {}).value || '').trim();
        if (!Number.isFinite(rubles) || rubles === 0) return toast('Укажите сумму', 'err');
        await run(() => api(`/api/admin/users/${id}/balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountCents: Math.round(rubles * 100), note })
        }), 'Баланс изменён', async () => { await openUser(id); loadUsers(); });
      });
    }

    const roleApply = view.querySelector('#role-apply');
    if (roleApply) {
      roleApply.addEventListener('click', async () => {
        const role = (view.querySelector('#role-select') || {}).value;
        await run(() => api(`/api/admin/users/${id}/role`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role })
        }), 'Роль обновлена', async () => { await openUser(id); loadUsers(); });
      });
    }

    const luckApply = view.querySelector('#luck-apply');
    if (luckApply) {
      luckApply.addEventListener('click', async () => {
        const value = Number((view.querySelector('#luck-value') || {}).value || 0);
        await run(() => api(`/api/admin/users/${id}/luck`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ luckModifier: value })
        }), 'Модификатор сохранён', async () => { await openUser(id); loadUsers(); });
      });
    }

    const giveApply = view.querySelector('#give-apply');
    if (giveApply) {
      giveApply.addEventListener('click', async () => {
        const catalogId = ((view.querySelector('#give-id') || {}).value || '').trim();
        if (!catalogId) return toast('Укажите catalogId', 'err');
        await run(() => api(`/api/admin/users/${id}/give`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ catalogId })
        }), 'Предмет выдан', () => openUser(id));
      });
    }

    const banToggle = view.querySelector('#ban-toggle');
    if (banToggle) {
      banToggle.addEventListener('click', async () => {
        const banned = !state.userDetail.user.banned;
        const reason = ((view.querySelector('#ban-reason') || {}).value || '').trim();
        await run(() => api(`/api/admin/users/${id}/ban`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ banned, reason })
        }), banned ? 'Пользователь заблокирован' : 'Блокировка снята', async () => { await openUser(id); loadUsers(); });
      });
    }
  }

  async function run(action, successMessage, after) {
    try {
      await action();
      if (successMessage) toast(successMessage, 'ok');
      if (after) await after();
    } catch (error) {
      toast(error.message, 'err');
    }
  }

  async function loadSummary() {
    state.summary = await api('/api/admin/summary');
    state.role = state.summary.role;
    render();
  }
  async function loadUsers() {
    const data = await api(`/api/admin/users?q=${encodeURIComponent(state.userQuery)}`);
    state.users = data.users;
    render();
  }
  async function openUser(id) {
    state.userDetail = await api(`/api/admin/users/${id}`);
    render();
  }
  async function loadTransactions() {
    const data = await api(`/api/admin/transactions?kind=${encodeURIComponent(state.txKind)}`);
    state.transactions = data.transactions;
    state.txSummary = data.summary;
    render();
  }
  async function loadCases() {
    const [cases, drops] = await Promise.all([api('/api/admin/cases'), api('/api/admin/drops')]);
    state.cases = cases.cases;
    state.drops = drops.drops;
    render();
  }
  async function loadBots() {
    state.bots = (await api('/api/admin/bots')).bots;
    render();
  }
  async function loadPromos() {
    state.promos = (await api('/api/admin/promos')).promos;
    render();
  }
  async function loadSupport() {
    state.threads = (await api('/api/admin/support')).threads;
    render();
  }
  async function openThread(userId, silent) {
    const data = await api(`/api/admin/support/${userId}`);
    state.thread = data;
    if (!silent) {
      const item = state.threads.find(row => Number(row.userId) === Number(userId));
      if (item) item.unread = 0;
    }
    render();
    if (silent) {
      try { state.threads = (await api('/api/admin/support')).threads; } catch (_) {}
    }
  }
  async function loadLogs() {
    const data = await api('/api/admin/logs');
    state.logs = data.logs;
    state.system = data.system;
    state.infra = data.infra || null;
    render();
  }
  async function loadCatalog() {
    if (state.catalog.length) return;
    try {
      const data = await api('/api/catalog');
      state.catalog = Array.isArray(data) ? data : (data.items || []);
    } catch (_) { state.catalog = []; }
  }

  async function selectTab(tab) {
    state.tab = tab;
    state.userDetail = null;
    state.thread = null;
    render();
    try {
      if (tab === 'dashboard') await loadSummary();
      if (tab === 'users') { await loadCatalog(); await loadUsers(); }
      if (tab === 'transactions') await loadTransactions();
      if (tab === 'cases') await loadCases();
      if (tab === 'coefficients') await loadSummary();
      if (tab === 'bots') await loadBots();
      if (tab === 'promos') await loadPromos();
      if (tab === 'support') await loadSupport();
      if (tab === 'logs') await loadLogs();
    } catch (error) {
      toast(error.message, 'err');
    }
  }

  async function boot() {
    try {
      const me = await api('/api/me');
      if (!me.authenticated) {
        root.className = 'admin-denied';
        root.innerHTML = '<div><h2>Требуется вход</h2><p>Авторизуйтесь через Steam на основном сайте.</p><a href="/">На главную</a></div>';
        return;
      }
      state.me = me.user;
      state.role = me.user.role;
      if (state.role !== 'admin' && state.role !== 'support') {
        root.className = 'admin-denied';
        root.innerHTML = '<div><h2>Доступ запрещён</h2><p>Раздел доступен администраторам и поддержке.</p><a href="/">На главную</a></div>';
        return;
      }
      await loadSummary();
    } catch (error) {
      root.className = 'admin-denied';
      root.innerHTML = `<div><h2>Ошибка</h2><p>${esc(error.message)}</p><a href="/">На главную</a></div>`;
    }
  }

  boot();
})();
