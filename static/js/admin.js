(function () {
  'use strict';

  const root = document.getElementById('admin-root');
  const toastRoot = document.getElementById('admin-toast');

  const state = {
    tab: 'dashboard',
    role: 'user',
    me: null,
    brand: 'КЕЙСЕР',
    telegram: 'https://t.me/',
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
    catalog: [],
    emailStatus: null,
    emailQueue: [],
    emailQueueStatus: '',
    broadcasts: [],
    editingCase: null,
    caseBuilderSearch: '',
    caseBuilderContents: [],
    online: [],
    priceQueue: null, priceConfig: null, priceHistory: [], proxyFilter: 'all', site: null, casePreview: null,
    logFilters: { admin: '', action: '', q: '', from: '', to: '' }
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
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    broadcast: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/>',
    prices: '<path d="M3 17h18M5 13l4-4 3 3 6-7"/><circle cx="5" cy="13" r="1"/><circle cx="18" cy="5" r="1"/>',
    site: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
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
    { key: 'email', label: 'Почта', adminOnly: true },
    { key: 'broadcast', label: 'Рассылки' },
    { key: 'support', label: 'Поддержка' },
    { key: 'prices', label: 'Цены и прокси', adminOnly: true },
    { key: 'site', label: 'Управление сайтом', adminOnly: true },
    { key: 'logs', label: 'Журнал действий' }
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

  const USER_TAGS={vip:'VIP',suspicious:'Подозрительный',verified:'Проверенный',partner:'Партнёр'};
  const ROLE_LABELS = { admin: 'Администратор', support: 'Поддержка', user: 'Игрок' };
  const TICKET_CATEGORIES={payments:'Платежи',withdrawal:'Вывод',account:'Аккаунт',errors:'Ошибки'};
  const TICKET_PRIORITIES={low:'Низкий',normal:'Обычный',high:'Высокий',critical:'Критический'};
  const QUICK_REPLIES=['Здравствуйте! Уже проверяем ваше обращение.','Пожалуйста, пришлите SteamID и номер операции.','Проверка завершена. Попробуйте повторить действие.','Спасибо за ожидание. Проблема передана техническому специалисту.'];
  const TICKET_STATUS = {
    open: { label: 'Открыт', className: 'ticket-open' },
    pending: { label: 'Ожидание', className: 'ticket-pending' },
    closed: { label: 'Закрыт', className: 'ticket-closed' }
  };
  const ACTION_LABELS = {
    balance: 'Изменение баланса', ban: 'Блокировка пользователя', unban: 'Снятие блокировки', role: 'Изменение роли', luck: 'Изменение удачи',
    give_item: 'Выдача предмета', item_revoke: 'Отзыв предмета', case_update: 'Настройка кейса', case_create: 'Создание кейса', case_edit: 'Изменение кейса', case_delete: 'Удаление кейса', case_image_upload: 'Загрузка изображения кейса',
    drop_delete: 'Удаление дропа', settings: 'Изменение настроек', bot_create: 'Создание бота', bot_delete: 'Удаление бота', bot_drop: 'Дроп от бота',
    promo_create: 'Создание промокода', promo_toggle: 'Переключение промокода', promo_delete: 'Удаление промокода', support_reply: 'Ответ пользователю в поддержке', support_status: 'Изменение статуса тикета', support_meta:'Изменение категории/приоритета', user_freeze:'Заморозка аккаунта', user_unfreeze:'Снятие заморозки', user_tags:'Изменение меток', price_config:'Настройки цен', proxy_import:'Импорт прокси', site_config:'Настройки сайта',
    broadcast: 'Отправка уведомления', broadcast_delete: 'Удаление уведомления', maintenance: 'Режим техработ', catalog_rebuild: 'Пересборка каталога', prices_refresh: 'Обновление цен', cache_clear: 'Очистка кеша',
    backup_download: 'Скачивание резервной копии', cleanup: 'Очистка старых данных', price_queue_pause: 'Пауза очереди цен', price_queue_resume: 'Запуск очереди цен', price_queue_clear: 'Очистка кеша цен',
    proxy_add: 'Добавление прокси', proxy_reload: 'Перезагрузка прокси', proxy_fetch_free: 'Загрузка бесплатных прокси', email_test: 'Тестовое письмо', email_broadcast: 'Массовая email-рассылка', email_user: 'Письмо пользователю'
  };
  const actionLabel = action => ACTION_LABELS[action] || String(action || 'Неизвестное действие').replace(/_/g, ' ');
  function logDetails(log) {
    let value = String(log.details || '');
    if (!value) return '—';
    if (log.action === 'support_status') return TICKET_STATUS[value]?.label || value;
    if (log.action === 'role') return ROLE_LABELS[value] || value;
    value = value
      .replace(/\bon\b/g, 'включено').replace(/\boff\b/g, 'выключено')
      .replace(/recipients=/g, 'получателей: ').replace(/updated=/g, 'обновлено: ')
      .replace(/deleted=/g, 'удалено: ').replace(/days=/g, 'дней: ')
      .replace(/fetched=/g, 'получено: ').replace(/loaded=/g, 'загружено: ')
      .replace(/count=/g, 'количество: ').replace(/enabled=true/g, 'включён').replace(/enabled=false/g, 'выключен')
      .replace(/price=base/g, 'цена: базовая').replace(/price=/g, 'цена: ');
    return value;
  }

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
          <div class="admin-brand"><img src="/chunks/logo.svg" alt="">${esc(state.brand)}<span style="margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.14em;color:#56A8FF;opacity:.85">ADMIN</span></div>
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
    if (tab === 'email') return emailView();
    if (tab === 'broadcast') return broadcastView();
    if (tab === 'support') return supportView();
    if (tab === 'prices') return pricesView();
    if (tab === 'site') return siteView();
    if (tab === 'logs') return logsView();
    return '';
  }

  function emailView() {
    const s = state.emailStatus || {};
    const queueRows = (state.emailQueue || []).map(m => `
      <tr>
        <td>${esc(m.to)}</td>
        <td>${esc(m.subject)}</td>
        <td><span class="tag ${m.status === 'sent' ? 'on' : m.status === 'failed' ? 'banned' : 'user'}">${m.status}</span></td>
        <td class="num">${m.attempts}</td>
        <td class="muted">${m.error ? esc(m.error) : ''}</td>
        <td class="muted">${when(m.createdAt)}</td>
      </tr>`).join('');
    return `
      <div class="cards">
        <div class="card ${s.configured ? 'good' : 'bad'}"><span>SMTP статус</span><b>${s.configured ? 'Подключено' : 'Не настроено'}</b></div>
        <div class="card"><span>В очереди</span><b>${num(s.pending || 0)}</b></div>
        <div class="card good"><span>Отправлено</span><b>${num(s.sent || 0)}</b></div>
        <div class="card bad"><span>Ошибок</span><b>${num(s.failed || 0)}</b></div>
      </div>
      <div class="block">
        <h2>Настройки SMTP</h2>
        <div class="block-body">
          <p class="muted" style="margin-top:0">${esc(s.description || '')}</p>
          <p class="muted" style="margin-top:0">Задайте переменные окружения <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>SMTP_FROM</code> и перезапустите сервер. Пример для Яндекс.Почты: <code>smtp.yandex.ru:465</code> с <code>SMTP_SECURE=1</code>; для Gmail: <code>smtp.gmail.com:587</code>; для Mailgun/SendGrid: их SMTP relay.</p>
        </div>
      </div>
      ${isAdmin() ? `
      <div class="block">
        <h2>Тестовое письмо</h2>
        <div class="block-body row">
          <input class="grow" id="mail-test-to" placeholder="email@example.com">
          <button class="act primary" id="mail-test-send">Отправить тест</button>
        </div>
      </div>
      <div class="block">
        <h2>Массовая рассылка</h2>
        <div class="block-body" style="display:grid;gap:10px;max-width:640px">
          <input id="mail-broadcast-subject" placeholder="Тема письма" maxlength="200">
          <textarea id="mail-broadcast-body" rows="6" placeholder="Текст письма (переносы строк сохраняются)" style="width:100%;min-height:140px"></textarea>
          <button class="act primary" id="mail-broadcast-send">Поставить в очередь всем подписчикам</button>
          <div class="muted" style="font-size:12px">Письма получат только пользователи, указавшие email и не отписавшиеся от рассылки.</div>
        </div>
      </div>` : ''}
      <div class="block">
        <h2>Очередь писем <button class="act small" id="mail-queue-refresh" style="float:right">Обновить</button></h2>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Кому</th><th>Тема</th><th>Статус</th><th class="num">Попыток</th><th>Ошибка</th><th>Создано</th></tr></thead>
            <tbody>${queueRows || '<tr><td colspan="6" class="empty-row">Очередь пуста</td></tr>'}</tbody>
          </table>
        </div>
        <div class="block-body row">
          ${['', 'pending', 'sent', 'failed'].map(s => `<button class="act small ${state.emailQueueStatus === s ? 'primary' : ''}" data-mail-status="${s}">${s === '' ? 'Все' : s}</button>`).join('')}
        </div>
      </div>`;
  }

  function broadcastView() {
    const list = (state.broadcasts || []).map(n => `
      <tr>
        <td><b>${esc(n.title)}</b><div class="muted" style="max-width:480px;white-space:pre-wrap">${esc(n.body)}</div></td>
        <td><span class="tag ${n.audience === 'all' ? 'on' : 'user'}">${n.audience}</span></td>
        <td class="muted">${when(n.createdAt)}</td>
        <td class="num">${isAdmin() ? `<button class="act small danger" data-broadcast-del="${n.id}">Удалить</button>` : ''}</td>
      </tr>`).join('');
    return `
      ${isAdmin() ? `
      <div class="block">
        <h2>Новое уведомление</h2>
        <div class="block-body" style="display:grid;gap:10px;max-width:640px">
          <input id="bc-title" placeholder="Заголовок" maxlength="120">
          <textarea id="bc-body" rows="4" placeholder="Текст уведомления" style="width:100%;min-height:100px"></textarea>
          <div class="row">
            <select id="bc-audience">
              <option value="all">Всем посетителям</option>
              <option value="authenticated">Только вошедшим</option>
              <option value="guests">Только гостям</option>
            </select>
            <input id="bc-ttl" type="number" min="1" max="720" value="24" style="width:120px">
            <span class="muted">часов жизни (0 = бессрочно)</span>
          </div>
          <button class="act primary" id="bc-send" style="justify-self:start">Отправить</button>
        </div>
      </div>` : ''}
      <div class="block">
        <h2>Активные и прошлые уведомления</h2>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Уведомление</th><th>Аудитория</th><th>Создано</th><th></th></tr></thead>
            <tbody>${list || '<tr><td colspan="4" class="empty-row">Уведомлений нет</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
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
        <td><span class="tag ${esc(user.role)}">${esc(ROLE_LABELS[user.role] || user.role)}</span>${user.isBot ? ' <span class="tag bot">бот</span>' : ''}${user.banned ? ' <span class="tag banned">бан</span>' : ''}${user.frozen?' <span class="tag warn">заморожен</span>':''}${(user.tags||[]).map(tag=>` <span class="tag user-tag tag-${esc(tag)}">${esc(USER_TAGS[tag]||tag)}</span>`).join('')}</td>
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
    const inventory = detail.inventory.length ? detail.inventory.slice(0, 30).map(item => `
      <tr>
        <td>${esc(item.name)}</td>
        <td class="num mono">${money(item.priceCents)}</td>
        <td>${esc(item.status)}</td>
        <td class="muted">${when(item.createdAt)}</td>
        <td class="num">${isAdmin() && item.status === 'active' ? `<button class="act small danger" data-revoke="${item.id}">Отозвать</button>` : ''}</td>
      </tr>
    `).join('') : '<tr><td colspan="5" class="empty-row">Инвентарь пуст</td></tr>';
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
        <label>Написать на email ${user.email ? `(${esc(user.email)})` : '(email не указан)'}</label>
        <input id="email-user-subject" placeholder="Тема" style="margin-bottom:6px" ${user.email ? '' : 'disabled'}>
        <textarea id="email-user-body" rows="3" placeholder="Текст письма" style="margin-bottom:6px" ${user.email ? '' : 'disabled'}></textarea>
        <button class="act" id="email-user" ${user.email ? '' : 'disabled'}>Отправить письмо</button>
      </div>
      <div class="field"><label>Метки пользователя</label><div class="user-tag-picker">${Object.entries(USER_TAGS).map(([key,label])=>`<label><input type="checkbox" data-user-tag="${key}" ${(user.tags||[]).includes(key)?'checked':''}> ${label}</label>`).join('')}<button class="act" id="tags-save">Сохранить метки</button></div></div>
      <div class="field"><label>Заморозка аккаунта</label><div class="row"><input class="grow" id="freeze-reason" placeholder="Причина заморозки" value="${esc(user.freezeReason||'')}"><button class="act ${user.frozen?'ok':'warn'}" id="freeze-toggle">${user.frozen?'Снять заморозку':'Заморозить'}</button></div><small class="muted">При заморозке доступна только поддержка. Игровые и финансовые действия отключаются.</small></div>
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
            <h3>${esc(user.name)} <span class="tag ${esc(user.role)}">${esc(ROLE_LABELS[user.role] || user.role)}</span>${user.banned ? ' <span class="tag banned">заблокирован</span>' : ''}${user.frozen?' <span class="tag warn">заморожен</span>':''}${(user.tags||[]).map(tag=>` <span class="tag user-tag tag-${esc(tag)}">${esc(USER_TAGS[tag]||tag)}</span>`).join('')}</h3>
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
              <thead><tr><th>Предмет</th><th class="num">Цена</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
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

  function normalizeCaseContents(contents) {
    if (!Array.isArray(contents)) return [];
    return contents.map(entry => {
      if (Array.isArray(entry)) return [String(entry[0] || ''), Number(entry[1] || 0)];
      if (entry && typeof entry === 'object') return [String(entry.catalogId || entry.id || ''), Number(entry.weight || 0)];
      return null;
    }).filter(entry => entry && entry[0] && Number.isFinite(entry[1]));
  }

  function calcEV(contents) {
    if (!contents.length) return 0;
    const total = contents.reduce((s,[,w])=>s+Number(w||0),0) || 1;
    let ev = 0;
    for (const [cid,w] of contents) {
      const it = state.catalog.find(x=>x.catalogId===cid) || state.cases.flatMap(c=>c.contents).find(x=>x.catalogId===cid);
      const price = it ? Number(it.priceCents||0) : 0;
      ev += (Number(w)/total)*price;
    }
    return Math.round(ev);
  }

  function casesView() {
    const cases = state.cases.map(item => {
      const ev = item.evCents || 0;
      const profit = item.profitCents || 0;
      const roi = item.priceCents ? Math.round(profit/item.priceCents*100) : 0;
      const img = item.image ? `<img src="${esc(item.image)}" style="width:38px;height:28px;object-fit:contain;background:#111;border-radius:4px">` : `<div style="width:38px;height:28px;background:#111;border-radius:4px;display:grid;place-items:center;color:#555">?</div>`;
      return `
      <tr>
        <td><div style="display:flex;gap:8px;align-items:center">${img}<div><b>${esc(item.name)}</b><small class="muted" style="display:block">${esc(item.id)} ${item.discountPercent?`<span style="color:#44c987">-${item.discountPercent}%</span>`:''}</small></div></div></td>
        <td class="num mono">${money(item.priceCents)}${item.basePriceCents!==item.priceCents?`<br><small style="text-decoration:line-through;color:#777">${money(item.basePriceCents)}</small>`:''}<br><small class="muted">EV ${money(ev)} ROI ${roi}%</small></td>
        <td><span class="tag ${item.enabled ? 'on' : 'off'}">${item.enabled ? 'вкл' : 'выкл'}</span>${item.once?'<span class="tag warn" style="margin-left:4px">once</span>':''}${item.maxOpenings?`<small class="muted" style="display:block">${item.totalOpened||0}/${item.maxOpenings}</small>`:''}</td>
        <td class="num mono">${num(item.opened)}<br><small class="muted">${money(item.revenueCents)}</small></td>
        <td class="case-actions">
          ${isAdmin() ? `
          <button class="act case-action primary" data-editcase="${esc(item.id)}">Редактировать</button>
          <button class="act case-action" data-previewcase="${esc(item.id)}">EV</button>
          <button class="act case-action ${item.enabled ? 'danger' : 'ok'}" data-togglecase="${esc(item.id)}" data-enabled="${item.enabled ? 1 : 0}">${item.enabled ? 'Выкл' : 'Вкл'}</button>
          <button class="act case-action danger" data-delcase="${esc(item.id)}">Удалить</button>
          ` : ''}
        </td>
      </tr>`;
    }).join('');

    const drops = state.drops.length ? state.drops.map(drop => `
      <tr>
        <td>${esc(drop.userName)}</td>
        <td>${esc(drop.itemName)}</td>
        <td class="num mono">${money(drop.priceCents)}</td>
        <td>${esc(drop.source)}</td>
        <td class="muted">${when(drop.createdAt)}</td>
        <td class="num">${isAdmin() ? `<button class="act small danger" data-deldrop="${drop.id}">Удалить</button>` : ''}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-row">Дропов нет</td></tr>';

    const builder = state.editingCase ? caseBuilderModal() : '';

    return `
      <div class="block">
        <div style="display:flex;justify-content:space-between;align-items:center"><h2>Кейсы — конструктор</h2>${isAdmin()?`<button class="act primary" id="case-create-new">+ Создать кейс</button>`:''}</div>
        <div class="block-body"><p class="muted" style="margin:0">Кейсы хранятся в <code>custom_cases</code> таблице (SQLite/Postgres), а не в JSON файле — безопасно. Поддерживается PNG превью, скидки, лимиты по времени/кол-ву/уровню, once. EV считается автоматически.</p></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Кейс</th><th class="num">Цена / EV</th><th>Статус</th><th class="num">Открытий / Сборы</th><th></th></tr></thead>
          <tbody>${cases || '<tr><td colspan=5 class="empty-row">Кейсов нет</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="block">
        <h2>Лента дропов</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>Игрок</th><th>Предмет</th><th class="num">Цена</th><th>Источник</th><th>Дата</th><th></th></tr></thead>
          <tbody>${drops}</tbody>
        </table></div>
      </div>
      ${builder}${casePreviewModal()}`;
  }

  function casePreviewModal() {
    const c=state.casePreview;if(!c)return '';
    const contents=normalizeCaseContents(c.contents),total=contents.reduce((sum,[,weight])=>sum+Number(weight||0),0)||1;
    return `<div class="case-preview-overlay" data-close-case-preview><section class="case-preview-card"><header><div><span>ПРЕДПРОСМОТР</span><h2>${esc(c.name||'Без названия')}</h2><p>${esc(c.description||'Описание не указано')}</p></div><button data-close-case-preview>×</button></header><div class="case-preview-hero">${c.image?`<img src="${esc(c.image)}" alt="">`:'<div class="case-preview-noimage">Нет обложки</div>'}<div><span>Цена открытия</span><b>${money(c.priceCents||0)}</b><small>${c.enabled?'Будет доступен игрокам':'Кейс выключен'}</small></div></div><div class="case-preview-items">${contents.map(([id,weight])=>{const item=state.catalog.find(x=>x.catalogId===id);return `<article>${item?.icon?`<img src="${esc(item.icon)}" alt="">`:''}<strong>${esc(item?.name||id)}</strong><span>${(Number(weight)/total*100).toFixed(2)}%</span></article>`}).join('')}</div><footer><button class="act" data-close-case-preview>Закрыть предпросмотр</button></footer></section></div>`;
  }

  function caseBuilderModal() {
    const c = state.editingCase;
    c.contents = normalizeCaseContents(c.contents);
    const isNew = !state.cases.some(item => item.id === c.id);
    const totalW = c.contents.reduce((sum, [, weight]) => sum + Number(weight || 0), 0) || 1;
    const ev = calcEV(c.contents);
    const profit = Number(c.priceCents || 0) - ev;
    const roi = c.priceCents ? Math.round(profit / c.priceCents * 100) : 0;
    const validationErrors=[];if(!String(c.id||'').trim())validationErrors.push('Укажите ID кейса');if(!String(c.name||'').trim())validationErrors.push('Укажите название');if(!c.contents.length)validationErrors.push('Добавьте хотя бы один предмет');if(c.contents.some(([,weight])=>!Number.isFinite(Number(weight))||Number(weight)<=0))validationErrors.push('Все веса должны быть больше нуля');
    const catalogFiltered = state.catalog.filter(item => {
      if (!state.caseBuilderSearch) return true;
      const query = state.caseBuilderSearch.toLowerCase();
      return item.name.toLowerCase().includes(query) || item.catalogId.toLowerCase().includes(query);
    }).slice(0, 100);
    const selectedItems = c.contents.map(([catalogId, weight], index) => {
      const item = state.catalog.find(entry => entry.catalogId === catalogId);
      const chance = totalW > 0 ? Number(weight || 0) / totalW * 100 : 0;
      return `<div class="case-selected-item">
        <div class="case-item-image">${item?.icon ? `<img src="${esc(item.icon)}" alt="">` : '<span>?</span>'}</div>
        <div class="case-item-copy"><strong>${esc(item?.name || catalogId)}</strong><small>${esc(catalogId)}</small></div>
        <label class="case-weight-field"><span>Вес</span><input data-cb-weight="${index}" type="number" min="0.01" max="10000" step="0.1" value="${Number(weight)}"></label>
        <div class="case-chance"><b>${chance.toFixed(2)}%</b><small>${money(item?.priceCents || 0)}</small></div>
        <button class="act case-item-action danger" data-cb-remove="${index}" title="Убрать предмет">×</button>
      </div>`;
    }).join('') || '<div class="case-builder-empty"><strong>В кейсе пока нет предметов</strong><span>Найдите предмет в каталоге ниже и нажмите «Добавить».</span></div>';
    const catalogItems = catalogFiltered.map(item => `<div class="case-catalog-item">
      <div class="case-item-image">${item.icon ? `<img src="${esc(item.icon)}" alt="">` : '<span>?</span>'}</div>
      <div class="case-item-copy"><strong>${esc(item.name)}</strong><small>${esc(item.catalogId)} · ${money(item.priceCents)}</small></div>
      <button class="act case-catalog-add" data-cb-add="${esc(item.catalogId)}">Добавить</button>
    </div>`).join('') || '<div class="case-builder-empty"><strong>Ничего не найдено</strong><span>Измените поисковый запрос.</span></div>';
    return `<div class="case-builder" id="case-builder">
      <section class="case-builder-card" role="dialog" aria-modal="true" aria-label="${isNew ? 'Создание кейса' : 'Редактирование кейса'}">
        <header class="case-builder-header">
          <div><span>${isNew ? 'НОВЫЙ КЕЙС' : 'РЕДАКТОР КЕЙСА'}</span><h2>${isNew ? 'Создание нового кейса' : esc(c.name || c.id)}</h2><p>${isNew ? 'Заполните основные данные и добавьте предметы.' : `ID: ${esc(c.id)}`}</p></div>
          <button class="case-builder-close" id="case-builder-close" aria-label="Закрыть">×</button>
        </header>
        <div class="case-builder-summary">
          <div><span>Цена</span><b>${money(c.priceCents || 0)}</b></div>
          <div><span>Средняя выдача (EV)</span><b>${money(ev)}</b></div>
          <div class="${profit >= 0 ? 'positive' : 'negative'}"><span>Ожидаемый профит</span><b>${money(profit)}</b></div>
          <div class="${roi >= 0 ? 'positive' : 'negative'}"><span>ROI</span><b>${roi}%</b></div>
          <div><span>Предметов</span><b>${c.contents.length}</b></div>
          <div><span>Сумма весов</span><b>${totalW.toFixed(2)}</b></div>
        </div>
        <div class="case-validation ${validationErrors.length?'has-errors':'ok'}"><b>${validationErrors.length?'Проверка не пройдена':'Кейс настроен корректно'}</b><span>${validationErrors.length?validationErrors.join(' · '):`Сумма весов: ${totalW.toFixed(2)} · все шансы рассчитаны автоматически`}</span></div>
        <div class="case-builder-body">
          <aside class="case-settings">
            <section class="case-form-section"><header><b>1. Основная информация</b><span>Название и описание, которые увидит игрок.</span></header>
              <div class="case-form-grid one"><label>ID кейса <small>Латиница, цифры, «-» и «_»</small><input id="cb-id" value="${esc(c.id)}" ${isNew ? '' : 'disabled'} placeholder="neon-case"></label>
              <label>Название <small>Короткое и понятное название</small><input id="cb-name" value="${esc(c.name || '')}" placeholder="NEON CASE"></label>
              <label>Описание <small>Что пользователь может получить</small><textarea id="cb-desc" rows="3" placeholder="Описание кейса">${esc(c.description || '')}</textarea></label></div>
            </section>
            <section class="case-form-section"><header><b>2. Цена и доступность</b><span>Стоимость, скидка и состояние кейса.</span></header>
              <div class="case-form-grid two"><label>Базовая цена, ₽<input id="cb-price" type="number" min="0" step="0.01" value="${(Number(c.priceCents || 0) / 100).toFixed(2)}"></label><label>Скидка, %<input id="cb-discount" type="number" min="0" max="90" value="${Number(c.discount_percent || c.discountPercent || 0)}"></label></div>
              <div class="case-switches"><label><input id="cb-enabled" type="checkbox" ${c.enabled ? 'checked' : ''}><span><b>Кейс включён</b><small>Доступен игрокам на сайте</small></span></label><label><input id="cb-once" type="checkbox" ${c.once ? 'checked' : ''}><span><b>Один раз</b><small>Каждый игрок сможет открыть только один раз</small></span></label></div>
            </section>
            <section class="case-form-section"><header><b>3. Ограничения</b><span>Оставьте 0 или пустое поле, если ограничение не нужно.</span></header>
              <div class="case-form-grid two"><label>Максимум открытий<input id="cb-max" type="number" min="0" value="${Number(c.max_openings || c.maxOpenings || 0)}"></label><label>Минимальный уровень<input id="cb-level" type="number" min="0" value="${Number(c.level_min || c.levelMin || 0)}"></label><label>Начало показа <small>Timestamp, необязательно</small><input id="cb-start" type="number" value="${c.starts_at || c.startsAt || ''}" placeholder="Без ограничения"></label><label>Конец показа <small>Timestamp, необязательно</small><input id="cb-end" type="number" value="${c.ends_at || c.endsAt || ''}" placeholder="Без ограничения"></label></div>
            </section>
            <section class="case-form-section"><header><b>4. Обложка кейса</b><span>PNG, JPG, WEBP или SVG до 4 МБ.</span></header>
              <label>URL изображения<input id="cb-image" value="${esc(c.image || '')}" placeholder="/static/cases/my-case.png"></label>
              <div class="case-upload-row"><input type="file" id="cb-file" accept=".png,.jpg,.jpeg,.webp,.svg"><button class="act case-action" id="cb-upload">Загрузить файл</button></div>
              ${c.image ? `<div class="case-cover-preview"><img src="${esc(c.image)}" alt=""><span>Текущая обложка</span></div>` : ''}
            </section>
          </aside>
          <main class="case-items-editor">
            <section class="case-items-section"><header><div><b>5. Содержимое кейса</b><span>Вес определяет относительный шанс выпадения.</span></div><em>${c.contents.length} предметов</em></header><div class="case-selected-list">${selectedItems}</div></section>
            <section class="case-items-section case-catalog-section"><header><div><b>6. Каталог предметов</b><span>Добавьте нужные предметы в кейс.</span></div></header><div class="case-catalog-search"><input id="cb-search" placeholder="Поиск по названию или ID" value="${esc(state.caseBuilderSearch)}"><span>Показано ${catalogFiltered.length}</span></div><div class="case-catalog-list">${catalogItems}</div></section>
          </main>
        </div>
        <footer class="case-builder-footer"><button class="act" id="case-builder-preview">Предпросмотр</button><button class="act case-footer-cancel" id="case-builder-cancel">Отмена</button><button class="act primary case-footer-save" id="case-builder-save">${isNew ? 'Создать кейс' : 'Сохранить изменения'}</button></footer>
      </section>
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
          <span class="ticket-status ${TICKET_STATUS[thread.status]?.className || 'ticket-open'}">${TICKET_STATUS[thread.status]?.label || 'Открыт'}</span><span class="ticket-category">${TICKET_CATEGORIES[thread.category]||'Аккаунт'}</span><span class="ticket-priority priority-${esc(thread.priority||'normal')}">${TICKET_PRIORITIES[thread.priority]||'Обычный'}</span>
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
        <span class="ticket-status ${TICKET_STATUS[thread.ticket?.status]?.className || 'ticket-open'}" data-ticket-context="${thread.user.id}" title="Нажмите правой кнопкой мыши, чтобы изменить статус">${TICKET_STATUS[thread.ticket?.status]?.label || 'Открыт'}</span>
        <button class="act small" data-openuser="${thread.user.id}">Профиль</button>
      </header>
      ${thread.typingStaff?`<div class="staff-typing"><i></i>${esc(thread.typingStaff)} печатает ответ…</div>`:''}
      <details class="ticket-history"><summary>История тикета · ${(thread.history||[]).length}</summary><div>${(thread.history||[]).map(row=>`<p><time>${shortTime(row.createdAt)}</time><b>${esc(row.staffName)}</b><span>${esc({status:'Статус',category:'Категория',priority:'Приоритет',reply:'Ответ',message:'Сообщение'}[row.event]||row.event)}: ${esc(row.oldValue)}${row.oldValue?' → ':''}${esc(row.newValue)}</span></p>`).join('')||'<p>История пуста</p>'}</div></details>
      <div class="chat-scroll" id="chat-log">${bubbles}</div>
      ${thread.ticket?.status === 'closed' ? '' : `<div class="quick-replies"><select id="quick-reply"><option value="">Быстрый ответ…</option>${QUICK_REPLIES.map(text=>`<option value="${esc(text)}">${esc(text)}</option>`).join('')}</select></div><form class="chat-composer" id="reply-form"><textarea id="reply-text" rows="1" maxlength="1000" placeholder="Написать сообщение…"></textarea><button type="submit" class="chat-send" id="reply-send" aria-label="Отправить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 20 4l-8 16-2.4-6.2L4 12Z"/></svg></button></form>`}`;
  }

  function siteView() {
    const site = state.site || {};
    const banner = site.banner || { enabled:false, title:'', body:'', link:'', tone:'info' };
    return `<section class="site-manager">
      <div class="block"><h2>Основные настройки сайта</h2><div class="block-body site-config-grid"><label>Название сайта<input id="site-brand" value="${esc(site.brand||'')}"></label><label>Ссылка Telegram<input id="site-telegram" value="${esc(site.telegram||'')}"></label><label>Email поддержки<input id="site-support-email" value="${esc(site.supportEmail||'')}"></label><label>Email сотрудничества<input id="site-marketing-email" value="${esc(site.marketingEmail||'')}"></label></div></div>
      <div class="block"><h2>Баннер / объявление</h2><div class="block-body site-banner-editor"><label class="site-check"><input id="site-banner-enabled" type="checkbox" ${banner.enabled?'checked':''}> Показывать баннер на сайте</label><div class="site-config-grid"><label>Заголовок<input id="site-banner-title" value="${esc(banner.title||'')}"></label><label>Стиль<select id="site-banner-tone">${['info','warning','danger','success'].map(tone=>`<option value="${tone}" ${banner.tone===tone?'selected':''}>${{info:'Информация',warning:'Предупреждение',danger:'Важно',success:'Успех'}[tone]}</option>`).join('')}</select></label><label class="wide">Текст<textarea id="site-banner-body" rows="3">${esc(banner.body||'')}</textarea></label><label class="wide">Ссылка (необязательно)<input id="site-banner-link" value="${esc(banner.link||'')}"></label></div><div class="site-banner-preview tone-${esc(banner.tone||'info')}"><b>${esc(banner.title||'Пример объявления')}</b><span>${esc(banner.body||'Так баннер будет выглядеть на главной странице.')}</span></div></div></div>
      <div class="block"><h2>Технические работы</h2><div class="block-body"><label>Сообщение для пользователей<textarea id="site-maintenance-message" rows="3">${esc(site.maintenance||'')}</textarea></label><div class="row"><button class="act" id="site-maintenance-preview">Предпросмотр</button><button class="act danger" id="site-maintenance-enable">Включить техработы</button><button class="act ok" id="site-maintenance-disable">Выключить</button></div></div></div>
      <div class="block"><h2>Планировщик уведомлений</h2><div class="block-body site-scheduler"><input id="site-notify-title" placeholder="Заголовок"><textarea id="site-notify-body" rows="3" placeholder="Текст уведомления"></textarea><div class="row"><select id="site-notify-audience"><option value="all">Всем</option><option value="authenticated">Авторизованным</option><option value="guests">Гостям</option></select><input id="site-notify-time" type="datetime-local"><button class="act primary" id="site-notify-schedule">Запланировать</button></div></div></div>
      <div class="row site-save-row"><button class="act primary" id="site-save">Сохранить настройки сайта</button></div>
    </section>`;
  }

  function pricesView() {
    const priceStatus = state.priceStatus || {};
    const priceQueue = state.priceQueue || {};
    const pct = priceStatus.loading && priceStatus.progress
      ? Math.round(priceStatus.progress.done / priceStatus.progress.total * 100)
      : 0;
    const proxyRows = Array.isArray(priceQueue.proxyStats) ? priceQueue.proxyStats : [];
    const blockedProxies = proxyRows.filter(proxy => proxy.blocked).length;
    const successfulProxies = proxyRows.filter(proxy => Number(proxy.success) > 0 && !proxy.blocked).length;
    const failedProxies = proxyRows.filter(proxy => Number(proxy.fails) > 0).length;
    const validation = priceQueue.validation || {};
    const visibleProxyRows = proxyRows.filter(proxy => state.proxyFilter==='all' || (state.proxyFilter==='working' && !proxy.blocked && proxy.success>0) || (state.proxyFilter==='blocked' && proxy.blocked) || (state.proxyFilter==='new' && !proxy.blocked && !proxy.success));
    const progressDone = Number(priceStatus.progress?.done || 0);
    const progressTotal = Number(priceStatus.progress?.total || priceStatus.catalogItems || 0);
    const priceBlock = isAdmin() ? `<section class="price-manager block">
      <header class="price-manager-head"><div><span>STEAM MARKET</span><h2>Управление ценами и прокси</h2><p>Очередь автоматически проверяет прокси, отключает нерабочие IP и повторяет запрос через другой адрес.</p></div><span class="price-manager-state ${priceQueue.paused ? 'paused' : 'active'}">${priceQueue.paused ? 'Очередь на паузе' : priceQueue.validating ? 'Проверка прокси' : 'Очередь работает'}</span></header>
      <div class="price-manager-stats">
        <article><span>Каталог</span><b>${num(priceStatus.catalogItems || 0)}</b><small>предметов</small></article>
        <article><span>Реальные цены</span><b>${num(priceStatus.withPrice || 0)}</b><small>оценочных: ${num(priceStatus.estimated || 0)}</small></article>
        <article><span>Кеш цен</span><b>${num(priceStatus.cachedPrices || priceQueue.size || 0)}</b><small>записей</small></article>
        <article><span>В очереди</span><b>${num(priceQueue.queueLen || 0)}</b><small>работников: ${num(priceQueue.activeWorkers || 0)}</small></article>
        <article class="good"><span>Прокси работают</span><b>${num(successfulProxies)}</b><small>в пуле: ${num(priceQueue.proxies || 0)}</small></article>
        <article class="${blockedProxies ? 'bad' : ''}"><span>Заблокировано</span><b>${num(blockedProxies)}</b><small>с ошибками: ${num(failedProxies)}</small></article>
      </div>
      <div class="price-progress-card">
        <div><b>${priceStatus.loading ? 'Обновление цен' : 'Очередь готова'}</b><span>${progressDone} из ${progressTotal || '—'}${priceStatus.loading ? ` · ${pct}%` : ''}</span></div>
        <div class="price-progress-track"><i style="width:${priceStatus.loading ? pct : 0}%"></i></div>
      </div>
      <div class="price-actions">
        <button class="act primary" id="sys-prices-full" ${priceStatus.loading ? 'disabled' : ''}>Обновить весь каталог</button>
        <button class="act" id="sys-prices-refresh" ${priceStatus.loading ? 'disabled' : ''}>Обновить следующие 50</button>
        <button class="act" id="sys-catalog-rebuild">Пересобрать каталог</button>
        <button class="act ${priceQueue.paused ? 'ok' : 'warn'}" id="sys-queue-toggle">${priceQueue.paused ? 'Возобновить очередь' : 'Поставить на паузу'}</button>
        <button class="act danger" id="sys-queue-clear">Очистить кеш цен</button>
      </div>
      <section class="proxy-manager">
        <header><div><h3>Прокси для Steam Market</h3><p>Бесплатные публичные IP часто уже заблокированы Steam. Перед добавлением каждый адрес проверяется реальным запросом к Steam.</p></div>${validation.at ? `<div class="proxy-validation"><span>Последняя проверка</span><b>${num(validation.working || 0)} / ${num(validation.checked || 0)}</b><small>отклонено: ${num(validation.rejected || 0)}</small></div>` : ''}</header>
        <div class="proxy-controls"><input id="proxy-add-input" placeholder="http://IP:PORT"><button class="act" id="proxy-add-btn">Добавить вручную</button><button class="act" id="proxy-reload-btn">Проверить файл прокси</button><button class="act primary" id="proxy-fetch-free">Скачать и проверить бесплатные</button><input id="proxy-import-file" type="file" accept=".txt,.csv"><button class="act" id="proxy-import-btn">Импортировать файл</button><a class="act" href="/api/admin/proxies/export" target="_blank">Экспорт рабочих</a></div>
        <div class="proxy-filter-row">${[['all','Все'],['working','Рабочие'],['blocked','Заблокированные'],['new','Непроверенные']].map(([key,label])=>`<button class="${state.proxyFilter===key?'active':''}" data-proxy-filter="${key}">${label}</button>`).join('')}</div>
        <div class="proxy-table-wrap"><table class="proxy-table"><thead><tr><th>Прокси</th><th>Успешно</th><th>Ошибки</th><th>Состояние</th><th>Причина / задержка</th><th></th></tr></thead><tbody>${visibleProxyRows.length ? visibleProxyRows.slice(0,100).map(proxy => {
          const state = proxy.blocked ? 'blocked' : Number(proxy.success) > 0 ? 'working' : proxy.busy ? 'checking' : 'new';
          const label = state === 'blocked' ? 'Отключён' : state === 'working' ? 'Работает' : state === 'checking' ? 'Запрос…' : 'Не проверен';
          const wait = proxy.blockedUntil > Date.now() ? `до ${new Date(proxy.blockedUntil).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}` : '';
          return `<tr><td class="mono">${esc(proxy.url)}</td><td class="proxy-success">${num(proxy.success || 0)}</td><td class="proxy-fails">${num(proxy.fails || 0)}</td><td><span class="proxy-state ${state}">${label}</span></td><td class="muted">${esc(proxy.lastError || (proxy.lastLatency ? `${proxy.lastLatency} мс` : '') || wait || '—')}</td><td><button class="act small" data-proxy-retest="${esc(proxy.url)}">Проверить</button></td></tr>`;
        }).join('') : '<tr><td colspan="6" class="empty-row">Прокси пока нет. Нажмите «Скачать и проверить бесплатные» или добавьте свой адрес.</td></tr>'}</tbody></table></div>
      </section>
    </section>` : '';

    const config = state.priceConfig || {};
    const history = state.priceHistory || [];
    const bars = (priceStatus.speedHistory || []).slice(-24);
    return `${priceBlock}<section class="block price-config"><h2>Настройки очереди и источника</h2><div class="block-body price-config-grid"><label>Источник цен<select id="price-source"><option value="auto" ${config.source==='auto'?'selected':''}>Steam → Skinport (резерв)</option><option value="steam" ${config.source==='steam'?'selected':''}>Только Steam</option><option value="skinport" ${config.source==='skinport'?'selected':''}>Только Skinport</option></select></label><label>Потоки<input id="price-workers" type="number" min="1" max="24" value="${config.workers||12}"></label><label>Таймаут прокси, мс<input id="price-timeout" type="number" min="1500" max="15000" value="${config.timeoutMs||4000}"></label><label>Удалить после ошибок<input id="price-max-fails" type="number" min="1" max="20" value="${config.maxFailures||3}"></label><label>Блокировка 429, минут<input id="price-block-429" type="number" min="1" max="1440" value="${config.block429Minutes||30}"></label><label>Проверка каждые, минут<input id="price-check-interval" type="number" min="5" value="${config.checkIntervalMinutes||15}"></label><label>Пауза между запросами, мс<input id="price-min-interval" type="number" min="100" value="${config.minInterval||400}"></label><label>Тревога при изменении, %<input id="price-alert" type="number" min="5" value="${config.alertPercent||35}"></label><button class="act primary" id="price-config-save">Сохранить настройки</button></div></section><section class="block"><h2>Скорость обновления</h2><div class="price-speed-chart">${bars.length?bars.map(point=>`<i style="height:${Math.max(4,Math.min(100,Number(point.rate||0)*10))}%" title="${Number(point.rate||0).toFixed(2)} цен/с"></i>`).join(''):'<span class="muted">График появится во время обновления цен</span>'}</div></section><section class="block"><h2>История изменения цен</h2><div class="block-body row"><input id="price-history-q" class="grow" placeholder="Название предмета"><button class="act" id="price-history-search">Найти</button></div><div class="table-scroll"><table><thead><tr><th>Предмет</th><th>Цена</th><th>Источник</th><th>Изменение</th><th>Дата</th></tr></thead><tbody>${history.map(row=>`<tr><td>${esc(row.marketHashName)}</td><td>${money(row.price)}</td><td>${esc(row.source)}</td><td class="${row.changePercent>=0?'pos':'neg'}">${row.changePercent>=0?'+':''}${Number(row.changePercent).toFixed(1)}%</td><td>${when(row.createdAt)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-row">История пока пуста</td></tr>'}</tbody></table></div></section>`;
  }

  function logsView() {
    const rows = state.logs.length ? state.logs.map(log => `
      <tr>
        <td>${esc(log.adminName)}</td>
        <td><b title="${esc(log.action)}">${esc(actionLabel(log.action))}</b></td>
        <td>${esc(log.target)}</td>
        <td class="muted">${esc(logDetails(log))}</td>
        <td class="muted">${when(log.createdAt)}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty-row">Записей нет</td></tr>';

    const filters = state.logFilters || { admins: [], actions: [] };
    const filterBlock = `
      <div class="block">
        <h2>Фильтры логов</h2>
        <div class="block-body row" style="flex-wrap:wrap;gap:8px">
          <select id="log-filter-admin"><option value="">Все админы</option>${(filters.admins||[]).map(a=>`<option value="${esc(a)}" ${state.logFilters.admin===a?'selected':''}>${esc(a)}</option>`).join('')}</select>
          <select id="log-filter-action"><option value="">Все действия</option>${(filters.actions||[]).map(a=>`<option value="${esc(a)}" ${state.logFilters.action===a?'selected':''}>${esc(actionLabel(a))}</option>`).join('')}</select>
          <input id="log-filter-q" placeholder="Поиск по цели/деталям" value="${esc(state.logFilters.q||'')}" style="min-width:200px">
          <button class="act small" id="log-filter-apply">Применить</button>
          <button class="act small" id="log-filter-clear">Сброс</button>
        </div>
      </div>`;

    return `${filterBlock}
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

    view.querySelectorAll('[data-togglecase]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const id = button.dataset.togglecase;
        const enabled = button.dataset.enabled === '1' ? false : true;
        await run(() => api(`/api/admin/cases/${encodeURIComponent(id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        }), enabled ? 'Кейс включён' : 'Кейс выключен', loadCases);
      });
    });

    view.querySelectorAll('[data-deldrop]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        await run(() => api(`/api/admin/drops/${button.dataset.deldrop}`, { method: 'DELETE' }), 'Дроп удалён', loadCases);
      });
    });

    view.querySelectorAll('[data-editcase]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.editcase;
        const c = state.cases.find(x=>x.id===id);
        if (!c) return;
        state.editingCase = { ...c, contents: normalizeCaseContents(c.contents) };
        state.caseBuilderSearch = '';
        render();
      });
    });
    view.querySelectorAll('[data-previewcase]').forEach(button => button.addEventListener('click',()=>{const item=state.cases.find(entry=>entry.id===button.dataset.previewcase);if(item){state.casePreview={...item,contents:normalizeCaseContents(item.contents)};render();}}));
    view.querySelectorAll('[data-close-case-preview]').forEach(node=>node.addEventListener('click',event=>{if(event.target===node||event.currentTarget.tagName==='BUTTON'){state.casePreview=null;render();}}));
    view.querySelectorAll('[data-delcase]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const id = button.dataset.delcase;
        if (!await customConfirm(`Удалить кейс ${id}?`, { title: 'Удаление кейса', confirmText: 'Удалить', danger: true })) return;
        await run(() => api(`/api/admin/cases/${encodeURIComponent(id)}?force=1`, { method: 'DELETE' }), 'Кейс удалён', loadCases);
      });
    });
    const newBtn = view.querySelector('#case-create-new');
    if (newBtn) newBtn.addEventListener('click', () => {
      if (!guardAdmin()) return;
      state.editingCase = { id: '', name: '', description: '', priceCents: 0, once: 0, enabled: 1, image: '', max_openings: 0, level_min: 0, starts_at: null, ends_at: null, discount_percent: 0, contents: [] };
      state.caseBuilderSearch = '';
      render();
    });

    const builder = view.querySelector('#case-builder');
    if (builder) {
      const close = () => { state.editingCase = null; render(); };
      const captureCaseForm = () => {
        const c = state.editingCase;
        if (!c) return;
        c.id = (builder.querySelector('#cb-id')?.value || c.id || '').trim();
        c.name = (builder.querySelector('#cb-name')?.value || '').trim();
        c.description = (builder.querySelector('#cb-desc')?.value || '').trim();
        c.priceCents = Math.round(Number(builder.querySelector('#cb-price')?.value || 0) * 100);
        c.discount_percent = Math.round(Number(builder.querySelector('#cb-discount')?.value || 0));
        c.max_openings = Math.round(Number(builder.querySelector('#cb-max')?.value || 0));
        c.level_min = Math.round(Number(builder.querySelector('#cb-level')?.value || 0));
        c.starts_at = builder.querySelector('#cb-start')?.value ? Number(builder.querySelector('#cb-start').value) : null;
        c.ends_at = builder.querySelector('#cb-end')?.value ? Number(builder.querySelector('#cb-end').value) : null;
        c.once = builder.querySelector('#cb-once')?.checked ? 1 : 0;
        c.enabled = builder.querySelector('#cb-enabled')?.checked ? 1 : 0;
        c.image = (builder.querySelector('#cb-image')?.value || '').trim();
      };
      const rerenderBuilder = focusSelector => {
        captureCaseForm();
        render();
        requestAnimationFrame(() => {
          const field = document.querySelector(focusSelector || '#cb-search');
          if (field) { field.focus(); if (field.setSelectionRange) field.setSelectionRange(field.value.length, field.value.length); }
        });
      };
      builder.querySelector('#case-builder-close')?.addEventListener('click', close);
      builder.querySelector('#case-builder-cancel')?.addEventListener('click', close);
      builder.addEventListener('click', e => { if (e.target.id==='case-builder') close(); });
      const search = builder.querySelector('#cb-search');
      if (search) search.addEventListener('input', () => { state.caseBuilderSearch = search.value; rerenderBuilder('#cb-search'); });
      builder.querySelectorAll('[data-cb-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cid = btn.dataset.cbAdd;
          const existing = state.editingCase.contents.find(([id])=>id===cid);
          captureCaseForm();
          if (existing) existing[1] = Number(existing[1])+1;
          else state.editingCase.contents.push([cid, 10]);
          render();
        });
      });
      builder.querySelectorAll('[data-cb-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.cbRemove);
          captureCaseForm();
          state.editingCase.contents.splice(idx,1);
          render();
        });
      });
      builder.querySelectorAll('[data-cb-weight]').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = Number(inp.dataset.cbWeight);
          const v = Number(inp.value);
          captureCaseForm();
          if (state.editingCase.contents[idx]) state.editingCase.contents[idx][1] = v;
          render();
        });
      });
      const preview=builder.querySelector('#case-builder-preview');if(preview)preview.addEventListener('click',()=>{captureCaseForm();state.casePreview={...state.editingCase,contents:normalizeCaseContents(state.editingCase.contents)};render();});
      const save = builder.querySelector('#case-builder-save');
      if (save) save.addEventListener('click', async () => {
        if (!guardAdmin()) return;
        const idEl = builder.querySelector('#cb-id');
        const nameEl = builder.querySelector('#cb-name');
        const descEl = builder.querySelector('#cb-desc');
        const priceEl = builder.querySelector('#cb-price');
        const discEl = builder.querySelector('#cb-discount');
        const maxEl = builder.querySelector('#cb-max');
        const levelEl = builder.querySelector('#cb-level');
        const startEl = builder.querySelector('#cb-start');
        const endEl = builder.querySelector('#cb-end');
        const onceEl = builder.querySelector('#cb-once');
        const enabledEl = builder.querySelector('#cb-enabled');
        const imageEl = builder.querySelector('#cb-image');
        const isNew = !state.cases.some(x=>x.id===state.editingCase.id) || !idEl.disabled;
        const payload = {
          id: (idEl.value||'').trim(),
          name: (nameEl.value||'').trim(),
          description: (descEl.value||'').trim(),
          priceCents: Math.round(Number(priceEl.value||0)*100),
          discount_percent: Math.round(Number(discEl.value||0)),
          max_openings: Math.round(Number(maxEl.value||0)),
          level_min: Math.round(Number(levelEl.value||0)),
          starts_at: startEl.value ? Number(startEl.value) : null,
          ends_at: endEl.value ? Number(endEl.value) : null,
          once: onceEl.checked ? 1 : 0,
          enabled: enabledEl.checked ? 1 : 0,
          image: (imageEl.value||'').trim(),
          contents: state.editingCase.contents
        };
        try {
          if (isNew) {
            await api('/api/admin/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            toast('Кейс создан');
          } else {
            await api(`/api/admin/cases/${encodeURIComponent(payload.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            toast('Кейс сохранён');
          }
          state.editingCase = null;
          await loadCases();
        } catch (e) { toast(e.message,'err'); }
      });
      const uploadBtn = builder.querySelector('#cb-upload');
      if (uploadBtn) uploadBtn.addEventListener('click', async () => {
        const fileInput = builder.querySelector('#cb-file');
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) return toast('Выбери PNG файл','err');
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const data = reader.result;
            const res = await api('/api/admin/cases/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, data }) });
            const imgInput = builder.querySelector('#cb-image');
            if (imgInput) imgInput.value = res.url;
            state.editingCase.image = res.url;
            toast('Картинка загружена: '+res.url);
            render();
          } catch (e) { toast(e.message,'err'); }
        };
        reader.readAsDataURL(file);
      });
    }

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

    const closeTicketContextMenu = () => document.querySelector('[data-ticket-menu]')?.remove();
    const changeTicketStatus = async (userId, status) => {
      const current = state.threads.find(row => Number(row.userId) === Number(userId));
      if (status === current?.status) return;
      if (status === 'closed' && !await customConfirm('Закрыть тикет? Через 5 минут весь диалог будет автоматически удалён.', { title: 'Закрытие тикета', confirmText: 'Закрыть', danger: true })) return;
      try {
        await api(`/api/admin/support/${userId}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
        });
        toast(status === 'closed' ? 'Тикет закрыт. Диалог удалится через 5 минут' : `Статус: ${TICKET_STATUS[status].label}`, 'ok');
        await loadSupport();
        if (state.thread && Number(state.thread.user.id) === Number(userId)) await openThread(userId, true);
        if (status === 'closed') setTimeout(() => { loadSupport(); if (state.thread && Number(state.thread.user.id) === Number(userId)) state.thread = null; render(); }, 301000);
      } catch (error) { toast(error.message, 'err'); }
    };
    const openTicketContextMenu = (event, userId) => {
      event.preventDefault();
      closeTicketContextMenu();
      const thread = state.threads.find(row => Number(row.userId) === Number(userId));
      const menu = document.createElement('div');
      menu.className = 'ticket-context-menu';
      menu.dataset.ticketMenu = '';
      menu.innerHTML = `<b>Статус тикета</b>${Object.entries(TICKET_STATUS).map(([key,item])=>`<button type="button" data-context-status="${key}" class="${thread?.status===key?'active':''} ${key==='closed'?'danger':''}"><i></i><span>${item.label}</span></button>`).join('')}<b>Категория</b>${Object.entries(TICKET_CATEGORIES).map(([key,label])=>`<button type="button" data-context-category="${key}" class="${thread?.category===key?'active':''}"><span>${label}</span></button>`).join('')}<b>Приоритет</b>${Object.entries(TICKET_PRIORITIES).map(([key,label])=>`<button type="button" data-context-priority="${key}" class="${thread?.priority===key?'active':''}"><span>${label}</span></button>`).join('')}`;
      document.body.appendChild(menu);
      const left = Math.min(event.clientX, innerWidth - menu.offsetWidth - 8);
      const top = Math.min(event.clientY, innerHeight - menu.offsetHeight - 8);
      menu.style.left = Math.max(8, left) + 'px';
      menu.style.top = Math.max(8, top) + 'px';
      menu.querySelectorAll('[data-context-status]').forEach(button => button.addEventListener('click', async () => {
        const status = button.dataset.contextStatus;
        closeTicketContextMenu();
        await changeTicketStatus(userId, status);
      }));
      const changeMeta=async payload=>{closeTicketContextMenu();try{await api(`/api/admin/support/${userId}/meta`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});await loadSupport();if(state.thread&&Number(state.thread.user.id)===Number(userId))await openThread(userId,true);}catch(error){toast(error.message,'err');}};
      menu.querySelectorAll('[data-context-category]').forEach(button=>button.addEventListener('click',()=>changeMeta({category:button.dataset.contextCategory})));
      menu.querySelectorAll('[data-context-priority]').forEach(button=>button.addEventListener('click',()=>changeMeta({priority:button.dataset.contextPriority})));
      setTimeout(() => document.addEventListener('click', closeTicketContextMenu, { once: true }), 0);
    };
    view.querySelectorAll('[data-thread]').forEach(item => item.addEventListener('contextmenu', event => openTicketContextMenu(event, item.dataset.thread)));
    view.querySelectorAll('[data-ticket-context]').forEach(item => item.addEventListener('contextmenu', event => openTicketContextMenu(event, item.dataset.ticketContext)));

    const quickReply=view.querySelector('#quick-reply');if(quickReply)quickReply.addEventListener('change',()=>{const field=view.querySelector('#reply-text');if(field&&quickReply.value){field.value=quickReply.value;field.focus();}});
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
      let typingTimer=0;field.addEventListener('input',()=>{resize();const now=Date.now();if(now-typingTimer>2000){typingTimer=now;api(`/api/admin/support/${state.thread.user.id}/typing`,{method:'POST'}).catch(()=>{});}});
      field.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
      });
      field.focus();
      const log = view.querySelector('#chat-log');
      if (log) log.scrollTop = log.scrollHeight;
    }

    view.querySelectorAll('[data-mail-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.emailQueueStatus = btn.dataset.mailStatus;
        loadEmail();
      });
    });
    const mailRefresh = view.querySelector('#mail-queue-refresh');
    if (mailRefresh) mailRefresh.addEventListener('click', loadEmail);

    const mailTest = view.querySelector('#mail-test-send');
    if (mailTest) mailTest.addEventListener('click', async () => {
      const to = (view.querySelector('#mail-test-to') || {}).value || '';
      if (!to) return toast('Введите email', 'err');
      await run(() => api('/api/admin/email/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to })
      }), 'Тестовое письмо отправлено', loadEmail);
    });

    const mailSend = view.querySelector('#mail-broadcast-send');
    if (mailSend) mailSend.addEventListener('click', async () => {
      const subject = (view.querySelector('#mail-broadcast-subject') || {}).value || '';
      const body = (view.querySelector('#mail-broadcast-body') || {}).value || '';
      if (!subject || !body) return toast('Заполните тему и текст', 'err');
      if (!await customConfirm(`Разослать письмо «${subject}» всем подписчикам?`, { title: 'Массовая рассылка', confirmText: 'Разослать' })) return;
      const r = await api('/api/admin/email/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body })
      });
      toast(`Поставлено в очередь: ${r.queued} из ${r.recipients}`);
      loadEmail();
    });

    const bcSend = view.querySelector('#bc-send');
    if (bcSend) bcSend.addEventListener('click', async () => {
      const title = (view.querySelector('#bc-title') || {}).value || '';
      const body = (view.querySelector('#bc-body') || {}).value || '';
      const audience = (view.querySelector('#bc-audience') || {}).value || 'all';
      const ttlHours = Number((view.querySelector('#bc-ttl') || {}).value || 24);
      if (!title || !body) return toast('Заполните заголовок и текст', 'err');
      await run(() => api('/api/admin/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, audience, ttlHours })
      }), 'Уведомление отправлено', loadBroadcasts);
    });
    view.querySelectorAll('[data-broadcast-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!await customConfirm('Удалить уведомление?', { title: 'Удаление уведомления', confirmText: 'Удалить', danger: true })) return;
        await run(() => api(`/api/admin/broadcasts/${btn.dataset.broadcastDel}`, { method: 'DELETE' }), 'Удалено', loadBroadcasts);
      });
    });

    const cacheBtn = view.querySelector('#sys-cache-clear');
    if (cacheBtn) cacheBtn.addEventListener('click', () => run(() => api('/api/admin/cache/clear', { method: 'POST' }), 'Кеш очищен'));
    const pricesFull = view.querySelector('#sys-prices-full');
    if (pricesFull) pricesFull.addEventListener('click', async () => {
      try {
        const r = await api('/api/admin/prices/refresh', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full: true })
        });
        if (r.alreadyRunning) toast('Загрузка уже идёт, подождите');
        else toast('Полная загрузка цен запущена. Прогресс — через несколько секунд.');
        const start = Date.now();
        while (Date.now() - start < 600000) {
          await new Promise(res => setTimeout(res, 4000));
          try {
            const s = await api('/api/admin/prices/status');
            state.priceStatus = s;
            if (!s.loading) { render(); break; }
            render();
          } catch (_) {}
        }
        await loadLogs();
      } catch (e) { toast(e.message, 'err'); }
    });
    const pricesBtn = view.querySelector('#sys-prices-refresh');
    if (pricesBtn) pricesBtn.addEventListener('click', () => run(async () => {
      const r = await api('/api/admin/prices/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      });
      toast(`Цены обновлены: ${r.updated} из ${r.checked}`);
      await loadLogs();
    }));
    const rebuildBtn = view.querySelector('#sys-catalog-rebuild');
    if (rebuildBtn) rebuildBtn.addEventListener('click', () => run(async () => {
      const r = await api('/api/admin/catalog/rebuild', { method: 'POST' });
      toast(`Каталог обновлён: ${r.size} предметов`);
    }, null, loadLogs));
    const maintOn = view.querySelector('#sys-maintenance-on');
    if (maintOn) maintOn.addEventListener('click', () => run(() => api('/api/admin/maintenance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true, message: 'Идут технические работы, скоро вернёмся' })
    }), 'Режим техработ включён'));
    const maintOff = view.querySelector('#sys-maintenance-off');
    if (maintOff) maintOff.addEventListener('click', () => run(() => api('/api/admin/maintenance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false })
    }), 'Режим техработ выключен'));

    const queueToggle = view.querySelector('#sys-queue-toggle');
    if (queueToggle) queueToggle.addEventListener('click', async () => {
      const isPaused = state.priceQueue && state.priceQueue.paused;
      const url = isPaused ? '/api/admin/prices/queue/resume' : '/api/admin/prices/queue/pause';
      await run(() => api(url, { method: 'POST' }), isPaused ? 'Очередь возобновлена' : 'Очередь на паузе', loadPrices);
    });
    const queueClear = view.querySelector('#sys-queue-clear');
    if (queueClear) queueClear.addEventListener('click', async () => {
      if (!await customConfirm('Очистить кеш цен в файле и базе данных? Цены придётся загрузить заново.', { title: 'Очистка кеша', confirmText: 'Очистить', danger: true })) return;
      await run(() => api('/api/admin/prices/queue/clear', { method: 'POST' }), 'Кеш цен очищен', loadPrices);
    });
    const proxyAdd = view.querySelector('#proxy-add-btn');
    if (proxyAdd) proxyAdd.addEventListener('click', async () => {
      const url = (view.querySelector('#proxy-add-input')||{}).value || '';
      if (!url) return toast('Введи ip:port','err');
      await run(() => api('/api/admin/proxies/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }).then(result => { toast(`Прокси проверен и добавлен · ${result.latency || 0} мс`, 'ok'); return result; }), null, loadPrices);
    });
    const proxyReload = view.querySelector('#proxy-reload-btn');
    if (proxyReload) proxyReload.addEventListener('click', async () => {
      proxyReload.disabled = true; proxyReload.textContent = 'Проверяю…';
      await run(() => api('/api/admin/proxies/reload', { method: 'POST' }).then(result => { toast(`Проверено: ${result.found || 0}. Работают: ${result.count || 0}. Отклонено: ${result.rejected || 0}`); return result; }), null, loadPrices);
      proxyReload.disabled = false; proxyReload.textContent = 'Проверить файл прокси';
    });
    const proxyFetch = view.querySelector('#proxy-fetch-free');
    if (proxyFetch) proxyFetch.addEventListener('click', async () => {
      if (!await customConfirm('Скачать бесплатные прокси из открытого доступа? Это может занять около 10 секунд.', { title: 'Загрузка прокси', confirmText: 'Скачать' })) return;
      try {
        proxyFetch.textContent = 'Скачиваю и проверяю…';
        proxyFetch.disabled = true;
        const r = await api('/api/admin/proxies/fetch-free', { method: 'POST' });
        toast(`Скачано: ${r.fetched}. Проверено: ${r.tested}. Работают: ${r.loaded}. Отклонено: ${r.rejected}`);
        await loadPrices();
      } catch (e) { toast(e.message,'err'); } finally { proxyFetch.textContent = 'Скачать и проверить бесплатные'; proxyFetch.disabled = false; }
    });
    const onlineRefresh = view.querySelector('#online-refresh');
    if (onlineRefresh) onlineRefresh.addEventListener('click', loadPrices);
    const cleanupRun = view.querySelector('#cleanup-run');
    if (cleanupRun) cleanupRun.addEventListener('click', async () => {
      const type = (view.querySelector('#cleanup-type')||{}).value || 'drops';
      const days = Number((view.querySelector('#cleanup-days')||{}).value || 30);
      if (!await customConfirm(`Очистить ${type} старше ${days} дней?`, { title: 'Очистка данных', confirmText: 'Очистить', danger: true })) return;
      await run(() => api('/api/admin/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, days }) }).then(r=>{ toast(`Удалено записей: ${r.deleted}`); return r; }), null, loadPrices);
    });
    view.querySelectorAll('[data-proxy-filter]').forEach(button => button.addEventListener('click', () => { state.proxyFilter=button.dataset.proxyFilter; render(); }));
    view.querySelectorAll('[data-proxy-retest]').forEach(button => button.addEventListener('click', async () => {
      button.disabled=true; button.textContent='Проверяю…';
      try { const result=await api('/api/admin/proxies/retest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:button.dataset.proxyRetest})}); toast(result.ok?`Прокси работает · ${result.result.latency} мс`:`Прокси не прошёл проверку: ${result.result.error}`,result.ok?'ok':'err'); await loadPrices(); } catch(error){toast(error.message,'err');}
    }));
    const proxyImport=view.querySelector('#proxy-import-btn');
    if(proxyImport)proxyImport.addEventListener('click',async()=>{const file=view.querySelector('#proxy-import-file')?.files?.[0];if(!file)return toast('Выберите TXT или CSV файл','err');proxyImport.disabled=true;proxyImport.textContent='Проверяю…';try{const text=await file.text();const result=await api('/api/admin/proxies/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});toast(`Проверено ${result.checked}, работают ${result.working}, отклонено ${result.rejected}`,'ok');await loadPrices();}catch(error){toast(error.message,'err');}finally{proxyImport.disabled=false;proxyImport.textContent='Импортировать файл';}});
    const priceSave=view.querySelector('#price-config-save');
    if(priceSave)priceSave.addEventListener('click',async()=>{const body={source:view.querySelector('#price-source').value,workers:Number(view.querySelector('#price-workers').value),timeoutMs:Number(view.querySelector('#price-timeout').value),maxFailures:Number(view.querySelector('#price-max-fails').value),block429Minutes:Number(view.querySelector('#price-block-429').value),checkIntervalMinutes:Number(view.querySelector('#price-check-interval').value),minInterval:Number(view.querySelector('#price-min-interval').value),alertPercent:Number(view.querySelector('#price-alert').value)};await run(()=>api('/api/admin/prices/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),'Настройки цен сохранены',loadPrices);});
    const historySearch=view.querySelector('#price-history-search');if(historySearch)historySearch.addEventListener('click',()=>loadPrices(view.querySelector('#price-history-q')?.value||''));

    const siteSave=view.querySelector('#site-save');
    if(siteSave)siteSave.addEventListener('click',async()=>{const body={brand:view.querySelector('#site-brand').value,telegram:view.querySelector('#site-telegram').value,supportEmail:view.querySelector('#site-support-email').value,marketingEmail:view.querySelector('#site-marketing-email').value,banner:{enabled:view.querySelector('#site-banner-enabled').checked,title:view.querySelector('#site-banner-title').value,body:view.querySelector('#site-banner-body').value,link:view.querySelector('#site-banner-link').value,tone:view.querySelector('#site-banner-tone').value}};await run(()=>api('/api/admin/site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),'Настройки сайта сохранены',loadSite);});
    const maintenancePreview=view.querySelector('#site-maintenance-preview');if(maintenancePreview)maintenancePreview.addEventListener('click',()=>{const message=view.querySelector('#site-maintenance-message').value||'Технические работы';document.body.insertAdjacentHTML('beforeend',`<div class="maintenance-preview" onclick="if(event.target===this)this.remove()"><div><span>ПРЕДПРОСМОТР</span><h2>Сайт временно недоступен</h2><p>${esc(message)}</p><button class="act" onclick="this.closest('.maintenance-preview').remove()">Закрыть</button></div></div>`);});
    const maintenanceEnable=view.querySelector('#site-maintenance-enable');if(maintenanceEnable)maintenanceEnable.addEventListener('click',()=>run(()=>api('/api/admin/maintenance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,message:view.querySelector('#site-maintenance-message').value})}),'Технические работы включены',loadSite));
    const maintenanceDisable=view.querySelector('#site-maintenance-disable');if(maintenanceDisable)maintenanceDisable.addEventListener('click',()=>run(()=>api('/api/admin/maintenance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:false})}),'Технические работы выключены',loadSite));
    const notifySchedule=view.querySelector('#site-notify-schedule');if(notifySchedule)notifySchedule.addEventListener('click',async()=>{const title=view.querySelector('#site-notify-title').value.trim(),body=view.querySelector('#site-notify-body').value.trim(),time=view.querySelector('#site-notify-time').value;if(!title||!body||!time)return toast('Заполните заголовок, текст и дату','err');await run(()=>api('/api/admin/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,body,audience:view.querySelector('#site-notify-audience').value,ttlHours:24,scheduledAt:new Date(time).getTime()})}),'Уведомление запланировано');});

    const logApply = view.querySelector('#log-filter-apply');
    if (logApply) logApply.addEventListener('click', async () => {
      const admin = (view.querySelector('#log-filter-admin')||{}).value || '';
      const action = (view.querySelector('#log-filter-action')||{}).value || '';
      const q = (view.querySelector('#log-filter-q')||{}).value || '';
      state.logFilters.admin = admin;
      state.logFilters.action = action;
      state.logFilters.q = q;
      try {
        const params = new URLSearchParams();
        if (admin) params.set('admin', admin);
        if (action) params.set('action', action);
        if (q) params.set('q', q);
        const data = await api(`/api/admin/logs?${params.toString()}`);
        state.logs = data.logs;
        render();
      } catch (e) { toast(e.message,'err'); }
    });
    const logClear = view.querySelector('#log-filter-clear');
    if (logClear) logClear.addEventListener('click', async () => {
      state.logFilters = { admin: '', action: '', q: '', from: '', to: '' };
      await loadLogs();
    });
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

    const tagsSave=view.querySelector('#tags-save');if(tagsSave)tagsSave.addEventListener('click',()=>{const tags=[...view.querySelectorAll('[data-user-tag]:checked')].map(input=>input.dataset.userTag);run(()=>api(`/api/admin/users/${id}/tags`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tags})}),'Метки сохранены',async()=>{await openUser(id);loadUsers();});});
    const freezeToggle=view.querySelector('#freeze-toggle');if(freezeToggle)freezeToggle.addEventListener('click',()=>{const frozen=!state.userDetail.user.frozen,reason=(view.querySelector('#freeze-reason')?.value||'').trim();run(()=>api(`/api/admin/users/${id}/freeze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frozen,reason})}),frozen?'Аккаунт заморожен':'Заморозка снята',async()=>{await openUser(id);loadUsers();});});

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

    view.querySelectorAll('[data-revoke]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!await customConfirm('Отозвать этот предмет у пользователя?', { title: 'Отзыв предмета', confirmText: 'Отозвать', danger: true })) return;
        const inventoryId = Number(btn.dataset.revoke);
        await run(() => api(`/api/admin/users/${id}/revoke`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventoryId })
        }), 'Предмет отозван', async () => { await openUser(id); loadUsers(); });
      });
    });

    const emailUserBtn = view.querySelector('#email-user');
    if (emailUserBtn) emailUserBtn.addEventListener('click', async () => {
      const subject = ((view.querySelector('#email-user-subject') || {}).value || '').trim();
      const body = ((view.querySelector('#email-user-body') || {}).value || '').trim();
      if (!subject || !body) return toast('Заполните тему и текст', 'err');
      await run(() => api(`/api/admin/users/${id}/email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, body })
      }), 'Письмо поставлено в очередь');
    });
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
    const [summary, config] = await Promise.all([
      api('/api/admin/summary'),
      api('/api/config').catch(() => null)
    ]);
    state.summary = summary;
    state.role = summary.role;
    if (config && config.brand) state.brand = String(config.brand).toUpperCase();
    if (config && config.telegram) state.telegram = config.telegram;
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
    try { const data=await api('/api/admin/logs'); state.logs=data.logs; state.logFilters=data.filters||{admins:[],actions:[]}; } catch(e){ console.warn(e); }
    render();
  }
  async function loadPrices(query='') {
    const [status, queueStatus, config, history] = await Promise.all([
      api('/api/admin/prices/status'), api('/api/admin/prices/queue/status'), api('/api/admin/prices/config'), api(`/api/admin/prices/history?q=${encodeURIComponent(query)}`)
    ]);
    state.priceStatus=status; state.priceQueue=queueStatus; state.priceConfig=config; state.priceHistory=history.history||[]; render();
  }
  async function loadSite() { state.site=await api('/api/admin/site'); render(); }
  async function loadEmail() {
    try {
      const [status, queue] = await Promise.all([
        api('/api/admin/email/status'),
        api(`/api/admin/email/queue?status=${encodeURIComponent(state.emailQueueStatus)}`)
      ]);
      state.emailStatus = status;
      state.emailQueue = queue.messages || [];
    } catch (e) {
      state.emailStatus = { configured: false, description: e.message };
    }
    render();
  }
  async function loadBroadcasts() {
    try {
      const data = await api('/api/admin/broadcasts');
      state.broadcasts = data.broadcasts || [];
    } catch (_) { state.broadcasts = []; }
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
      if (tab === 'email') await loadEmail();
      if (tab === 'broadcast') await loadBroadcasts();
      if (tab === 'support') await loadSupport();
      if (tab === 'prices') await loadPrices();
      if (tab === 'site') await loadSite();
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
      const events=new EventSource('/api/events');
      events.addEventListener('support-ticket',event=>{try{const ticket=JSON.parse(event.data);toast(`Новый тикет: ${ticket.userName} · ${TICKET_CATEGORIES[ticket.category]||ticket.category}`,'ok');if(state.tab==='support')loadSupport();}catch(_){}});
      setInterval(async()=>{if(state.tab!=='support'||!state.thread)return;try{const data=await api(`/api/admin/support/${state.thread.user.id}`);state.thread.typingStaff=data.typingStaff||'';const existing=document.querySelector('.staff-typing');if(existing&&!data.typingStaff)existing.remove();else if(existing)existing.innerHTML=`<i></i>${esc(data.typingStaff)} печатает ответ…`;else if(data.typingStaff){const head=document.querySelector('.chat-head');head?.insertAdjacentHTML('afterend',`<div class="staff-typing"><i></i>${esc(data.typingStaff)} печатает ответ…</div>`);}}catch(_){}},3000);
    } catch (error) {
      root.className = 'admin-denied';
      root.innerHTML = `<div><h2>Ошибка</h2><p>${esc(error.message)}</p><a href="/">На главную</a></div>`;
    }
  }

  boot();
})();
