const PATH_LANGUAGE = ({ ru: 'RU', en: 'EN', ua: 'UA', kz: 'KZ', be: 'BE' })[location.pathname.split('/').filter(Boolean)[0]?.toLowerCase()] || 'RU';

const S = {
  page: 'upgrade', me: null, inventory: [], inventoryFeed: [], catalog: [], cases: [], drops: [], online: 0,
  tab: 'inventory', from: null, to: null, chance: null, boost: 30, addBalance: 0, turbo: false, spinning: false,
  opening: null, activeCase: null, rouletteItems: [], caseResult: null, upgradeResult: null, caseReveal: false, pointerAngle: 0,
  authModal: false, ageAccepted: false, termsAccepted: false,
  profile: null, publicProfile: null, publicProfileLoading: false, publicProfileError: '', profileTab: 'items', settingsOpen: false, settings: null,
  paymentOpen: false, paymentTab: 'card', paymentAmount: 500, paymentMethod: 0, paymentCurrency: 'RUB', currencyOpen: false,
  sellMode: false, sellSelected: new Set(), sortBy: 'new', sortOpen: false, sellAllConfirm: false,
  cxWeekly: null,
  targetSearch: '', targetMin: '', targetMax: '', targetPage: 1,
  footerLang: PATH_LANGUAGE, footerLangOpen: false,
  globalStats: { totalPlayers: 0, casesOpened: 0, upgradesMade: 0 },
  chat: false, chatEmail: '', chatEmailReady: false, ticketCategory: 'account', brand: 'КЕЙСЕР', telegram: 'https://t.me/', supportEmail:'support@caser.gg', marketingEmail:'marketing@caser.gg', siteBanner:null,
  notifications: [], unreadNotifications: 0, cookieConsent: null
};

const CURRENCIES = [
  { code: 'RUB', symbol: '₽', name: 'Российский рубль', flag: '🇷🇺' },
  { code: 'USD', symbol: '$', name: 'Доллар США', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Евро', flag: '🇪🇺' },
  { code: 'UAH', symbol: '₴', name: 'Гривна', flag: '🇺🇦' },
  { code: 'KZT', symbol: '₸', name: 'Тенге', flag: '🇰🇿' },
  { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', flag: '🇧🇾' }
];
const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map(item => [item.code, item]));

const LANGS = [
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'UA', name: 'Українська', flag: '🇺🇦' },
  { code: 'KZ', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'BE', name: 'Беларуская', flag: '🇧🇾' }
];
const FLAG_CODES = { RU: 'ru', EN: 'gb', UA: 'ua', KZ: 'kz', BE: 'by' };
const UI_TRANSLATIONS = {
  EN: {
    'КЕЙСЫ':'CASES','АПГРЕЙДЫ':'UPGRADES','НАГРАДЫ':'REWARDS','Баланс':'Balance','ПАНЕЛЬ':'PANEL','ВОЙТИ ЧЕРЕЗ STEAM':'SIGN IN WITH STEAM','ONLINE':'ONLINE',
    'Лучший дроп':'Best drop','Отобразится после первой игры':'Appears after the first game','Лучший предмет в инвентаре':'Best item in inventory','Выведено':'Withdrawn','предмета':'items','Кейсы':'Cases','Апгрейды':'Upgrades','Продажи':'Sales',
    'ПРЕДМЕТЫ':'ITEMS','ИСТОРИЯ':'HISTORY','ПРОДАТЬ ВСЕ':'SELL ALL','ОТМЕНА':'CANCEL','Персональный купон':'Personal coupon','ПРИМЕНИТЬ':'APPLY',
    'ПОДДЕРЖКА':'SUPPORT','СОТРУДНИЧЕСТВО':'PARTNERSHIPS','НАВИГАЦИЯ':'NAVIGATION','Инвентарь':'Inventory','Награды':'Rewards','ОБЩИЕ ПОЛОЖЕНИЯ':'LEGAL',
    'Пользовательское соглашение':'Terms of use','Политика конфиденциальности':'Privacy policy','Политика использования Cookie':'Cookie policy','Политика AML/KYC':'AML/KYC policy','Контакты':'Contacts',
    'Онлайн':'Online','Всего игроков':'Total players','Открыто кейсов':'Cases opened','Сделано апгрейдов':'Upgrades made','Не аффилировано с Valve Corp.':'Not affiliated with Valve Corp.',
    'Улучшай и собирай собственный инвентарь CS2.':'Upgrade and build your own CS2 inventory.','Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.':'CS2 item service. All item operations take place within the website.',
    'Поддержка':'Support','Настройки':'Settings','Выйти':'Sign out','Пополнить баланс':'Add funds','Уведомления':'Notifications','Закрыть':'Close','Уведомлений пока нет':'No notifications yet','Мы используем Cookie':'We use cookies','Необходимые Cookie обеспечивают вход и безопасность. С вашего разрешения сайт также запомнит настройки интерфейса. Подробнее — в':'Necessary cookies provide sign-in and security. With your permission, the site will also remember interface preferences. Learn more in','Политике Cookie':'Cookie Policy','Отклонить':'Reject','Разрешить':'Allow','Настройки Cookie':'Cookie settings'
  },
  UA: {
    'КЕЙСЫ':'КЕЙСИ','АПГРЕЙДЫ':'АПГРЕЙДИ','НАГРАДЫ':'НАГОРОДИ','Баланс':'Баланс','ПАНЕЛЬ':'ПАНЕЛЬ','ВОЙТИ ЧЕРЕЗ STEAM':'УВІЙТИ ЧЕРЕЗ STEAM','ONLINE':'ОНЛАЙН',
    'Лучший дроп':'Найкращий дроп','Отобразится после первой игры':'З’явиться після першої гри','Лучший предмет в инвентаре':'Найкращий предмет в інвентарі','Выведено':'Виведено','предмета':'предмети','Кейсы':'Кейси','Апгрейды':'Апгрейди','Продажи':'Продажі',
    'ПРЕДМЕТЫ':'ПРЕДМЕТИ','ИСТОРИЯ':'ІСТОРІЯ','ПРОДАТЬ ВСЕ':'ПРОДАТИ ВСЕ','ОТМЕНА':'СКАСУВАТИ','Персональный купон':'Персональний купон','ПРИМЕНИТЬ':'ЗАСТОСУВАТИ',
    'ПОДДЕРЖКА':'ПІДТРИМКА','СОТРУДНИЧЕСТВО':'СПІВПРАЦЯ','НАВИГАЦИЯ':'НАВІГАЦІЯ','Инвентарь':'Інвентар','Награды':'Нагороди','ОБЩИЕ ПОЛОЖЕНИЯ':'ЗАГАЛЬНІ ПОЛОЖЕННЯ',
    'Пользовательское соглашение':'Угода користувача','Политика конфиденциальности':'Політика конфіденційності','Политика использования Cookie':'Політика Cookie','Политика AML/KYC':'Політика AML/KYC','Контакты':'Контакти',
    'Онлайн':'Онлайн','Всего игроков':'Усього гравців','Открыто кейсов':'Відкрито кейсів','Сделано апгрейдов':'Зроблено апгрейдів','Не аффилировано с Valve Corp.':'Не пов’язано з Valve Corp.',
    'Улучшай и собирай собственный инвентарь CS2.':'Покращуй і збирай власний інвентар CS2.','Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.':'Ігровий сервіс предметів CS2. Усі операції виконуються всередині сайту.',
    'Поддержка':'Підтримка','Настройки':'Налаштування','Выйти':'Вийти','Пополнить баланс':'Поповнити баланс','Уведомления':'Сповіщення','Закрыть':'Закрити','Уведомлений пока нет':'Сповіщень поки немає','Мы используем Cookie':'Ми використовуємо Cookie','Необходимые Cookie обеспечивают вход и безопасность. С вашего разрешения сайт также запомнит настройки интерфейса. Подробнее — в':'Необхідні Cookie забезпечують вхід і безпеку. З вашого дозволу сайт також запам’ятає налаштування інтерфейсу. Докладніше — у','Политике Cookie':'Політиці Cookie','Отклонить':'Відхилити','Разрешить':'Дозволити','Настройки Cookie':'Налаштування Cookie'
  },
  BE: {
    'КЕЙСЫ':'КЕЙСЫ','АПГРЕЙДЫ':'АПГРЭЙДЫ','НАГРАДЫ':'УЗНАГАРОДЫ','Баланс':'Баланс','ПАНЕЛЬ':'ПАНЭЛЬ','ВОЙТИ ЧЕРЕЗ STEAM':'УВАЙСЦІ ПРАЗ STEAM','ONLINE':'АНЛАЙН',
    'Лучший дроп':'Лепшы дроп','Отобразится после первой игры':'З’явіцца пасля першай гульні','Лучший предмет в инвентаре':'Лепшы прадмет у інвентары','Выведено':'Выведзена','предмета':'прадметы','Кейсы':'Кейсы','Апгрейды':'Апгрэйды','Продажи':'Продажы',
    'ПРЕДМЕТЫ':'ПРАДМЕТЫ','ИСТОРИЯ':'ГІСТОРЫЯ','ПРОДАТЬ ВСЕ':'ПРАДАЦЬ УСЁ','ОТМЕНА':'СКАСАВАЦЬ','Персональный купон':'Персанальны купон','ПРИМЕНИТЬ':'УЖЫЦЬ',
    'ПОДДЕРЖКА':'ПАДТРЫМКА','СОТРУДНИЧЕСТВО':'СУПРАЦОЎНІЦТВА','НАВИГАЦИЯ':'НАВІГАЦЫЯ','Инвентарь':'Інвентар','Награды':'Узнагароды','ОБЩИЕ ПОЛОЖЕНИЯ':'АГУЛЬНЫЯ ПАЛАЖЭННІ',
    'Пользовательское соглашение':'Карыстальніцкае пагадненне','Политика конфиденциальности':'Палітыка прыватнасці','Политика использования Cookie':'Палітыка Cookie','Политика AML/KYC':'Палітыка AML/KYC','Контакты':'Кантакты',
    'Онлайн':'Анлайн','Всего игроков':'Усяго гульцоў','Открыто кейсов':'Адкрыта кейсаў','Сделано апгрейдов':'Зроблена апгрэйдаў','Не аффилировано с Valve Corp.':'Не звязана з Valve Corp.',
    'Улучшай и собирай собственный инвентарь CS2.':'Паляпшай і збірай уласны інвентар CS2.','Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.':'Гульнявы сэрвіс прадметаў CS2. Усе аперацыі выконваюцца ўнутры сайта.',
    'Поддержка':'Падтрымка','Настройки':'Налады','Выйти':'Выйсці','Пополнить баланс':'Папоўніць баланс','Уведомления':'Апавяшчэнні','Закрыть':'Закрыць','Уведомлений пока нет':'Апавяшчэнняў пакуль няма','Мы используем Cookie':'Мы выкарыстоўваем Cookie','Необходимые Cookie обеспечивают вход и безопасность. С вашего разрешения сайт также запомнит настройки интерфейса. Подробнее — в':'Неабходныя Cookie забяспечваюць уваход і бяспеку. З вашага дазволу сайт таксама запомніць налады інтэрфейсу. Падрабязней — у','Политике Cookie':'Палітыцы Cookie','Отклонить':'Адхіліць','Разрешить':'Дазволіць','Настройки Cookie':'Налады Cookie'
  },
  KZ: {
    'КЕЙСЫ':'КЕЙСТЕР','АПГРЕЙДЫ':'АПГРЕЙДТЕР','НАГРАДЫ':'СЫЙЛЫҚТАР','Баланс':'Баланс','ПАНЕЛЬ':'ПАНЕЛЬ','ВОЙТИ ЧЕРЕЗ STEAM':'STEAM АРҚЫЛЫ КІРУ','ONLINE':'ОНЛАЙН',
    'Лучший дроп':'Үздік дроп','Отобразится после первой игры':'Бірінші ойыннан кейін көрінеді','Лучший предмет в инвентаре':'Инвентарьдағы үздік зат','Выведено':'Шығарылды','предмета':'зат','Кейсы':'Кейстер','Апгрейды':'Апгрейдтер','Продажи':'Сатылымдар',
    'ПРЕДМЕТЫ':'ЗАТТАР','ИСТОРИЯ':'ТАРИХ','ПРОДАТЬ ВСЕ':'БАРЛЫҒЫН САТУ','ОТМЕНА':'БАС ТАРТУ','Персональный купон':'Жеке купон','ПРИМЕНИТЬ':'ҚОЛДАНУ',
    'ПОДДЕРЖКА':'ҚОЛДАУ','СОТРУДНИЧЕСТВО':'ЫНТЫМАҚТАСТЫҚ','НАВИГАЦИЯ':'НАВИГАЦИЯ','Инвентарь':'Инвентарь','Награды':'Сыйлықтар','ОБЩИЕ ПОЛОЖЕНИЯ':'ЖАЛПЫ ЕРЕЖЕЛЕР',
    'Пользовательское соглашение':'Пайдаланушы келісімі','Политика конфиденциальности':'Құпиялылық саясаты','Политика использования Cookie':'Cookie саясаты','Политика AML/KYC':'AML/KYC саясаты','Контакты':'Байланыстар',
    'Онлайн':'Онлайн','Всего игроков':'Барлық ойыншылар','Открыто кейсов':'Ашылған кейстер','Сделано апгрейдов':'Жасалған апгрейдтер','Не аффилировано с Valve Corp.':'Valve Corp. компаниясымен байланысты емес.',
    'Улучшай и собирай собственный инвентарь CS2.':'CS2 инвентарыңды жақсартып, жина.','Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.':'CS2 заттарына арналған ойын сервисі. Барлық операциялар сайт ішінде орындалады.',
    'Поддержка':'Қолдау','Настройки':'Баптаулар','Выйти':'Шығу','Пополнить баланс':'Балансты толтыру','Уведомления':'Хабарландырулар','Закрыть':'Жабу','Уведомлений пока нет':'Хабарландырулар әзірге жоқ','Мы используем Cookie':'Біз Cookie файлдарын қолданамыз','Необходимые Cookie обеспечивают вход и безопасность. С вашего разрешения сайт также запомнит настройки интерфейса. Подробнее — в':'Қажетті Cookie файлдары кіру мен қауіпсіздікті қамтамасыз етеді. Рұқсатыңызбен сайт интерфейс баптауларын да есте сақтайды. Толығырақ —','Политике Cookie':'Cookie саясатында','Отклонить':'Қабылдамау','Разрешить':'Рұқсат ету','Настройки Cookie':'Cookie баптаулары'
  }
};
function translateDom(root) {
  const dictionary = UI_TRANSLATIONS[S.footerLang];
  document.documentElement.lang = ({ RU:'ru', EN:'en', UA:'uk', BE:'be', KZ:'kk' })[S.footerLang] || 'ru';
  if (!dictionary || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest('script,style')) continue;
    const raw = node.nodeValue;
    const value = raw.trim();
    if (dictionary[value]) node.nodeValue = raw.replace(value, dictionary[value]);
  }
  for (const element of root.querySelectorAll('[placeholder],[title],[aria-label]')) {
    for (const attr of ['placeholder','title','aria-label']) {
      const value = element.getAttribute(attr);
      if (value && dictionary[value]) element.setAttribute(attr, dictionary[value]);
    }
  }
}
function flagIcon(code) {
  const lang = LANGS.find(item => item.code === code);
  const emoji = lang ? lang.flag : '';
  const cc = FLAG_CODES[code] || String(code || '').toLowerCase();
  return `<span class="lang-flag" data-emoji="${emoji}"><img src="https://flagcdn.com/w40/${cc}.png" alt="${esc(code)}" loading="lazy" onerror="var f=this.parentElement;if(f)f.textContent=f.dataset.emoji||'';"></span>`;
}

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, match => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[match]));
const money = cents => cents == null
  ? '—'
  : (Number(cents) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const coinImg = '<img class="coin-mini" src="/chunks/coin.svg" alt="">';
const coinPrice = cents => cents == null ? '—' : `${money(cents)}${coinImg}`;
const safeColor = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#74ffca';
const rarityStyle = item => `style="--rarity:${safeColor(item?.rarityColor)}"`;
const bust = src => (typeof src === 'string' && src.includes('/static/items/') && !src.includes('?'))
  ? `${src}?v=2`
  : src;
const image = (src, alt = '', local = '') => src
  ? `<img src="${esc(bust(src))}" alt="${esc(alt)}" loading="lazy" decoding="async"${local ? ` data-fb="${esc(bust(local))}"` : ''} onerror="if(this.dataset.fb){const fb=this.dataset.fb;this.dataset.fb='';this.onerror=null;this.src=fb}else{this.onerror=null;this.classList.add('img-failed')}">`
  : '';
const avatarImage = user => user?.avatar
  ? `<img src="${esc(user.avatar)}" alt="${esc(user.name || 'Профиль')}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/chunks/logo.svg'">`
  : '<img src="/chunks/logo.svg" alt="Профиль">';
const art = item => `<div class="art" ${rarityStyle(item)}>${image(item?.icon || item?.itemIcon, item?.name || item?.itemName || '', item?.localIcon || '')}</div>`;

function coinIcon(size = '1.6rem', color = '#FFA800') {
  return `<svg class="coin-icon" style="width:${size};height:${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="1.6"/>
    <circle cx="12" cy="12" r="6.4" fill="none" stroke="${color}" stroke-width="1.4" opacity=".55"/>
    <path d="M12 7.8v8.4M9.6 9.6h3.2a1.7 1.7 0 0 1 0 3.4h-2.4a1.7 1.7 0 0 0 0 3.4h3.2" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function plusIcon(size = '2rem', color = '#FFA800') {
  return `<svg class="plus-icon" style="width:${size};height:${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function turboIcon(on) {
  return `<svg class="tool-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.4255 2.24994C16.2665 2.24994 16.8295 3.04794 16.6375 3.81294L16.5885 3.96594L14.4905 9.34994H17.0005C17.9855 9.34994 18.5325 10.4039 18.1005 11.2039L18.0005 11.3599L10.5305 21.4069C9.9905 22.1319 8.9095 21.6309 9.0035 20.8019L9.7885 13.8919H7.0005C6.0935 13.8919 5.5135 12.9679 5.8455 12.1569L5.8505 12.1459L9.7565 3.01794C9.85142 2.79082 10.0113 2.59678 10.216 2.46015C10.4208 2.32353 10.6613 2.2504 10.9075 2.24994H15.4255Z" fill="${on ? '#FFA800' : 'currentColor'}"/></svg>`;
}
function soundIcon(on) {
  const color = on ? '#83D8FF' : 'currentColor';
  const opacity = on ? 1 : .3;
  return `<svg class="tool-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="opacity:${opacity}">
    <path d="M13.5 4.05995C13.5 2.72395 11.884 2.05495 10.94 2.99995L6.44001 7.49995H4.50801C3.36701 7.49995 2.19001 8.16395 1.84801 9.40495C1.61598 10.2504 1.49893 11.1232 1.50001 12C1.50001 12.898 1.62101 13.768 1.85001 14.595C2.19101 15.835 3.36801 16.5 4.50901 16.5H6.43901L10.939 21C11.884 21.945 13.5 21.276 13.5 19.94V4.05995Z" fill="${color}"/>
    <path d="M18.584 5.10595C18.7246 4.9655 18.9153 4.88661 19.114 4.88661C19.3128 4.88661 19.5034 4.9655 19.644 5.10595C23.452 8.91295 23.452 15.086 19.644 18.894C19.5018 19.0264 19.3138 19.0986 19.1195 19.0951C18.9252 19.0917 18.7398 19.013 18.6024 18.8756C18.465 18.7382 18.3863 18.5528 18.3828 18.3585C18.3794 18.1642 18.4515 17.9761 18.584 17.834C19.3502 17.0679 19.958 16.1583 20.3727 15.1573C20.7873 14.1563 21.0007 13.0834 21.0007 12C21.0007 10.9165 20.7873 9.84358 20.3727 8.84257C19.958 7.84157 19.3502 6.93205 18.584 6.16595C18.4436 6.02533 18.3647 5.8347 18.3647 5.63595C18.3647 5.4372 18.4436 5.24658 18.584 5.10595Z" fill="${color}"/>
    <path d="M15.9322 7.75695C16.0019 7.68725 16.0846 7.63197 16.1756 7.59425C16.2666 7.55652 16.3642 7.53711 16.4627 7.53711C16.5612 7.53711 16.6588 7.55652 16.7498 7.59425C16.8409 7.63197 16.9236 7.68725 16.9932 7.75695C17.5505 8.31411 17.9925 8.97559 18.2941 9.70361C18.5957 10.4316 18.7509 11.2119 18.7509 11.9999C18.7509 12.788 18.5957 13.5683 18.2941 14.2963C17.9925 15.0243 17.5505 15.6858 16.9932 16.2429C16.8517 16.3795 16.6622 16.455 16.4656 16.4532C16.2689 16.4514 16.0808 16.3724 15.9418 16.2333C15.8029 16.0942 15.7241 15.9061 15.7224 15.7094C15.7208 15.5128 15.7965 15.3233 15.9332 15.1819C16.3511 14.7641 16.6825 14.268 16.9087 13.722C17.1348 13.1761 17.2512 12.5909 17.2512 11.9999C17.2512 11.409 17.1348 10.8238 16.9087 10.2779C16.6825 9.73189 16.3511 9.23581 15.9332 8.81795C15.7928 8.67732 15.7139 8.4867 15.7139 8.28795C15.7139 8.0892 15.7928 7.89857 15.9332 7.75795L15.9322 7.75695Z" fill="${color}"/>
  </svg>`;
}
function chevronIcon() {
  return `<svg class="chevron-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(json.error || `HTTP ${response.status}`);
  return json;
}

function shuffleCatalog(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function boot() {
  try {
    const [config, me, drops, online, catalog, cases, stats] = await Promise.all([
      api('/api/config'), api('/api/me'), api('/api/live-drops'), api('/api/online'),
      api('/api/catalog'), api('/api/cases'), api('/api/stats')
    ]);
    S.brand = config.brand;
    S.telegram = config.telegram;
    S.supportEmail=config.supportEmail||S.supportEmail;S.marketingEmail=config.marketingEmail||S.marketingEmail;S.siteBanner=config.banner||null;
    S.me = me;
    S.drops = drops;
    S.online = online.online;
    S.catalog = shuffleCatalog(catalog);
    S.cases = cases.cases || [];
    S.globalStats = stats;
    S.turbo = localStorage.getItem('keyser-turbo') === '1';
    S.cookieConsent = localStorage.getItem('keyser-cookie-consent');
    if (me.authenticated) {
      const [inventory, profile, weekly] = await Promise.all([api('/api/inventory'), api('/api/profile'), api('/api/cx-weekly').catch(()=>null)]);
      S.inventory = inventory.items || [];
      S.inventoryFeed = inventory.feed || inventory.items || [];
      S.profile = profile;
      S.cxWeekly = weekly;
    }
    const profileMatch=location.pathname.match(/^\/profile\/(\d+)\/?$/);
    if(profileMatch) await openPublicProfile(profileMatch[1],false); else render();
    listen();
    preloadArtwork();
  } catch (error) {
    console.error(error);
    render();
    toast('Не удалось загрузить данные', 'error');
  }
}

function preloadArtwork() {
  const urls = [];
  for (const item of (S.catalog || []).slice(0, 72)) if (item.icon) urls.push(bust(item.icon));
  for (const item of S.inventory || []) if (item.icon || item.itemIcon) urls.push(bust(item.icon || item.itemIcon));
  const seen = new Set();
  const unique = urls.filter(url => (seen.has(url) ? false : (seen.add(url), true)));
  let index = 0;
  const batch = () => {
    const end = Math.min(index + 6, unique.length);
    for (; index < end; index++) {
      const im = new Image();
      im.src = unique[index];
    }
    if (index < unique.length) setTimeout(batch, 120);
  };
  setTimeout(batch, 400);
}

function listen() {
  const events = new EventSource('/api/events');
  events.addEventListener('online', event => {
    S.online = JSON.parse(event.data).online;
    updateOnline();
  });
  events.addEventListener('drop', event => {
    const drop = JSON.parse(event.data);
    if (!S.drops.some(item => item.id === drop.id)) S.drops.unshift(drop);
    S.drops = S.drops.slice(0, 30);
    if (drop.source === 'reward' && S.me?.authenticated) {
      api('/api/cx-weekly').then(w=>{S.cxWeekly=w;render();}).catch(()=>{});
      refreshAccount();
    }
    if (S.page === 'rewards' || S.page === 'upgrade') render();
  });
  events.addEventListener('notify', event => {
    try {
      const n = JSON.parse(event.data);
      if (n.audience === 'guests' && S.me?.authenticated) return;
      if (n.audience === 'authenticated' && !S.me?.authenticated) return;
      if (n.audience === 'staff' && !['admin','support'].includes(S.me?.user?.role)) return;
      if (!S.notifications.some(x => x.id === n.id)) {
        S.notifications.unshift(n);
        S.notifications = S.notifications.slice(0, 20);
        S.unreadNotifications = (S.unreadNotifications || 0) + 1;
        render();
      }
    } catch (_) {}
  });
  fetch('/api/notifications').then(r => r.json()).then(data => {
    const list = (data && data.notifications) || [];
    const filtered = list.filter(n => {
      if (n.audience === 'guests' && S.me?.authenticated) return false;
      if (n.audience === 'authenticated' && !S.me?.authenticated) return false;
      if (n.audience === 'staff' && !['admin','support'].includes(S.me?.user?.role)) return false;
      return true;
    });
    S.notifications = filtered.slice(0, 20);
    const seen = notificationSeenIds();
    let unread = 0;
    for (const n of filtered) if (!seen.has(n.id)) unread++;
    S.unreadNotifications = unread;
    render();
  }).catch(() => {});
  document.addEventListener('click', event => {
    if (!document.body.contains(event.target)) return;
    let changed = false;
    if (!event.target.closest('.footer-language') && S.footerLangOpen) { S.footerLangOpen = false; changed = true; }
    if (!event.target.closest('.currency-select') && S.currencyOpen) { S.currencyOpen = false; changed = true; }
    if (!event.target.closest('.profile-sort') && S.sortOpen) { S.sortOpen = false; changed = true; }
    if (changed) render();
  });
}

function updateOnline() {
  const elements = document.querySelectorAll?.('[data-online],[data-footer-online]') || [];
  for (const element of elements) element.textContent = S.online;
}

function steamIcon() {
  return '<img class="steam-icon" src="/chunks/steamIcon.svg" alt="" aria-hidden="true">';
}

function telegramIcon() {
  return `<img class="chunk-icon telegram-icon" src="/chunks/telegramIcon.svg" alt="Telegram">`;
}
function onlineIcon() {
  const phase = -(Date.now() % 1600);
  return `<svg class="live-drop-online-icon" style="--online-phase:${phase}ms" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path class="live-drop-online-icon__stem" d="M13.998 9.9209C15.3785 9.92116 16.498 11.0403 16.498 12.4209C16.4979 13.4448 15.8813 14.3235 15 14.71V26H13V14.7119C12.1162 14.3266 11.4981 13.4466 11.498 12.4209C11.498 11.0402 12.6173 9.9209 13.998 9.9209Z" fill="#83D8FF"/>
    <path class="live-drop-online-icon__arc live-drop-online-icon__arc--primary" d="M9.74278 16.728C8.90367 15.8889 8.33222 14.8198 8.10071 13.6559C7.8692 12.492 7.98802 11.2856 8.44215 10.1893C8.89627 9.09289 9.66531 8.15582 10.652 7.49653C11.6387 6.83725 12.7987 6.48535 13.9854 6.48535C15.1721 6.48535 16.3321 6.83725 17.3188 7.49653C18.3055 8.15582 19.0746 9.09289 19.5287 10.1893C19.9828 11.2856 20.1016 12.492 19.8701 13.6559C19.6386 14.8198 19.0672 15.8889 18.2281 16.728" stroke="#83D8FF" stroke-width="1.5" stroke-linecap="round"/>
    <path class="live-drop-online-icon__arc live-drop-online-icon__arc--secondary" d="M7.21757 19.1531C5.88897 17.8245 4.98419 16.1317 4.61763 14.2889C4.25107 12.4461 4.4392 10.536 5.15823 8.80005C5.87727 7.06416 7.0949 5.58046 8.65717 4.53659C10.2194 3.49271 12.0562 2.93555 13.9351 2.93555C15.814 2.93555 17.6507 3.49271 19.213 4.53659C20.7753 5.58046 21.9929 7.06416 22.7119 8.80005C23.431 10.536 23.6191 12.4461 23.2525 14.2889C22.886 16.1317 21.9812 17.8245 20.6526 19.1531" stroke="#83D8FF" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function header() {
  const balance = S.me?.authenticated ? coinPrice(S.me.user.balanceCents) : null;
  return `<header class="top">
    <div class="brand"><img src="/chunks/logo.svg" alt=""><span>${esc(S.brand)}</span></div>
    <nav class="nav">
      <button class="${S.page === 'cases' || S.page === 'case' ? 'active' : ''}" onclick="go('cases')">КЕЙСЫ</button>
      <button class="${S.page === 'upgrade' ? 'active' : ''}" onclick="go('upgrade')">АПГРЕЙДЫ</button>
      <button class="${S.page === 'rewards' ? 'active' : ''}" onclick="go('rewards')">НАГРАДЫ</button>
      <button class="${S.page === 'steal' ? 'active' : ''}" onclick="go('steal')">STEAL</button>
    </nav>
    <div class="actions">
      <a class="telegram" href="${esc(S.telegram)}" target="_blank" rel="noopener">${telegramIcon()}</a>
      ${S.me?.authenticated ? `<div class="balance header-balance"><span>Баланс</span><b>${balance}</b><button onclick="openPayment()" aria-label="Пополнить баланс">+</button></div>` : ''}
      ${S.me?.authenticated && (S.me.user.role === 'admin' || S.me.user.role === 'support')
        ? `<a class="admin-link ${S.me.user.role === 'support' ? 'is-support' : ''}" href="/admin" title="${S.me.user.role === 'support' ? 'Панель поддержки' : 'Админ-панель'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 3v5.4c0 4.4-3 8.3-7.5 9.6-4.5-1.3-7.5-5.2-7.5-9.6V6L12 3Z"/><path d="M9.2 12.2l2 2 3.6-3.9"/></svg><span>ПАНЕЛЬ</span></a>` : ''}
      ${S.me?.authenticated
        ? `<button id="notification-trigger" class="notification-trigger" type="button" onclick="openNotifications()" aria-label="Уведомления" style="position:relative"><img src="/chunks/notificationIcon.svg" alt="">${S.unreadNotifications ? `<span style="position:absolute;top:4px;right:4px;background:#eb4b4b;color:#fff;font-size:10px;font-weight:800;min-width:16px;height:16px;border-radius:8px;display:grid;place-items:center;padding:0 3px">${S.unreadNotifications > 9 ? '9+' : S.unreadNotifications}</span>` : ''}</button>
           <button id="profile-trigger" class="profile-trigger" type="button" onclick="go('profile')" aria-label="${esc(S.me.user.name || 'Личный профиль')}">${avatarImage(S.me.user)}</button>`
        : `<button class="steam auth-login-button" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>`}
    </div>
  </header>`;
}

function sideItem(item) {
  const player = item.userId ? { id:item.userId, name:item.userName, avatar:item.userAvatar } : S.me?.user;
  const avatar = player?.avatar ? `<img src="${esc(player.avatar)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/chunks/logo.svg'">` : '<img src="/chunks/logo.svg" alt="">';
  const fullName=String(item.name||item.itemName||'');const [weapon,skin='']=fullName.split(' | ');
  const normalized={...item,name:fullName,weapon:item.weapon||weapon,skin:item.skin||skin,icon:item.icon||item.itemIcon,priceCents:item.priceCents,rarityColor:item.rarityColor||'#83d8ff'};
  const clickable=Number(player?.id)>0;
  return `<div class="side-item skin-item${clickable?' profile-clickable':''}" ${rarityStyle(normalized)} ${clickable?`role="button" tabindex="0" onclick="openPublicProfile(${Number(player.id)})" onkeydown="if(event.key==='Enter')openPublicProfile(${Number(player.id)})" title="Открыть профиль ${esc(player.name||'игрока')}"`:''}>
    ${art(normalized)}<div class="side-item-copy"><div class="item-name-row"><span class="item-name">${esc(normalized.weapon||fullName)}</span></div><div class="item-skin">${esc(normalized.skin)}</div><div class="item-rarity">${esc(normalized.rarity||'')}</div></div>
    <div class="side-player">${avatar}<span>${esc(player?.name||'Игрок')}</span></div><i class="skin-rarity-line"></i>
  </div>`;
}

function sidebar() {
  const feed = (S.drops && S.drops.length) ? S.drops : ((S.inventoryFeed && S.inventoryFeed.length) ? S.inventoryFeed : S.inventory);
  const items = S.tab === 'hot' ? feed.filter(item => Number(item.rarityRank) >= 4) : feed;
  return `<aside class="sidebar">
    <div class="side-head">
      <div class="site-online">
        ${onlineIcon()}<b data-online>${S.online}</b><span>ONLINE</span>
      </div>
      <div class="side-tabs">
        <button class="${S.tab === 'inventory' ? 'active' : ''}" onclick="sideTab('inventory')" title="Предметы сайта">▦</button>
        <button class="${S.tab === 'hot' ? 'active' : ''}" onclick="sideTab('hot')" title="От засекреченного">🔥</button>
      </div>
    </div>
    <div class="side-list">
      ${items.length
        ? items.map(sideItem).join('')
        : `<div class="side-empty">${S.me?.authenticated
            ? (S.tab === 'hot' ? 'Нет предметов редкости «Засекреченное» или выше' : 'Откройте кейс — предмет появится здесь')
            : 'Авторизуйтесь, чтобы увидеть инвентарь сайта'}</div>`}
    </div>
  </aside>`;
}

function priceTag(item) {
  return `<span class="skin-price">${coinPrice(item.priceCents)}</span>`;
}
function rarityLine() {
  return '<i class="skin-rarity-line"></i>';
}
function skinCard(item, options = {}) {
  const tag = options.button ? 'button' : 'div';
  const attrs = options.onclick ? ` onclick="${options.onclick}"` : '';
  const className = options.className || 'card';
  return `<${tag} class="${className} skin-card" ${rarityStyle(item)}${attrs}>
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>${rarityLine()}
  </${tag}>`;
}
function pickCard(item, side) {
  const id = side === 'from' ? item.assetid : item.catalogId;
  return `<button class="pick-card skin-card" ${rarityStyle(item)} onclick="choose('${esc(id)}','${side}')">
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name)}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}
  </button>`;
}
function bigSelected(item) {
  return `<div class="selected-big skin-item" ${rarityStyle(item)}>
    <div class="selected-big-art">${image(item?.icon || item?.itemIcon, item?.name || item?.itemName || '', item?.localIcon || '')}</div>
    <div class="selected-big-info">
      <strong>${esc(item.weapon || item.name)}</strong>
      <span>${esc(item.skin || item.marketName || '')}</span>
      <small>${esc(item.rarity || '')}</small>
      <div class="selected-big-price"><b>${coinPrice(item.priceCents)}</b>${item.wear ? `<em>${esc(item.wear)}</em>` : ''}</div>
    </div>
  </div>`;
}

function loginRequired(title, text) {
  return `<div class="login-box"><h1>${esc(title)}</h1><p class="sub">${esc(text)}</p>
    <button class="steam" style="margin:20px auto 0" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>
  </div>`;
}

function upgradePage() {
  if (!S.me?.authenticated) return loginRequired('АПГРЕЙДЫ', 'Войдите в аккаунт. Для апгрейда используются только предметы из инвентаря сайта.');
  const inventory = S.inventory;
  const baseValue = (S.from ? Number(S.from.priceCents) : 0) + S.addBalance;
  const minimumPrice = S.from ? boostMinimumPrice(baseValue, S.boost) : 0;
  const query = S.targetSearch.trim().toLowerCase();

  const userMin = S.targetMin === '' ? 0 : Number(S.targetMin) * 100;
  const minTarget = Math.max(minimumPrice, Number.isFinite(userMin) ? userMin : 0);
  const maxTarget = S.targetMax === '' ? Infinity : Number(S.targetMax) * 100;
  const targets = S.catalog.filter(item => item.priceCents >= minTarget && item.priceCents <= maxTarget && (!query || `${item.weapon} ${item.skin} ${item.name}`.toLowerCase().includes(query)));
  const pageSize = 16;
  let pageCount = Math.max(1, Math.ceil(targets.length / pageSize));
  if (S.targetPage > pageCount) S.targetPage = pageCount;
  const pageTargets = targets.slice((S.targetPage - 1) * pageSize, S.targetPage * pageSize);
  const chance = clampChance(S.chance);
  const chanceText = formatChance(S.chance);
  const boostOptions = [['30%', 30], ['50%', 50], ['75%', 75], ['x2', 200], ['x5', 500], ['x10', 1000]];
  const boostButtons = boostOptions.map(([label, value]) => `<button class="${S.boost === value ? 'active' : ''}" ${S.from ? '' : 'disabled'} onclick="setBoost(${value})">${label}</button>`).join('');
  const balanceCents = Number(S.me.user.balanceCents || 0);
  const balanceR = (balanceCents / 100).toFixed(2);
  const addR = (S.addBalance / 100).toFixed(2);
  const rangeProgress = balanceCents > 0 ? Math.min(100, S.addBalance / balanceCents * 100) : 0;
  const soundOn = localStorage.getItem('keyser-sound') !== '0';
  const turboOn = S.turbo;
  const turboLabel = turboOn ? 'Быстрый режим включён' : 'Быстрый режим выключен';
  const fromLabel = S.from ? `${money(S.from.priceCents)}${S.addBalance ? ` + ${money(S.addBalance)}` : ''}` : '';
  const leftEmpty = '<div class="selected-big empty">Выбранный предмет появится здесь</div>';
  return `<section class="upgrid">
      <div class="source-col">
        <div class="panel-tools">
          <button type="button" class="turbo-toggle ${turboOn ? 'active' : ''}" aria-label="${turboLabel}" aria-pressed="${turboOn}" title="${turboLabel}" onclick="toggleTurbo()">${turboIcon(turboOn)}</button>
          <button type="button" aria-label="Sound" aria-pressed="${soundOn}" title="Звук" onclick="toggleSoundBtn()">${soundIcon(soundOn)}</button>
        </div>
        <div class="panel"><div class="title">ВЫБЕРИТЕ <b>&nbsp;ПРЕДМЕТ ДЛЯ ИСПОЛЬЗОВАНИЯ</b></div>
          ${S.from ? bigSelected(S.from) : leftEmpty}
        </div>
        <div class="add-balance-bar">
          <div class="add-balance-title"><img class="add-balance-coin" src="/chunks/coin.svg" alt=""><span>Добавить баланс</span></div>
          <div class="add-balance-mid"><div class="ab-value"><b>${money(S.addBalance)}</b></div>
            <input class="add-balance-range" type="range" min="0" max="${balanceR}" step="0.01" value="${addR}" style="--range-progress:${rangeProgress}%" oninput="setAddBalance(this.value)" ${balanceCents > 0 ? '' : 'disabled'}>
          </div>
          <div class="add-balance-max"><span>Макс.</span><div><b>${money(balanceCents)}</b></div></div>
        </div>
      </div>
      <div class="wheelbox${S.spinning ? ' is-spinning' : ''}">
        <div class="wheelhead"><span>ШАНС АПГРЕЙДА</span><b>${chanceText}</b></div>
        <div class="wheel-stage"><div class="wheel${S.spinning ? ' is-spinning' : ''}" style="--chance:${chance}%;--chance-half:${(chance / 2).toFixed(3)}%">
          <img class="spinner-ring spinner-ring-2" src="/chunks/spinner-group-2.webp" alt="" aria-hidden="true">
          <img class="spinner-ring spinner-ring-1" src="/chunks/spinner-group-1.webp" alt="" aria-hidden="true">
          <img class="spinner-center" src="/chunks/spinner-group-3.webp" alt="" aria-hidden="true">
          <img class="spinner-logo" src="/chunks/logo.svg" alt="" aria-hidden="true">
          <div class="wheelcenter"><strong>${chanceText}</strong><span>${S.chance == null ? 'выберите предметы' : 'шанс апгрейда'}</span></div>
        </div><div class="pointer-orbit" style="--angle:${Number(S.pointerAngle) || 0}deg" aria-hidden="true"><img class="pointer" src="/chunks/spinner-arrow.webp" alt=""></div></div>
        <button class="upgrade" ${!S.from || !S.to || S.spinning ? 'disabled' : ''} onclick="upgrade()">
          <img class="upgrade-icon" src="/chunks/upgrade.svg" alt="">${S.spinning ? 'АПГРЕЙД...' : 'АПГРЕЙД'}
        </button>
        <div class="under">${S.from && S.to ? `${fromLabel} → ${money(S.to.priceCents)}` : S.from ? `Цель от ${money(minimumPrice)}` : 'Выберите предмет слева и цель справа'}</div>
      </div>
      <div class="target-col">
        <div class="panel target-preview-panel"><div class="title">ВЫБРАННАЯ <b>&nbsp;ЦЕЛЬ АПГРЕЙДА</b></div>
          ${S.to ? bigSelected(S.to) : leftEmpty}
        </div>
        <div class="boost-row"><div class="boost-label">УВЕЛИЧИТЬ СТОИМОСТЬ ЦЕЛИ</div><div class="boost-buttons">${boostButtons}</div></div>
      </div>
    </section>
    <section class="lower upgrade-lists">
      <div class="panel upgrade-list-panel"><div class="upgrade-list-head"><div><img src="/chunks/inventary.svg" alt=""><b>МОИ ПРЕДМЕТЫ</b></div></div><div class="upgrade-list-body">${inventory.length ? `<div class="grid upgrade-items-grid">${inventory.map(item => skinCard(item, { button: true, onclick: `choose('${item.assetid}','from')` })).join('')}</div>` : '<div class="upgrade-list-empty"><strong>Ваш инвентарь пуст</strong><span>Открой свой первый кейс</span><button onclick="go(\'cases\')"><img src="/chunks/cases.svg" alt="">ОТКРЫТЬ КЕЙС</button></div>'}</div></div>
      <div class="panel upgrade-list-panel"><div class="upgrade-list-head"><div><img src="/chunks/upgrade.svg" alt=""><b>ВЫБРАТЬ ПРЕДМЕТ</b></div><div class="target-filters"><input id="target-min" value="${esc(S.targetMin)}" placeholder="От" inputmode="decimal" oninput="applyTargetFilters()"><input id="target-max" value="${esc(S.targetMax)}" placeholder="До" inputmode="decimal" oninput="applyTargetFilters()"><input id="target-search" value="${esc(S.targetSearch)}" placeholder="Поиск" oninput="applyTargetFilters()"><button onclick="applyTargetFilters()" aria-label="Поиск">⌕</button></div></div><div class="upgrade-list-body">${pageTargets.length ? `<div class="grid upgrade-items-grid target-items-grid">${pageTargets.map(item => skinCard(item, { button: true, onclick: `choose('${item.catalogId}','to')` })).join('')}</div>` : '<div class="upgrade-list-empty"><strong>Предметы не найдены</strong><span>Измените фильтры или выберите исходный предмет</span></div>'}${pageCount > 1 ? `<div class="target-pager"><button ${S.targetPage <= 1 ? 'disabled' : ''} onclick="setTargetPage(${S.targetPage - 1})" aria-label="Предыдущая страница">‹</button><button ${S.targetPage >= pageCount ? 'disabled' : ''} onclick="setTargetPage(${S.targetPage + 1})" aria-label="Следующая страница">›</button></div>` : ''}</div></div>
    </section>`;
}
function inventoryItemCard(item) {
  const selected = S.sellMode && S.sellSelected.has(String(item.assetid));
  const selectable = S.sellMode
    ? `<button class="sell-check ${selected ? 'on' : ''}" onclick="toggleSellItem('${item.assetid}')" aria-label="Выбрать предмет">${selected ? '✓' : ''}</button>`
    : '';
  return `<div class="inventory-item-wrap ${S.sellMode ? 'sell-mode' : ''} ${selected ? 'sell-picked' : ''}">${selectable}${skinCard(item, S.sellMode ? { onclick: `toggleSellItem('${item.assetid}')` } : {})}<div class="inventory-actions"><button class="sell-item" onclick="sellItem('${item.assetid}')">ПРОДАТЬ ${money(item.priceCents)}</button><button class="upgrade-item" onclick="sendToUpgrade('${item.assetid}')">В АПГРЕЙД</button></div></div>`;
}
function sellBar() {
  if (!S.sellMode) return '';
  const count = S.sellSelected.size;
  const total = S.inventory.filter(item => S.sellSelected.has(String(item.assetid))).reduce((sum, item) => sum + Number(item.priceCents || 0), 0);
  return `<div class="sell-bar">
    <button class="sell-bar-all" onclick="sellSelectAll()">${count === S.inventory.length ? 'СНЯТЬ ВСЕ' : 'ВЫБРАТЬ ВСЕ'}</button>
    <span class="sell-bar-info">Выбрано: <b>${count}</b> на <b>${coinPrice(total)}</b></span>
    <button class="sell-bar-confirm" ${count ? '' : 'disabled'} onclick="sellSelectedItems()">ПРОДАТЬ ВЫБРАННЫЕ</button>
  </div>`;
}
function toggleSellMode() {
  S.sellMode = !S.sellMode;
  S.sellSelected.clear();
  render();
}
function toggleSellItem(id) {
  const key = String(id);
  if (S.sellSelected.has(key)) S.sellSelected.delete(key);
  else S.sellSelected.add(key);
  render();
}
function sellSelectAll() {
  if (S.sellSelected.size === S.inventory.length) S.sellSelected.clear();
  else S.inventory.forEach(item => S.sellSelected.add(String(item.assetid)));
  render();
}
async function sellSelectedItems() {
  if (!S.sellSelected.size) return;
  const items = S.inventory.filter(item => S.sellSelected.has(String(item.assetid)));
  const total = items.reduce((sum, item) => sum + Number(item.priceCents || 0), 0);
  if (!await customConfirm(`Продать выбранные предметы (${items.length} шт.) за ${money(total)}?`, { title: 'Продажа предметов', confirmText: 'Продать', danger: true })) return;
  let sold = 0;
  let amount = 0;
  for (const item of items) {
    try {
      const result = await api(`/api/inventory/${encodeURIComponent(item.assetid)}/sell`, { method: 'POST' });
      sold++;
      amount += Number(result.amountCents || 0);
    } catch (error) {  }
  }
  S.sellMode = false;
  S.sellSelected.clear();
  await refreshAccount();
  S.from = null; S.to = null; S.chance = null;
  render();
  toast(sold ? `Продано: ${sold} шт. на ${money(amount)}` : 'Не удалось продать', sold ? 'success' : 'error');
}
function cxSellAllBar() {
  if (!S.sellAllConfirm) return '';
  const total = S.inventory.reduce((s, it) => s + Number(it.priceCents || 0), 0);
  const cnt = S.inventory.length;
  return `<div class="cx-sell-all-confirm">
    <span>Продать все предметы (<b>${cnt}</b> шт.) и получить <b>${coinPrice(total)}</b>?</span>
    <button class="cx-sa-cancel" onclick="cxCancelSellAll()">ОТМЕНА</button>
    <button class="cx-sa-ok" onclick="cxDoSellAll()">ПОДТВЕРДИТЬ</button>
  </div>`;
}
function cxAskSellAll() {
  if (!S.inventory.length) return toast('Инвентарь пуст', 'error');
  S.sellAllConfirm = true;
  S.sellMode = false;
  S.sellSelected.clear();
  render();
}
function cxCancelSellAll() { S.sellAllConfirm = false; render(); }
async function cxDoSellAll() {
  try {
    const r = await api('/api/cx-sell-all', { method: 'POST' });
    S.sellAllConfirm = false;
    await refreshAccount();
    S.from = null; S.to = null; S.chance = null;
    render();
    toast(`Продано ${r.count} шт. на ${money(r.totalCents)}`, 'success');
  } catch (e) { toast(e.message || 'Ошибка', 'error'); }
}
function inventoryPage() {
  if (!S.me?.authenticated) return loginRequired('ИНВЕНТАРЬ', 'Войдите через Steam, чтобы увидеть предметы, полученные на сайте. Steam-инвентарь сюда не загружается.');
  if (!S.inventory.length) return `<h1 class="page-title">Инвентарь сайта</h1><p class="sub">Здесь хранятся только предметы из кейсов и апгрейдов сайта.<lass="sub">Здесь хранятся только предметы из кейсов и апгрейдов сайта.</p>
    <div class="panel empty"><h2>У вас нет предметов</h2><p>Откройте стартовый кейс — выпавший скин появится здесь.</p><button class="cta" onclick="go('cases')">ОТКРЫТЬ КЕЙС</button></div>`;
  return `<h1 class="page-title">Инвентарь сайта</h1><p class="sub">Только предметы, полученные из кейсов и апгрейдов. Инвентарь Steam не используется.</p>
    <div class="panel inventory-panel"><div class="grid inventory-grid">${S.inventory.map(inventoryItemCard).join('')}</div></div>`;
}

function caseContents(caseData) {
  return caseData.contents.map(item => skinCard(item, { className: 'case-content-item' })).join('');
}
let caseDropFor = null;
function caseIcon(caseData, large = false) {
  if (caseData.image) {
    return `<div class="case-visual case-visual-img ${large ? 'case-visual-large' : ''}"><img src="${esc(caseData.image)}" alt="${esc(caseData.name)}" loading="lazy" draggable="false"></div>`;
  }
  return `<div class="case-visual ${large ? 'case-visual-large' : ''}"><div class="case-cube ${caseData.id === 'starter' ? 'case-cube-starter' : ''}"><i></i><i></i><i></i></div></div>`;
}
function playCaseDrop() {
  const fx = document.getElementById('cx-case-drop-fx');
  const src = document.querySelector('.case-detail .case-visual img');
  if (S.page !== 'case' || !S.activeCase) {
    if (fx) fx.remove();
    return;
  }
  if (fx) {
    if (src) src.style.visibility = 'hidden';
    return;
  }
  if (caseDropFor === S.activeCase || !src) return;
  caseDropFor = S.activeCase;
  const r = src.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) {
    caseDropFor = null;
    requestAnimationFrame(playCaseDrop);
    return;
  }
  src.style.visibility = 'hidden';
  const ghost = document.createElement('img');
  ghost.id = 'cx-case-drop-fx';
  ghost.src = src.currentSrc || src.src;
  ghost.alt = '';
  ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  document.body.appendChild(ghost);
  void ghost.offsetWidth;
  ghost.classList.add('cx-case-dropin');
  ghost.addEventListener('animationend', () => {
    ghost.remove();
    const live = document.querySelector('.case-detail .case-visual img');
    if (live) live.style.visibility = '';
  }, { once: true });
}

const CASE_SHOP_SECTIONS = [
 {
  "title": "NEW",
  "ids": [
   "minion-case",
   "summer-set",
   "visions-shadows-case",
   "serpent-case",
   "zeiss-laboratory",
   "tactical-monolith",
   "operation-quarantine",
   "gta-vi",
   "sunset-club",
   "golden-hour"
  ]
 },
 {
  "title": "Цветная коллекция",
  "ids": [
   "black-and-white-case",
   "green-case",
   "yellow-case",
   "blue-case",
   "red-case"
  ]
 },
 {
  "title": "Limited",
  "ids": [
   "cs-warzone-case",
   "operation-alpha-case",
   "aurora-2-case",
   "crystal-2-case",
   "aurora-case"
  ]
 },
 {
  "title": "Наши сборки",
  "ids": [
   "magnum-case",
   "exhibition-case",
   "gauntlet-case",
   "zenith-case",
   "cache",
   "premium-cache",
   "new-gloves"
  ]
 },
 {
  "title": "Специальная коллекция",
  "ids": [
   "rift-case",
   "pro-league-2013-case",
   "operation-iron-claw-case",
   "megawatt-case",
   "operation-inferno-weapon-case"
  ]
 },
 {
  "title": "Бомж кейсы",
  "ids": [
   "cleaver-case",
   "blowback-case",
   "sigma-2-case",
   "sigma-case",
   "eclipse-case"
  ]
 },
 {
  "title": "Редкость",
  "ids": [
   "milspec",
   "restricted",
   "classified",
   "covert",
   "knife"
  ]
 },
 {
  "title": "Люкс",
  "ids": [
   "ultraviolet",
   "lore",
   "crimson-web",
   "doppler",
   "tiger-tooth",
   "fade-case",
   "sapphire-case",
   "emerald-case",
   "ruby-case",
   "black-pearl-case"
  ]
 },
 {
  "title": "Премиум",
  "ids": [
   "premium-case-1",
   "premium-case-2",
   "premium-case-3",
   "premium-case-4",
   "premium-case-5"
  ]
 },
 {
  "title": "Ножевой кейс",
  "ids": [
   "skeleton-knife",
   "stiletto-knife",
   "m9-bayonet",
   "karambit",
   "butterfly-knife"
  ]
 },
 {
  "title": "Арсенал",
  "ids": [
   "charm",
   "mac-10",
   "mp9",
   "p90",
   "ssg-08",
   "usp-s",
   "glock-18",
   "music-kit",
   "desert-eagle",
   "m4a1-s",
   "m4a4",
   "awp",
   "ak-47",
   "agent-case",
   "gloves"
  ]
 },
 {
  "title": "Кейсы CS2",
  "ids": [
   "genesis",
   "sealed-dead-hand",
   "snakebite-case",
   "revolution-case",
   "clutch-case",
   "recoil-case",
   "fracture-case",
   "falchion-case",
   "danger-zone-case",
   "gallery-case",
   "prisma-case",
   "prisma-2-case",
   "horizon-case",
   "kilowatt-case",
   "dreams-nightmares-case",
   "cs20-case",
   "shadow-case",
   "shattered-web-case",
   "operation-phoenix-weapon-case",
   "operation-riptide-case",
   "revolver-case",
   "operation-wildfire-case",
   "spectrum-2-case",
   "spectrum-case",
   "operation-broken-fang-case",
   "operation-hydra-case"
  ]
 },
 {
  "title": "Коллекции",
  "ids": [
   "the-ascent-collection",
   "the-boreal-collection",
   "the-radiant-collection",
   "the-harlequin-collection",
   "the-2018-inferno-collection",
   "the-achroma-collection",
   "the-train-2025-collection",
   "the-graphic-design-collection",
   "the-havoc-collection",
   "the-anubis-collection",
   "the-ancient-collection",
   "the-2021-vertigo-collection",
   "the-control-collection",
   "the-2021-dust-2-collection",
   "the-canals-collection",
   "the-st-marc-collection"
  ]
 }
];
const CASE_SECTION_BY_ID = new Map();
for (const section of CASE_SHOP_SECTIONS) for (const id of section.ids) CASE_SECTION_BY_ID.set(id, section.title);
const CASE_NEW_IDS = new Set(["minion-case","summer-set","sunset-club","golden-hour"]);

function casePriceTag(caseData) {
  if (!caseData.priceCents) return '<span class="case-card-free">БЕСПЛАТНО</span>';
  const coins = Math.round(Number(caseData.priceCents) / 100);
  return `<span class="case-card-price"><b>${coins.toLocaleString('ru-RU')}</b>${coinImg}</span>`;
}
function caseShopCard(caseData, index) {
  const isNew = CASE_NEW_IDS.has(caseData.id);
  return `<article class="case-shop-card ${isNew ? 'case-card-new' : ''}" style="--i:${index}" role="button" tabindex="0"
      onclick="selectCase('${esc(caseData.id)}')"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCase('${esc(caseData.id)}')}">
      ${isNew ? '<span class="case-card-badge">NEW</span>' : ''}
      <div class="case-card-media">${caseIcon(caseData)}</div>
      <div class="case-card-info"><h3 class="case-card-name">${esc(caseData.name)}</h3>${casePriceTag(caseData)}</div>
    </article>`;
}
function casesPage() {
  const byId = new Map(S.cases.map(item => [item.id, item]));
  const used = new Set();
  let index = 0;
  const parts = [];
  for (const section of CASE_SHOP_SECTIONS) {
    const cards = [];
    for (const id of section.ids) {
      const caseData = byId.get(id);
      if (!caseData) continue;
      used.add(id);
      cards.push(caseShopCard(caseData, index++));
    }
    if (cards.length) {
      parts.push(`<section class="case-shop-section" style="--i:${index}"><h2 class="case-shop-heading"><span>${esc(section.title)}</span><i></i></h2><div class="case-shop-grid">${cards.join('')}</div></section>`);
    }
  }
  const rest = S.cases.filter(item => !used.has(item.id));
  if (rest.length) {
    parts.push(`<section class="case-shop-section" style="--i:${index}"><h2 class="case-shop-heading"><span>Другие кейсы</span><i></i></h2><div class="case-shop-grid">${rest.map(item => caseShopCard(item, index++)).join('')}</div></section>`);
  }
  if (!parts.length) return '<div class="empty"><h2>Кейсы скоро появятся</h2></div>';
  return `<div class="case-shop">${parts.join('')}</div>`;
}
function rouletteCard(item) {
  return `<div class="roulette-card" ${rarityStyle(item)}>${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}<strong>${esc(item.weapon || item.name)}</strong><small>${esc(item.skin || item.marketName || '')}</small>${rarityLine()}</div>`;
}
function caseDetailPage() {
  if (!S.me?.authenticated) return loginRequired('КЕЙС', 'Войдите через Steam, чтобы открыть кейс.');
  const caseData = S.cases.find(item => item.id === S.activeCase) || S.cases[0];
  if (!caseData) return '<div class="empty"><h2>Кейс не найден</h2></div>';
  const spinning = S.opening === caseData.id;
  const insufficient = caseData.priceCents > Number(S.me.user.balanceCents);
  const disabled = !!S.opening || !caseData.available || insufficient;
  const missingCents = caseData.priceCents - Number(S.me.user.balanceCents);
  const buyButton = !insufficient
    ? `<button class="case-buy-button" ${disabled ? 'disabled' : ''} onclick="openCase('${esc(caseData.id)}')">${S.opening ? 'ОТКРЫВАЕМ...' : !caseData.available ? 'УЖЕ ОТКРЫТ' : caseData.priceCents ? `КУПИТЬ ЗА ${coinPrice(caseData.priceCents)}` : 'КУПИТЬ БЕСПЛАТНО'}</button>`
    : `<div class="insufficient-box">
        <div class="insufficient-head"><span>Не хватает</span><b>${money(missingCents)}</b><img class="insufficient-coin" src="/chunks/coin.svg" alt="" aria-hidden="true"></div>
        <span class="insufficient-text">Недостаточно средств для открытия кейса</span>
        <button type="button" class="insufficient-btn" onclick="openPayment()">Пополнить баланс${plusIcon('2.2rem')}</button>
      </div>`;
  const caseVisual = spinning ? '' : caseIcon(caseData, true);
  const buyBlock = S.caseResult ? '' : buyButton;
  const roulette = S.rouletteItems.length ? `<div class="case-roulette"><i class="roulette-pointer"></i><div class="case-roll-track">${S.rouletteItems.map(rouletteCard).join('')}</div></div>` : '';
  const result = S.caseResult && !S.caseReveal ? `<div class="case-result cx-result-clean"><span>ВЫПАЛО</span>${skinCard(S.caseResult, { className: 'case-result-item' })}<button class="cx-res-up" onclick="sendToUpgrade('${S.caseResult.assetid}')">В АПГРЕЙД</button><button class="cx-res-inv" onclick="openInventory()">В ИНВЕНТАРЬ</button></div>` : '';
  return `<button class="case-back" onclick="go('cases')">← ВСЕ КЕЙСЫ</button>
    <section class="case-detail ${spinning ? 'cx-case-spinning' : ''}">
      <h1>${esc(caseData.name)}</h1>${caseVisual}
      ${buyBlock}
      ${roulette}${result}
      <div class="case-loot"><h2>СОДЕРЖИМОЕ</h2><div class="case-items case-items-detail">${caseContents(caseData)}</div></div>
    </section>`;
}

function cxWeeklySlot(item, claimed, locked, canPick) {
  if (locked) {
    return `<div class="weekly-slot cx-weekly-slot cx-locked"><div class="cx-slot-lock"><img src="/chunks/question.svg" alt="" style="width:56px;height:94px;object-fit:contain;opacity:.45"></div></div>`;
  }
  const price = `<span class="skin-price">${coinPrice(item.priceCents)}</span>`;
  const artEl = art(item);
  const claimBtn = (!claimed && canPick) ? `<button class="cx-slot-pick" onclick="cxClaimWeekly('${esc(item.catalogId)}')">ЗАБРАТЬ</button>` : '';
  const claimBadge = claimed ? `<span class="cx-slot-claimed">ЗАБРАНО</span>` : '';
  const wearTag = item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : '';
  return `<div class="weekly-slot cx-weekly-slot cx-skin-slot ${claimed?'cx-claimed':''}" ${rarityStyle(item)}>
    ${price}${wearTag}${artEl}
    <strong>${esc(item.weapon||item.name)}</strong>
    <small>${esc(item.skin||'')}</small>
    <span class="rarity-name">${esc(item.rarity||'')}</span>${rarityLine()}
    ${claimBadge}${claimBtn}
  </div>`;
}
function weeklySlot() {
  return cxWeeklySlot(null, false, true, false);
}
function topDropCard(drop) {
  const item = { name: drop.itemName, weapon: String(drop.itemName).split(' | ')[0], skin: String(drop.itemName).split(' | ')[1] || '', icon: drop.itemIcon, localIcon: drop.localIcon || '', priceCents: drop.priceCents, rarity: drop.rarity, rarityColor: drop.rarityColor };
  return `<div class="top-drop-card skin-item" ${rarityStyle(item)}>${priceTag(item)}${art(item)}<strong>${esc(item.weapon)}</strong><small>${esc(item.skin)}</small>${rarityLine()}</div>`;
}
function rewardsPage() {
  const rewardDrops = S.drops.filter(drop => drop.source === 'reward');
  const w = S.cxWeekly;
  const authed = !!(S.me && S.me.authenticated);
  let slotsHtml = '';
  let copyHtml = '';
  if (!authed) {
    slotsHtml = [0,1,2,3].map(()=>cxWeeklySlot(null,false,true,false)).join('');
    copyHtml = `<h2>ЕЖЕНЕДЕЛЬНЫЙ НАБОР</h2>
      <div class="weekly-ribbon"><span>НУЖНА АВТОРИЗАЦИЯ</span></div>
      <p>Войдите через Steam и пополните баланс, чтобы разблокировать набор.<br>Вы сможете забрать несколько скинов из представленных. Обновление раз в 7 дней.</p>
      <button class="weekly-button" onclick="login()">АВТОРИЗОВАТЬСЯ</button>`;
  } else if (!w) {
    slotsHtml = [0,1,2,3].map(()=>cxWeeklySlot(null,false,true,false)).join('');
    copyHtml = `<h2>ЕЖЕНЕДЕЛЬНЫЙ НАБОР</h2>
      <div class="weekly-ribbon"><span>ЗАГРУЗКА</span></div><p>Загружаем награды...</p>`;
  } else if (!w.unlocked) {
    slotsHtml = [0,1,2,3].map(()=>cxWeeklySlot(null,false,true,false)).join('');
    const pct = w.thresh>0 ? Math.min(100, Math.round((w.total / w.thresh) * 100)) : 0;
    copyHtml = `<h2>ЕЖЕНЕДЕЛЬНЫЙ НАБОР</h2>
      <div class="weekly-ribbon"><span>РАЗБЛОКИРУЙ НАГРАДЫ</span></div>
      <p>Пополни баланс, чтобы открыть доступ к набору с несколькими скинами.<br>Ты сможешь забрать часть из них. Обновление раз в 7 дней.</p>
      <div class="cx-weekly-progress"><div class="cx-weekly-progress-bar" style="width:${pct}%"></div><span>Прогресс: ${pct}%</span></div>
      <button class="weekly-button" onclick="openPayment()">ПОПОЛНИТЬ БАЛАНС</button>`;
  } else {
    slotsHtml = (w.pool||[]).map(it => cxWeeklySlot(it, (w.claimed||[]).indexOf(it.catalogId)!==-1, false, (w.left||0)>0)).join('');
    const rem = Math.max(0, (w.expires||0) - Date.now());
    const days = Math.floor(rem/86400000);
    const hrs = Math.floor((rem%86400000)/3600000);
    copyHtml = `<h2>ЕЖЕНЕДЕЛЬНЫЙ НАБОР</h2>
      <div class="weekly-ribbon cx-ribbon-open"><span>НАГРАДЫ ОТКРЫТЫ</span></div>
      <p>Выбери понравившиеся скины и забери их в инвентарь.<br>Обновление через: <b>${days} дн. ${hrs} ч.</b></p>
      <p class="cx-pick-info">Осталось забрать: <b>${w.left||0}</b></p>
      ${(w.left||0)>0 ? '<button class="weekly-button" onclick="go(\'cases\')">ПРОДОЛЖИТЬ ИГРУ</button>' : '<button class="weekly-button cx-btn-disabled" disabled>ВСЕ СКИНЫ ЗАБРАНЫ</button>'}`;
  }
  return `<h1 class="weekly-page-title">НАГРАДЫ</h1>
    <section class="weekly-panel">
      <img class="weekly-bg" src="/chunks/bg.webp" alt="" aria-hidden="true">
      <div class="weekly-content">
        <div class="weekly-slots">${slotsHtml}</div>
        <div class="weekly-copy">${copyHtml}</div>
      </div>
    </section>
    <section class="top-drops-panel">
      <div class="top-drops-title">ТОП ДРОП</div>
      <div class="top-drops-track">${rewardDrops.length ? rewardDrops.slice(0, 12).map(topDropCard).join('') : '<div class="top-drops-empty">Здесь появятся только предметы из еженедельных наград</div>'}</div>
    </section>`;
}
async function cxClaimWeekly(catalogId) {
  if (!S.cxWeekly || !(S.cxWeekly.left>0)) return toast('Вы уже забрали все доступные скины', 'error');
  const approved = await customConfirm(`Забрать этот скин? Осталось забрать: ${S.cxWeekly.left || 0}`, { title: 'Еженедельный набор', confirmText: 'Забрать' });
  if (!approved) return;
  try {
    const r = await api('/api/cx-weekly/claim/' + encodeURIComponent(catalogId), { method: 'POST' });
    S.cxWeekly = Object.assign({}, S.cxWeekly, { claimed: r.claimed, left: r.left, pool: (S.cxWeekly.pool||[]).map(it=>it.catalogId===catalogId?Object.assign({},it,{claimed:true}):it) });
    S.me.user.balanceCents = r.balanceCents;
    await refreshAccount();
    render();
    toast('Скин добавлен в инвентарь', 'success');
  } catch (e) { toast(e.message || 'Не удалось забрать скин', 'error'); }
}

function stealPage() {
  return `<div class="steal"><div class="stealhero"><h2>STEAL A SKIN</h2><div class="empty"><h2>Нет активного события</h2><p>Когда появится дорогой дроп, здесь будет окно STEAL.</p></div></div>
    <div class="stealside"><h3>Правила</h3><div class="rule"><b>15 секунд</b>Время на STEAL.</div><div class="rule"><b>3–5%</b>Комиссия задаётся сервером.</div><div class="rule"><b>PvP</b>Победитель определяется сервером.</div></div></div>`;
}

function profileEmptyState(title, subtitle, buttonText, action) {
  return `<div class="profile-tab-empty"><div class="pte-copy"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></div><button onclick="${action}"><img src="/chunks/cases.svg" alt=""><span>${esc(buttonText)}</span></button></div>`;
}
function sortIconSVG() {
  return '<svg class="profile-sort-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function profileSortButton() {
  const options = [
    ['new', 'По новизне'],
    ['price-desc', 'По цене (дорогие)'],
    ['price-asc', 'По цене (дешёвые)'],
    ['rarity', 'По редкости']
  ];
  const label = (options.find(o => o[0] === S.sortBy) || options[0])[1];
  return `<div class="profile-sort">
    <button type="button" class="profile-sort-btn" onclick="toggleProfileSort(event)">${sortIconSVG()}<span>${esc(label)}</span><i class="profile-sort-chev ${S.sortOpen ? 'open' : ''}">${chevronIcon()}</i></button>
    ${S.sortOpen ? `<div class="profile-sort-menu">${options.map(o => `<button type="button" class="${o[0] === S.sortBy ? 'active' : ''}" onclick="setProfileSort('${o[0]}')"><span>${esc(o[1])}</span>${o[0] === S.sortBy ? '<i>✓</i>' : ''}</button>`).join('')}</div>` : ''}
  </div>`;
}
function sortList(list) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (S.sortBy === 'price-desc') return arr.sort((a, b) => Number(b.priceCents || 0) - Number(a.priceCents || 0));
  if (S.sortBy === 'price-asc') return arr.sort((a, b) => Number(a.priceCents || 0) - Number(b.priceCents || 0));
  if (S.sortBy === 'rarity') return arr.sort((a, b) => Number(b.rarityRank || 0) - Number(a.rarityRank || 0));
  return arr;
}
function toggleProfileSort(event) {
  event.stopPropagation();
  S.sortOpen = !S.sortOpen;
  render();
}
function setProfileSort(key) {
  S.sortBy = key;
  S.sortOpen = false;
  render();
}
function historyCard(item) {
  const status = item.status === 'sold' ? 'ПРОДАНО' : item.status === 'used' ? 'ИСПОЛЬЗОВАНО' : '';
  const icon = item.icon || item.localIcon || '';
  const img = icon ? `<img src="${esc(bust(icon))}" alt="" loading="lazy" onerror="this.onerror=null;this.classList.add('img-failed')">` : '';
  return `<div class="profile-history-card skin-card" ${rarityStyle(item)}>
    <div class="art">${img}</div>
    <strong>${esc(item.weapon || item.name || '')}</strong>
    <small>${esc(item.skin || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>
    ${status ? `<em class="history-status">${status}</em>` : ''}
    <span class="skin-price">${coinPrice(item.priceCents)}</span>${rarityLine()}
  </div>`;
}
function upgradeSlot(data, fallbackName) {
  const item = data || {};
  const weapon = item.weapon || String(item.name || fallbackName || '').split(' | ')[0] || '';
  const skin = item.skin || String(item.name || '').split(' | ')[1] || '';
  return `<div class="upg-slot skin-item" ${rarityStyle(item)}>
    <span class="skin-price">${coinPrice(item.priceCents)}</span>
    ${art(item)}
    <strong>${esc(weapon)}</strong>
    <small>${esc(skin)}</small>
    <i class="skin-rarity-line"></i>
  </div>`;
}
function upgradeCard(row) {
  const won = !!row.won;
  const from = row.from || { name: row.fromName, icon: row.fromIcon, priceCents: row.fromPriceCents };
  const to = row.to || { name: row.toName, icon: row.toIcon, priceCents: row.toPriceCents };
  const chance = Number(row.chance || 0);
  const title = to.weapon || String(to.name || '').split(' | ')[0] || 'Апгрейд';
  return `<div class="profile-upgrade-card ${won ? 'won' : 'lost'}">
    <div class="upg-head">${esc(title)}</div>
    <div class="upg-body">
      ${upgradeSlot(from, row.fromName)}
      <span class="upg-arrow" aria-hidden="true">›</span>
      ${upgradeSlot(to, row.toName)}
    </div>
    <div class="upg-foot">
      <span class="upg-chance">Шанс ${chance.toFixed(2)}%</span>
      <em class="upg-result">${won ? 'Выигрыш' : 'Проигрыш'}</em>
    </div>
  </div>`;
}
const ROLE_LABELS = { admin: 'Администратор', support: 'Поддержка' };
function roleBadge(role) {
  const label = ROLE_LABELS[role];
  if (!label) return '';
  return `<span class="role-badge role-${esc(role)}">${label}</span>`;
}
function profilePage() {
  if (!S.me?.authenticated) return loginRequired('ЛИЧНЫЙ ПРОФИЛЬ', 'Авторизуйтесь через Steam, чтобы открыть профиль.');
  const profile = S.profile || { user: S.me.user, balanceCents: S.me.user.balanceCents, withdrawnCents: 0, activeItems: S.inventory.length, bestDrop: null, stats: {}, history: [], upgrades: [] };
  const user = profile.user || S.me.user;
  const avatar = avatarImage(user);
  const best = profile.bestDrop
    ? `<div class="profile-best-item"><div class="profile-best-copy"><strong>${esc(profile.bestDrop.name || profile.bestDrop.itemName || 'Лучший дроп')}</strong><span>${esc(profile.bestDrop.skin || profile.bestDrop.marketName || 'Лучший предмет в инвентаре')}</span><b>${coinPrice(profile.bestDrop.priceCents)}</b></div><div class="profile-best-art">${image(profile.bestDrop.icon || profile.bestDrop.itemIcon, profile.bestDrop.name || profile.bestDrop.itemName || '')}</div></div>`
    : '<div class="profile-best-empty"><span>Отобразится после первой игры</span><img class="best-empty-img" src="/chunks/empty.webp" alt=""></div>';
  let content = '';
  if (S.profileTab === 'items') {
    const items = sortList(S.inventory);
    content = items.length ? `${sellBar()}<div class="profile-items-grid">${items.map(inventoryItemCard).join('')}</div>` : '<div class="profile-empty">У ВАС НЕТ ПРЕДМЕТОВ</div>';
  } else if (S.profileTab === 'history') {
    const history = sortList(profile.history || []);
    content = history.length ? `<div class="profile-items-grid profile-history-grid">${history.map(historyCard).join('')}</div>` : profileEmptyState('История предметов отсутствует', 'Откройте кейс или совершите апгрейд — результаты появятся здесь', 'Открыть кейс', "go('cases')");
  } else {
    const upgrades = (profile.upgrades || []).slice();
    content = upgrades.length ? `<div class="profile-upgrades-grid">${upgrades.map(upgradeCard).join('')}</div>` : profileEmptyState('История апгрейдов пуста', 'У пользователя пока нет завершенных апгрейдов', 'Перейти к апгрейду', "go('upgrade')");
  }
  const sellBtn = S.sellMode
    ? '<button class="profile-sell-all sell-cancel" onclick="toggleSellMode()">ОТМЕНА</button>'
    : '<button class="profile-sell-all" onclick="cxAskSellAll()">ПРОДАТЬ ВСЕ</button>';
  return `<section class="profile-page">
    <div class="profile-summary-grid">
      <article class="profile-user-card">
        <div class="profile-identity">${avatar}<div><h1>${esc(user.name || 'Игрок')}</h1><span>ID: ${esc(user.steamid || user.id || '')}</span>${roleBadge(user.role)}</div><div class="profile-tools"><a href="https://steamcommunity.com/profiles/${esc(user.steamid || '')}" target="_blank" rel="noopener" aria-label="Steam">${steamIcon()}</a><button onclick="openSettings()" title="Настройки"><img src="/chunks/settingIcon.svg" alt="Настройки"></button><button onclick="logout()" title="Выйти"><img src="/chunks/exitIconGray.svg" alt="Выйти"></button></div></div>
        <div class="profile-balance-label">Баланс</div><div class="profile-balance"><strong>${coinPrice(profile.balanceCents)}</strong><button type="button" onclick="openPayment()" aria-label="Пополнить баланс">+</button></div>
        <div class="profile-mini-stats"><div><b>${profile.stats?.casesOpened || 0}</b><span>Кейсы</span></div><div><b>${profile.stats?.upgradesMade || 0}</b><span>Апгрейды</span></div><div><b>${profile.stats?.soldItems || 0}</b><span>Продажи</span></div></div>
      </article>
      <article class="profile-best-card"><h2>Лучший дроп</h2>${best}</article>
      <div class="profile-side-column"><article class="profile-withdraw"><span class="withdrawn-label">Выведено</span><div class="withdrawn-amount"><b>${(Number(profile.withdrawnCents || 0) / 100).toFixed(2)}</b><img src="/chunks/coin.svg" alt="₽"></div><span class="withdrawn-count">0 предметов</span><img class="withdrawn-bg" src="/chunks/steamBg.webp" alt="" aria-hidden="true"></article><article class="profile-coupon"><input placeholder="Персональный купон"><button>ПРИМЕНИТЬ</button></article></div>
    </div>
    <div class="profile-toolbar"><div class="profile-tabs"><button class="${S.profileTab === 'items' ? 'active' : ''}" onclick="setProfileTab('items')">ПРЕДМЕТЫ</button><button class="${S.profileTab === 'history' ? 'active' : ''}" onclick="setProfileTab('history')">ИСТОРИЯ</button><button class="${S.profileTab === 'upgrades' ? 'active' : ''}" onclick="setProfileTab('upgrades')">АПГРЕЙДЫ</button></div><div class="profile-toolbar-right">${profileSortButton()}${sellBtn}</div></div>
    <div class="profile-content">${content}</div>
  </section>`;
}
function publicProfilePage(){
  if(S.publicProfileLoading)return '<div class="public-profile-state"><span class="profile-loader"></span><b>Загружаем профиль…</b></div>';
  if(S.publicProfileError)return `<div class="public-profile-state error"><b>Профиль недоступен</b><span>${esc(S.publicProfileError)}</span><button onclick="go('upgrade')">На главную</button></div>`;
  const profile=S.publicProfile;if(!profile)return '<div class="public-profile-state">Профиль не выбран</div>';
  const user=profile.user||{},avatar=avatarImage(user),tags=(user.tags||[]).map(tag=>`<span class="public-user-tag tag-${esc(tag)}">${esc({vip:'VIP',suspicious:'Подозрительный',verified:'Проверенный',partner:'Партнёр'}[tag]||tag)}</span>`).join('');
  const best=profile.bestDrop?`<div class="profile-best-item"><div class="profile-best-copy"><strong>${esc(profile.bestDrop.name||'Лучший дроп')}</strong><span>${esc(profile.bestDrop.skin||'Лучший предмет в инвентаре')}</span><b>${coinPrice(profile.bestDrop.priceCents)}</b></div><div class="profile-best-art">${image(profile.bestDrop.icon,profile.bestDrop.name||'')}</div></div>`:'<div class="profile-best-empty"><span>У игрока пока нет предметов</span><img class="best-empty-img" src="/chunks/empty.webp" alt=""></div>';
  let content='';if(S.profileTab==='items'){const items=sortList(profile.items||[]);content=items.length?`<div class="profile-items-grid profile-public-items">${items.map(historyCard).join('')}</div>`:'<div class="profile-empty">У ИГРОКА НЕТ АКТИВНЫХ ПРЕДМЕТОВ</div>';}else if(S.profileTab==='history'){const rows=sortList(profile.history||[]);content=rows.length?`<div class="profile-items-grid profile-history-grid">${rows.map(historyCard).join('')}</div>`:'<div class="profile-empty">ИСТОРИЯ ПУСТА</div>';}else{const upgrades=profile.upgrades||[];content=upgrades.length?`<div class="profile-upgrades-grid">${upgrades.map(upgradeCard).join('')}</div>`:'<div class="profile-empty">ИСТОРИЯ АПГРЕЙДОВ ПУСТА</div>';}
  return `<section class="profile-page public-profile-page"><button class="public-profile-back" onclick="history.back()">← Назад</button><div class="profile-summary-grid"><article class="profile-user-card"><div class="profile-identity">${avatar}<div><h1>${esc(user.name||'Игрок')}</h1><span>ID: ${esc(user.steamid||user.id||'')}</span>${roleBadge(user.role)}<div class="public-user-tags">${tags}</div></div><div class="profile-tools"><a href="https://steamcommunity.com/profiles/${esc(user.steamid||'')}" target="_blank" rel="noopener">${steamIcon()}</a></div></div><div class="public-profile-caption">Публичный профиль игрока</div><div class="profile-mini-stats"><div><b>${profile.stats?.casesOpened||0}</b><span>Кейсы</span></div><div><b>${profile.stats?.upgradesMade||0}</b><span>Апгрейды</span></div><div><b>${profile.stats?.soldItems||0}</b><span>Продажи</span></div></div></article><article class="profile-best-card"><h2>Лучший дроп</h2>${best}</article><div class="profile-side-column"><article class="profile-withdraw"><span class="withdrawn-label">Продано предметов</span><div class="withdrawn-amount"><b>${(Number(profile.withdrawnCents||0)/100).toFixed(2)}</b><img src="/chunks/coin.svg" alt=""></div><span class="withdrawn-count">${profile.activeItems||0} активных предметов</span><img class="withdrawn-bg" src="/chunks/steamBg.webp" alt=""></article><article class="public-profile-info"><span>Профиль создан</span><b>${user.createdAt?new Date(user.createdAt).toLocaleDateString('ru-RU'):'—'}</b></article></div></div><div class="profile-toolbar"><div class="profile-tabs"><button class="${S.profileTab==='items'?'active':''}" onclick="setProfileTab('items')">ПРЕДМЕТЫ</button><button class="${S.profileTab==='history'?'active':''}" onclick="setProfileTab('history')">ИСТОРИЯ</button><button class="${S.profileTab==='upgrades'?'active':''}" onclick="setProfileTab('upgrades')">АПГРЕЙДЫ</button></div><div class="profile-toolbar-right">${profileSortButton()}</div></div><div class="profile-content">${content}</div></section>`;
}
async function openPublicProfile(userId,push=true){
  const id=Number(userId);if(!id)return;if(S.me?.authenticated&&Number(S.me.user.id)===id){history.replaceState({},'', '/');S.page='profile';render();return;}
  S.page='public-profile';S.publicProfile=null;S.publicProfileError='';S.publicProfileLoading=true;S.profileTab='items';if(push)history.pushState({profileId:id},'',`/profile/${id}`);render();
  try{S.publicProfile=await api(`/api/users/${id}/profile`);}catch(error){S.publicProfileError=error.message;}finally{S.publicProfileLoading=false;render();}
}
window.addEventListener('popstate',()=>{const match=location.pathname.match(/^\/profile\/(\d+)\/?$/);if(match)openPublicProfile(match[1],false);else{S.page='upgrade';S.publicProfile=null;render();}});

function siteFooter() {
  const stats = S.globalStats || {};
  const count = value => Number(value || 0).toLocaleString('ru-RU');
  return `<footer class="site-footer">
    <div class="footer-mobile-head"><div><img src="/chunks/logo.svg" alt=""><b>${esc(S.brand)}</b></div><a href="${esc(S.telegram)}" target="_blank" rel="noopener">${telegramIcon()}</a></div>
    <div class="footer-divider footer-mobile-divider"></div>
    <div class="footer-main">
      <div class="footer-brand"><div><img src="/chunks/logo.svg" alt=""><b>${esc(S.brand)}</b></div><p>Улучшай и собирай собственный инвентарь CS2.</p></div>
      <div class="footer-column footer-contacts"><div><b>ПОДДЕРЖКА</b><a href="mailto:${esc(S.supportEmail)}">${esc(S.supportEmail)}</a></div><div><b>СОТРУДНИЧЕСТВО</b><a href="mailto:${esc(S.marketingEmail)}">${esc(S.marketingEmail)}</a></div></div>
      <div class="footer-column"><b>НАВИГАЦИЯ</b><button onclick="openInventory()">Инвентарь</button><button onclick="go('cases')">Кейсы</button><button onclick="go('upgrade')">Апгрейды</button><button onclick="go('rewards')">Награды</button></div>
      <div class="footer-column"><b>ОБЩИЕ ПОЛОЖЕНИЯ</b><a href="/tos.html">Пользовательское соглашение</a><a href="/privacy.html">Политика конфиденциальности</a><a href="/cookies.html">Политика использования Cookie</a><a href="/aml.html">Политика AML/KYC</a><a href="/tos.html#contacts">Контакты</a></div>
      <div class="footer-language"><div class="lang-select">
        <button type="button" onclick="toggleFooterLang()">${flagIcon(S.footerLang)}<b>${esc(S.footerLang)}</b><i class="lang-chevron ${S.footerLangOpen ? 'open' : ''}">${chevronIcon()}</i></button>
        ${S.footerLangOpen ? `<div class="lang-menu">${LANGS.map(item => `<button type="button" class="${item.code === S.footerLang ? 'active' : ''}" onclick="setFooterLang('${item.code}')">${flagIcon(item.code)}<b>${esc(item.name)}</b>${item.code === S.footerLang ? '<i class="lang-check">✓</i>' : ''}</button>`).join('')}</div>` : ''}
      </div></div>
    </div>
    <div class="footer-company"><div><b>${esc(S.brand)} © 2026</b><p>Игровой сервис предметов CS2. Все операции с предметами выполняются внутри сайта.</p><span>Не аффилировано с Valve Corp.</span></div><div class="footer-payments"><b>mastercard</b><b>VISA</b></div></div>
    <div class="footer-divider"></div>
    <div class="footer-stats">
      <div><img src="/chunks/online.svg" alt=""><b data-footer-online>${count(S.online)}</b><span>Онлайн</span></div><i></i>
      <div><img src="/chunks/allGamers.svg" alt=""><b>${count(stats.totalPlayers)}</b><span>Всего игроков</span></div><i></i>
      <div><img src="/chunks/cases.svg" alt=""><b>${count(stats.casesOpened)}</b><span>Открыто кейсов</span></div><i></i>
      <div><img src="/chunks/upgrade.svg" alt=""><b>${count(stats.upgradesMade)}</b><span>Сделано апгрейдов</span></div>
    </div>
  </footer>`;
}

function siteBanner() {
  const banner=S.siteBanner;if(!banner)return '';
  return `<aside class="site-announcement tone-${esc(banner.tone||'info')}"><div><b>${esc(banner.title)}</b><span>${esc(banner.body)}</span></div>${banner.link?`<a href="${esc(banner.link)}">Подробнее</a>`:''}</aside>`;
}
function frozenAccountOverlay(){
  if(!S.me?.authenticated||!S.me.user.frozen)return '';
  return `<div class="frozen-account"><section><span>АККАУНТ ЗАМОРОЖЕН</span><h2>Доступ временно ограничен</h2><p>${esc(S.me.user.freezeReason||'Обратитесь в поддержку для уточнения причины.')}</p><button onclick="openChat()">Открыть поддержку</button><button class="secondary" onclick="logout()">Выйти</button></section></div>`;
}

function cookieConsentBanner() {
  if (S.cookieConsent === 'accepted' || S.cookieConsent === 'rejected') return '';
  return `<aside class="cookie-consent" role="dialog" aria-live="polite" aria-label="Настройки Cookie">
    <div class="cookie-consent-icon">C</div>
    <div class="cookie-consent-copy"><strong>Мы используем Cookie</strong><p>Необходимые Cookie обеспечивают вход и безопасность. С вашего разрешения сайт также запомнит настройки интерфейса. Подробнее — в <a href="/cookies.html">Политике Cookie</a>.</p></div>
    <div class="cookie-consent-actions"><button type="button" class="cookie-reject" onclick="rejectCookies()">Отклонить</button><button type="button" class="cookie-accept" onclick="acceptCookies()">Разрешить</button></div>
  </aside>`;
}
function acceptCookies() {
  S.cookieConsent = 'accepted';
  localStorage.setItem('keyser-cookie-consent', 'accepted');
  document.querySelector('.cookie-consent')?.remove();
}
function rejectCookies() {
  S.cookieConsent = 'rejected';
  localStorage.setItem('keyser-cookie-consent', 'rejected');
  document.querySelector('.cookie-consent')?.remove();
}
function authConsentModal() {
  const ready = S.ageAccepted && S.termsAccepted;
  const check = value => value ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.2 3.1 3.1L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
  return `<div class="auth-consent-overlay">
    <div class="auth-consent" role="dialog" aria-modal="true" aria-label="Авторизация">
      <button class="auth-close" onclick="closeAuthModal()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button>
      <div class="auth-hero">
        <div class="auth-hero-shade"></div><img class="auth-logo" src="/chunks/logo.svg" alt="">
        <div class="auth-heading"><h2>АВТОРИЗАЦИЯ</h2><p>Для доступа к сервису примите условия пользования и авторизуйтесь через Steam.</p></div>
      </div>
      <div class="auth-consent-body">
        <div class="auth-check-row" onclick="toggleConsent('age')"><button type="button" role="checkbox" data-consent="age" aria-checked="${S.ageAccepted}" class="auth-checkbox ${S.ageAccepted ? 'checked' : ''}">${check(S.ageAccepted)}</button><span>Подтверждаю, что мне больше 18 лет</span></div>
        <div class="auth-check-row" onclick="toggleConsent('terms')"><button type="button" role="checkbox" data-consent="terms" aria-checked="${S.termsAccepted}" class="auth-checkbox ${S.termsAccepted ? 'checked' : ''}">${check(S.termsAccepted)}</button><span>Принимаю <a href="/tos.html" onclick="event.stopPropagation()" target="_blank">правила и условия</a> использования сайта</span></div>
        <button class="auth-steam-button" data-auth-submit ${ready ? '' : 'disabled'} onclick="confirmSteamLogin()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>
      </div>
    </div>
  </div>`;
}

function settingsModal() {
  const settings = S.settings || { nickname: S.me?.user?.name || '', tradeLink: '', privacy: 'private', streamerMode: false };
  const options = [
    ['private', 'Приватный', 'Только вы будете видеть информацию Steam-профиля. Профиль скрыт от парсер-ботов и посторонних пользователей.'],
    ['friends', 'Доступен только для друзей', 'Информацию профиля смогут видеть авторизованные пользователи из списка друзей.'],
    ['public', 'Публичный', 'Все пользователи смогут видеть информацию вашего профиля.']
  ];
  return `<div class="settings-overlay" role="presentation">
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-label="Настройки">
      <button class="settings-close" onclick="closeSettings()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button>
      <div class="settings-title"><img src="/chunks/settingIcon.svg" alt=""><h2>НАСТРОЙКИ</h2></div>
      <div class="settings-scroll">
        <label class="settings-field"><span>Никнейм</span><input id="settings-nickname" maxlength="32" value="${esc(settings.nickname)}" placeholder="Никнейм"></label>
        <label class="settings-field"><span>Трейд-ссылка</span><div class="settings-trade"><input id="settings-trade" value="${esc(settings.tradeLink)}" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."><button type="button" id="copy-trade-btn" onclick="copyTradeLink()" title="Копировать"><img id="copy-icon" src="/chunks/copyIcon.svg" alt="Копировать"><img id="copy-success" src="/chunks/success.svg" alt="Скопировано" style="display:none"></button></div><a href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url" target="_blank" rel="noreferrer">Узнать свою ссылку</a></label>
        <section class="settings-privacy"><h3>Приватность Steam</h3>${options.map(([value, title, text]) => `<button type="button" data-privacy="${value}" class="settings-privacy-option ${settings.privacy === value ? 'active' : ''}" onclick="selectPrivacy('${value}')"><i><b></b></i><span><strong>${title}</strong><small>${text}</small></span></button>`).join('')}</section>
        <section class="settings-streamer"><div><h3>Режим стримера</h3><p>Скрывает личную информацию и баланс для безопасности во время стрима</p></div><button type="button" class="settings-switch ${settings.streamerMode ? 'active' : ''}" aria-pressed="${settings.streamerMode}" onclick="toggleStreamerMode()"><i></i></button></section>
      </div>
      <button class="settings-save" onclick="saveSettings()">СОХРАНИТЬ И ЗАКРЫТЬ</button>
    </div>
  </div>`;
}

function paymentModal() {
  const methods = S.paymentTab === 'card'
    ? [['КАРТА', 'РЕКОМЕНДУЕМ'], ['СБП', ''], ['GIFT CARD', ''], ['БАНКОВСКИЙ ПЕРЕВОД', '']]
    : S.paymentTab === 'crypto'
      ? [['USDT', 'РЕКОМЕНДУЕМ'], ['BITCOIN', ''], ['ETHEREUM', '']]
      : [['ДЕПОЗИТ СКИНАМИ', 'РЕКОМЕНДУЕМ'], ['TRADE OFFER', '']];
  return `<div class="payment-overlay"><div class="payment-dialog" role="dialog" aria-modal="true" aria-label="Пополнение баланса">
    <header><h2>ПОПОЛНЕНИЕ БАЛАНСА</h2><button onclick="closePayment()" aria-label="Закрыть"><img src="/chunks/closeIcon3.svg" alt=""></button></header>
    <div class="payment-tabs"><button class="${S.paymentTab === 'card' ? 'active' : ''}" onclick="setPaymentTab('card')"><i>▰</i>КАРТОЙ</button><button class="${S.paymentTab === 'crypto' ? 'active' : ''}" onclick="setPaymentTab('crypto')"><i>₿</i>КРИПТОЙ</button><button class="${S.paymentTab === 'skins' ? 'active' : ''}" onclick="setPaymentTab('skins')"><i>◆</i>СКИНАМИ</button></div>
    <div class="payment-body"><div class="payment-currency"><span>Выберите валюту пополнения</span><div class="currency-select">
      <button type="button" onclick="toggleCurrencyMenu()">${esc(S.paymentCurrency)}<i class="currency-chevron ${S.currencyOpen ? 'open' : ''}">${chevronIcon()}</i></button>
      ${S.currencyOpen ? `<div class="currency-menu">${CURRENCIES.map(item => `<button type="button" class="${item.code === S.paymentCurrency ? 'active' : ''}" onclick="setPaymentCurrency('${item.code}')"><span>${item.flag}</span><b>${esc(item.name)}</b><i>${item.code}</i>${item.code === S.paymentCurrency ? '<em>✓</em>' : ''}</button>`).join('')}</div>` : ''}
    </div></div><div class="payment-methods">${methods.map(([name, badge], index) => `<button class="${S.paymentMethod === index ? 'active' : ''}" onclick="selectPaymentMethod(${index})">${badge ? `<small>${badge}</small>` : ''}<b>${name}</b></button>`).join('')}</div></div>
    <div class="payment-bottom"><div class="payment-amount-head"><span>СУММА ПОПОЛНЕНИЯ</span><div>${[500,1000,2500,5000].map(amount => `<button class="${S.paymentAmount === amount ? 'active' : ''}" onclick="setPaymentAmount(${amount})">${amount.toLocaleString('ru-RU')}</button>`).join('')}</div></div>
      <label class="payment-amount"><span><input id="payment-amount" type="number" min="50" max="100000" value="${S.paymentAmount}"><b>${CURRENCY_BY_CODE[S.paymentCurrency]?.symbol || '₽'}</b></span><small>мин. 50</small></label>
      <div class="payment-promo"><span>◇</span><input id="payment-promo" placeholder="Введите промокод"><button onclick="applyPaymentPromo()">ПРИМЕНИТЬ</button></div>
      <button class="payment-submit" onclick="submitPayment()">ПОПОЛНИТЬ</button><p>Если после оплаты прошло более 30 минут, а баланс на сайте не пополнился, напишите нам в техподдержку</p>
    </div>
  </div></div>`;
}

function chatModal() {
  const emailGate = !S.chatEmailReady ? `<div class="support-email-overlay"><div class="support-email-card"><div><h3>Какой адрес вашей электронной почты?</h3><p>Введите свой email, чтобы узнать, когда мы ответим:</p></div><input id="support-email" type="email" autocomplete="email" value="${esc(S.chatEmail)}" placeholder="Введите свой email..."><button onclick="submitSupportEmail()">УСТАНОВИТЬ МОЙ EMAIL</button></div></div>` : '';
  return `<div class="support-chat-window" role="dialog" aria-modal="false" aria-label="Чат поддержки">
    <div class="support-chat-header"><div class="support-agent"><img src="/chunks/logo.svg" alt=""><i></i></div><div><h3>Вопросы? Напишите нам в чат!</h3><span>Наша команда сейчас онлайн</span></div><button onclick="closeChat()" aria-label="Закрыть">×</button></div>
    <div class="support-chat-body" id="chatbody"><div class="support-welcome">Как мы можем вам помочь с ${esc(S.brand)}?</div></div>
    <div class="support-category"><span>Тема обращения</span><select id="chat-category" onchange="setTicketCategory(this.value)"><option value="payments" ${S.ticketCategory==='payments'?'selected':''}>Платежи</option><option value="withdrawal" ${S.ticketCategory==='withdrawal'?'selected':''}>Вывод</option><option value="account" ${S.ticketCategory==='account'?'selected':''}>Аккаунт</option><option value="errors" ${S.ticketCategory==='errors'?'selected':''}>Ошибки</option></select></div><form class="support-composer" onsubmit="sendChat(event)"><input id="chatinput" maxlength="2000" placeholder="Отправьте сообщение..."><button aria-label="Отправить">➤</button></form>
    ${emailGate}
  </div>`;
}

function pageContent() {
  if (S.page === 'cases') return casesPage();
  if (S.page === 'case') return caseDetailPage();
  if (S.page === 'profile' || S.page === 'inventory') return profilePage();
  if (S.page === 'public-profile') return publicProfilePage();
  if (S.page === 'rewards') return rewardsPage();
  if (S.page === 'steal') return stealPage();
  return upgradePage();
}
function openInventory() {
  S.page = 'profile';
  S.profileTab = 'items';
  render();
}
let lastPageRendered = null;
function render() {
  if (S._dropLock && Date.now() < S._dropLock && S.page === 'case') return;
  const app = $('#app');
  const html = header() + `<div class="layout">${sidebar()}<main class="main">${siteBanner()}<div class="page" data-page="${esc(S.page || '')}">${pageContent()}</div></main></div>${siteFooter()}
    <div class="support"><button onclick="openChat()" aria-label="Поддержка" title="Поддержка"><img src="/chunks/pomosh.webp" alt="Поддержка"></button></div>${S.chat ? chatModal() : ''}${S.authModal ? authConsentModal() : ''}${S.settingsOpen ? settingsModal() : ''}${S.paymentOpen ? paymentModal() : ''}${resultOverlay()}${caseRevealOverlay()}${cookieConsentBanner()}${frozenAccountOverlay()}${cxSellAllBar()}`;
  const pageChanged = S.page !== lastPageRendered;
  lastPageRendered = S.page;
  if (window.morphdom) {
    morphdom(app, `<div class="app-root">${html}</div>`, {
      childrenOnly: true,
      getNodeKey(node) {
        if (node && node.nodeType === 1 && node.id) return node.id;
        return undefined;
      },
      onBeforeElUpdated(fromEl, toEl) {
        if (!fromEl || fromEl.nodeType !== 1 || !toEl) return;
        if (fromEl === document.activeElement && (fromEl.tagName === 'INPUT' || fromEl.tagName === 'TEXTAREA' || fromEl.tagName === 'SELECT')) return false;
        if (S.spinning && fromEl.classList && fromEl.classList.contains('pointer-orbit')) return false;
      }
    });
  } else {
    app.innerHTML = html;
  }
  if (pageChanged && S.page !== 'case') {
    const pageEl = app.querySelector('.page');
    if (pageEl) {
      pageEl.classList.remove('page-enter');
      void pageEl.offsetWidth;
      pageEl.classList.add('page-enter');
    }
  }
  translateDom(app);
  ensureImages();
  syncCaseBackdrop();
  syncSidebarToggle();
  playCaseDrop();
  if (S.chat) loadChat();
}

const SIDEBAR_KEY = 'keyser-sidebar-collapsed';

function sidebarChevron() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle('cx-side-collapsed', collapsed);
  try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch (error) {  }
  const button = document.getElementById('cx-side-toggle');
  if (button) {
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Показать панель дропов' : 'Скрыть панель дропов');
    button.title = collapsed ? 'Показать панель' : 'Скрыть панель';
  }
}

function toggleSidebar() {
  setSidebarCollapsed(!document.body.classList.contains('cx-side-collapsed'));
}

function syncSidebarToggle() {
  if (document.getElementById('cx-side-toggle')) return;
  const button = document.createElement('button');
  button.id = 'cx-side-toggle';
  button.type = 'button';
  button.innerHTML = sidebarChevron();
  button.addEventListener('click', toggleSidebar);
  document.body.appendChild(button);
  let collapsed = false;
  try { collapsed = localStorage.getItem(SIDEBAR_KEY) === '1'; } catch (error) {  }
  setSidebarCollapsed(collapsed);
}

function syncCaseBackdrop() {
  let layer = document.getElementById('cx-case-backdrop');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'cx-case-backdrop';
    layer.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(layer, document.body.firstChild);
  }
  if (!layer.querySelector('video')) {
    layer.innerHTML = '<video class="cx-case-backdrop-video" src="/cases/cases/case-bg-video.webm" poster="/cases/case-bg-poster2.webp" autoplay muted loop playsinline disablePictureInPicture></video>';
  }
  const video = layer.querySelector('video');
  const active = S.page === 'case';
  layer.classList.toggle('is-active', active);
  document.body.classList.toggle('cx-case-view', active);
  if (video) {
    if (active) video.play().catch(() => {});
    else video.pause();
  }
}

let imageFallbackTimer = null;
function ensureImages() {
  if (imageFallbackTimer) clearTimeout(imageFallbackTimer);
  imageFallbackTimer = setTimeout(() => {
    for (const img of document.querySelectorAll('img[data-fb]')) {
      if (img.complete && img.naturalWidth > 0) continue;
      const rect = img.getBoundingClientRect();
      const inView = rect.top < innerHeight && rect.bottom > 0 && rect.right > 0 && rect.left < innerWidth;
      if (!inView) continue;
      const fallback = img.dataset.fb;
      if (fallback) {
        img.dataset.fb = '';
        img.onerror = null;
        img.src = fallback;
      }
    }
  }, 4000);
}

function upgradeBaseValue() {
  return (S.from ? Number(S.from.priceCents) : 0) + Number(S.addBalance || 0);
}
function clampChance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}
function formatChance(value) {
  if (value == null) return '0%';
  const chance = clampChance(value);
  if (chance <= 0) return '0%';
  if (chance >= 100) return '100%';

  return `${Number(chance.toFixed(2))}%`;
}
function recalculateChance() {
  const value = upgradeBaseValue();
  const targetPrice = S.to ? Number(S.to.priceCents) : 0;
  if (!S.from || !S.to || !Number.isFinite(targetPrice) || targetPrice <= 0) { S.chance = null; return; }

  S.chance = clampChance(Math.floor(value / targetPrice * 10000) / 100);
}
function boostMinimumPrice(baseValue, boost) {
  return boost >= 100
    ? Math.ceil(baseValue * boost / 100)
    : Math.ceil(baseValue * 100 / boost);
}
function upgradeTargets() {
  if (!S.from) return [];
  const minimum = boostMinimumPrice(upgradeBaseValue(), S.boost);
  return S.catalog.filter(item => item.priceCents >= minimum).sort((a, b) => a.priceCents - b.priceCents);
}
async function choose(id, side) {
  const item = side === 'from'
    ? S.inventory.find(value => String(value.assetid) === String(id))
    : S.catalog.find(value => String(value.catalogId) === String(id));
  if (!item) return;
  if (side === 'from') {
    S.from = item;
    setBoost(S.boost, false);
    recalculateChance();
    render();
    return;
  }
  S.to = item;
  recalculateChance();
  render();
  try {
    const result = await api(`/api/catalog/${encodeURIComponent(item.catalogId)}/refresh-price`, { method: 'POST' });
    if (result?.item) Object.assign(item, result.item);
    const minimum = boostMinimumPrice(upgradeBaseValue(), S.boost);
    if (Number(item.priceCents) < minimum) {
      S.to = null;
      toast('После обновления цены цель не соответствует проценту апгрейда', 'error');
    }
    recalculateChance();
    render();
  } catch (error) {
    S.to = null;
    recalculateChance();
    render();
    toast(error.message, 'error');
  }
}
function setBoost(value, shouldRender = true) {
  S.boost = Number(value);
  S.targetPage = 1;
  const targets = upgradeTargets();
  const keep = S.to && targets.some(item => String(item.catalogId) === String(S.to.catalogId));
  if (!keep) S.to = targets[0] || null;
  recalculateChance();
  if (shouldRender) render();
}
function setAddBalance(value) {
  const balanceCents = Number(S.me.user.balanceCents || 0);
  S.addBalance = Math.round(Math.min(Math.max(Number(value) || 0, 0), balanceCents / 100) * 100);
  S.targetPage = 1;
  if (S.to) {
    const minimum = boostMinimumPrice(upgradeBaseValue(), S.boost);
    if (Number(S.to.priceCents) < minimum) S.to = null;
  }
  recalculateChance();
  render();
}
function applyTargetFilters() {
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  S.targetMin = document.querySelector('#target-min')?.value?.trim() || '';
  S.targetMax = document.querySelector('#target-max')?.value?.trim() || '';
  S.targetSearch = document.querySelector('#target-search')?.value?.trim() || '';
  S.targetPage = 1;
  render();
  if (activeId) {
    const el = typeof document.getElementById === 'function' ? document.getElementById(activeId) : null;
    if (el) {
      el.focus();
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch (_) {}
    }
  }
}
function setTargetPage(page) {
  const pageSize = 16;
  const query = S.targetSearch.trim().toLowerCase();
  const baseValue = upgradeBaseValue();
  const minimumPrice = S.from ? boostMinimumPrice(baseValue, S.boost) : 0;
  const userMin = S.targetMin === '' ? 0 : Number(S.targetMin) * 100;
  const minT = Math.max(minimumPrice, Number.isFinite(userMin) ? userMin : 0);
  const maxT = S.targetMax === '' ? Infinity : Number(S.targetMax) * 100;
  const filtered = S.catalog.filter(item => item.priceCents >= minT && item.priceCents <= maxT && (!query || `${item.weapon} ${item.skin} ${item.name}`.toLowerCase().includes(query)));
  const count = Math.max(1, Math.ceil(filtered.length / pageSize));
  S.targetPage = Math.max(1, Math.min(page, count));
  render();
}
function sendToUpgrade(id) {
  const item = S.inventory.find(value => String(value.assetid) === String(id));
  if (!item) return toast('Предмет уже недоступен', 'error');
  S.page = 'upgrade';
  S.from = item;
  setBoost(S.boost, false);
  render();
}
async function sellItem(id) {
  try {
    const result = await api(`/api/inventory/${encodeURIComponent(id)}/sell`, { method: 'POST' });
    await refreshAccount();
    if (S.from && String(S.from.assetid) === String(id)) { S.from = null; S.to = null; S.chance = null; }
    render();
    toast(`Предмет продан за ${money(result.amountCents)}`, 'success');
  } catch (error) { toast(error.message, 'error'); }
}

async function refreshAccount() {
  const [me, inventory, cases, drops, profile, stats] = await Promise.all([
    api('/api/me'), api('/api/inventory'), api('/api/cases'), api('/api/live-drops'), api('/api/profile'), api('/api/stats')
  ]);
  S.me = me;
  S.inventory = inventory.items || [];
  S.inventoryFeed = inventory.feed || inventory.items || [];
  S.cases = cases.cases || [];
  S.drops = drops;
  S.profile = profile;
  S.globalStats = stats;
  const balanceCents = Number(S.me?.user?.balanceCents || 0);
  if (S.addBalance > balanceCents) S.addBalance = Math.max(0, balanceCents);
}

function selectCase(caseId) {
  S.activeCase = caseId;
  S.caseResult = null;
  S.rouletteItems = [];
  S.page = 'case';
  caseDropFor = null;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  render();
  S._dropLock = Date.now() + 1300;
  window.scrollTo(0, 0);
}
function buildRoulette(caseData, winner) {
  const pool = caseData.contents;
  const items = Array.from({ length: 48 }, () => pool[Math.floor(Math.random() * pool.length)]);
  items[41] = winner;
  return items;
}
async function openCase(caseId) {
  if (S.opening) return;
  const caseData = S.cases.find(item => item.id === caseId);
  if (!caseData) return;
  S.opening = caseId;
  S.caseResult = null;
  S.rouletteItems = [];
  render();
  const detail = document.querySelector('.case-detail');
  if (detail) detail.classList.add('cx-case-spinning');
  try {
    const result = await api('/api/cases/open', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId })
    });
    S.rouletteItems = buildRoulette(caseData, result.item);
    render();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      const track = document.querySelector('.case-roll-track');
      const viewport = document.querySelector('.case-roulette');
      if (track && viewport) {
        const stop = 41 * 178 - viewport.clientWidth / 2 + 84;
        track.style.transform = `translate3d(-${Math.max(0, stop)}px,0,0)`;
        track.classList.add('rolling');
      }
      setTimeout(resolve, 6400);
    })));
    await refreshAccount();
    S.rouletteItems = [];
    S.caseResult = result.item;
    S.caseReveal = true;
  } catch (error) {
    S.rouletteItems = [];
    toast(error.message, 'error');
  } finally {
    if (detail) detail.classList.remove('cx-case-spinning');
    S.opening = null;
    render();
    if (S.caseReveal) {
      setTimeout(() => { if (S.caseReveal) { S.caseReveal = false; render(); } }, 6000);
    }
  }
}

let pointerRaf = null;
let pointerCurrent = 0;

function applyPointerAngle(deg) {
  S.pointerAngle = Math.round(deg * 100) / 100;
  const orbit = document.querySelector('.pointer-orbit');
  if (orbit) orbit.style.setProperty('--angle', S.pointerAngle + 'deg');
}

function startPointerSpin() {
  if (pointerRaf) cancelAnimationFrame(pointerRaf);
  let last = performance.now();
  const step = now => {
    if (!S.spinning) { pointerRaf = null; return; }
    const dt = Math.min(64, now - last);
    last = now;

    pointerCurrent += dt * 0.54;
    applyPointerAngle(pointerCurrent);
    pointerRaf = requestAnimationFrame(step);
  };
  pointerRaf = requestAnimationFrame(step);
}

function pointerLanding(won, chance) {
  const value = clampChance(chance);
  const half = value * 1.8;
  const rand = (min, max) => min + Math.random() * (max - min);
  const margin = 1.2;
  let target;
  if (won) {
    const inner = Math.max(0, half - margin);
    target = inner > 0 ? rand(-inner, inner) : 0;
  } else {
    const lossHalf = Math.max(0, 180 - half - margin);
    target = lossHalf > 0 ? 180 + rand(-lossHalf, lossHalf) : 180;
  }
  target = ((target % 360) + 360) % 360;

  const current = ((pointerCurrent % 360) + 360) % 360;
  let delta = target - current;
  while (delta <= 0) delta += 360;
  return pointerCurrent + 4 * 360 + delta;
}

function spinPointerTo(total, duration = 2400) {
  return new Promise(resolve => {
    if (pointerRaf) cancelAnimationFrame(pointerRaf);
    pointerRaf = null;
    const start = pointerCurrent;
    const delta = total - start;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const t = Math.min(1, (now - t0) / duration);
      pointerCurrent = start + delta * ease(t);
      applyPointerAngle(pointerCurrent);
      if (t < 1) pointerRaf = requestAnimationFrame(step);
      else {
        pointerCurrent = total;
        applyPointerAngle(pointerCurrent);
        pointerRaf = null;
        resolve();
      }
    };
    pointerRaf = requestAnimationFrame(step);
  });
}

async function upgrade() {
  if (!S.from || !S.to || S.spinning) return;
  S.spinning = true;
  startPointerSpin();
  render();
  try {
    const result = await api('/api/upgrade', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAssetId: S.from.assetid, toCatalogId: S.to.catalogId, boostPercent: S.boost, addBalanceCents: S.addBalance })
    });

    S.chance = clampChance(result.chance);
    const wheelEl = document.querySelector('.wheel');
    if (wheelEl) {
      wheelEl.style.setProperty('--chance', S.chance + '%');
      wheelEl.style.setProperty('--chance-half', (S.chance / 2).toFixed(3) + '%');
      wheelEl.style.setProperty('--chance-deg', (S.chance * 3.6).toFixed(3) + 'deg');
      wheelEl.style.setProperty('--chance-half-deg', (S.chance * 1.8).toFixed(3) + 'deg');
    }
    const headEl = document.querySelector('.wheelhead b');
    if (headEl) headEl.textContent = formatChance(S.chance);
    const centerEl = document.querySelector('.wheelcenter strong');
    if (centerEl) centerEl.textContent = formatChance(S.chance);
    await new Promise(resolve => setTimeout(resolve, S.turbo ? 60 : 900));
    const total = pointerLanding(!!result.won, result.chance);
    await spinPointerTo(total, S.turbo ? 360 : 4200);
    await refreshAccount();
    S.upgradeResult = {
      won: !!result.won,
      item: result.item || null,
      from: S.from,
      to: S.to
    };
    S.from = null;
    S.to = null;
    S.chance = null;
    S.addBalance = 0;
  } catch (error) {
    S.upgradeResult = null;
    if (pointerRaf) cancelAnimationFrame(pointerRaf);
    pointerRaf = null;
    pointerCurrent = 0;
    applyPointerAngle(0);
    toast(error.message, 'error');
  } finally {
    S.spinning = false;
    render();
    if (S.upgradeResult) {
      setTimeout(() => { if (S.upgradeResult) { S.upgradeResult = null; render(); } }, 8000);
    }
  }
}
function resetPointer() {
  if (pointerRaf) cancelAnimationFrame(pointerRaf);
  pointerRaf = null;
  pointerCurrent = 0;
  applyPointerAngle(0);
}
function closeUpgradeResult() {
  S.upgradeResult = null;
  resetPointer();
  render();
}
function resultCheckIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function resultCrossIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
}
function resultItemBlock(item) {
  if (!item) return '';
  return `<div class="result-item skin-card" ${rarityStyle(item)}>
    ${priceTag(item)}${item.wear ? `<span class="skin-wear">${esc(item.wear)}</span>` : ''}${art(item)}
    <strong>${esc(item.weapon || item.name || '')}</strong>
    <small>${esc(item.skin || item.marketName || '')}</small>
    <span class="rarity-name">${esc(item.rarity || '')}</span>${rarityLine()}
  </div>`;
}
function caseRevealOverlay() {
  if (!S.caseReveal || !S.caseResult) return '';
  const item = S.caseResult;
  return `<div class="result-overlay win" role="dialog" aria-modal="true" aria-label="Выпал предмет">
    <div class="result-card">
      <div class="result-badge">${resultCheckIcon()}</div>
      <h2>ВЫПАЛ ПРЕДМЕТ</h2>
      <p>${esc(item.name)} добавлен в инвентарь сайта</p>
      ${resultItemBlock(item)}
      ${resultParticles()}
      <button class="result-close" onclick="closeCaseReveal()">В ИНВЕНТАРЬ</button>
    </div>
  </div>`;
}
function closeCaseReveal() {
  S.caseReveal = false;
  S.caseResult = null;
  if (S.page === 'case') { S.page = 'inventory'; }
  render();
}
function resultParticles() {
  const colors = ['#1075E0', '#56A8FF', '#1AECFF', '#44C987', '#FFFFFF'];
  const parts = Array.from({ length: 22 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 60;
    const size = 4 + Math.random() * 7;
    const color = colors[i % colors.length];
    return `<i style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--d:${(Math.random() * 0.45).toFixed(2)}s;--dur:${(0.9 + Math.random() * 0.9).toFixed(2)}s;--s:${size.toFixed(1)}px;--c:${color}"></i>`;
  }).join('');
  return `<div class="result-particles" aria-hidden="true">${parts}</div>`;
}
function resultOverlay() {
  const result = S.upgradeResult;
  if (!result) return '';
  const won = result.won;
  const item = won ? result.item : result.from;
  return `<div class="result-overlay ${won ? 'win' : 'lose'}" role="dialog" aria-modal="true" aria-label="${won ? 'Апгрейд успешен' : 'Апгрейд не удался'}">
    <div class="result-card">
      <div class="result-badge">${won ? resultCheckIcon() : resultCrossIcon()}</div>
      <h2>${won ? 'АПГРЕЙД УСПЕШЕН' : 'АПГРЕЙД НЕ УДАЛСЯ'}</h2>
      <p>${won ? 'Новый предмет добавлен в инвентарь сайта' : 'Исходный предмет был использован в апгрейде'}</p>
      ${resultItemBlock(item)}
      ${resultParticles()}
      <button class="result-close" onclick="closeUpgradeResult()">ПРОДОЛЖИТЬ</button>
    </div>
  </div>`;
}

function toggleSoundBtn() {
  const next = localStorage.getItem('keyser-sound') === '0';
  localStorage.setItem('keyser-sound', next ? '1' : '0');
  render();
}
function toggleTurbo() {
  S.turbo = !S.turbo;
  localStorage.setItem('keyser-turbo', S.turbo ? '1' : '0');
  render();
}
function toggleCurrencyMenu() {
  S.currencyOpen = !S.currencyOpen;
  render();
}
function setPaymentCurrency(code) {
  S.paymentCurrency = code;
  S.currencyOpen = false;
  render();
}
function toggleFooterLang() {
  S.footerLangOpen = !S.footerLangOpen;
  render();
}
function setFooterLang(code) {
  const normalized = String(code || 'RU').toUpperCase();
  const route = ({ RU:'ru', EN:'en', UA:'ua', KZ:'kz', BE:'be' })[normalized] || 'ru';
  localStorage.setItem('keyser-language', normalized);
  location.assign(`/${route}`);
}

function chatDayLabel(ts) {
  const date = new Date(Number(ts));
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (same(date, today)) return 'Сегодня';
  if (same(date, yesterday)) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}
function chatBubbles(rows) {
  let html = '';
  let lastDay = '';
  for (const row of rows) {
    const day = chatDayLabel(row.createdAt);
    if (day !== lastDay) {
      lastDay = day;
      html += `<div class="chat-day-sep"><span>${esc(day)}</span></div>`;
    }
    const time = new Date(Number(row.createdAt)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="chat-line ${row.fromStaff ? 'from-staff' : 'from-me'}">
      <div class="chat-bubble">
        ${row.fromStaff ? '<b class="chat-author">Поддержка</b>' : ''}
        <p>${esc(row.message)}</p>
        <time>${esc(time)}</time>
      </div>
    </div>`;
  }
  return html;
}
async function loadChat() {
  if (!S.chatEmailReady) return;
  if (!S.me?.authenticated) {
    $('#chatbody').innerHTML = '<div class="support-system-message">Авторизуйтесь через Steam, чтобы отправить сообщение оператору.</div>';
    return;
  }
  try {
    const data = await api('/api/support/messages');
    const rows = Array.isArray(data) ? data : (data.messages || []);
    if (data.ticket?.category) { S.ticketCategory=data.ticket.category; const categorySelect=document.querySelector('#chat-category'); if(categorySelect)categorySelect.value=S.ticketCategory; }
    const body = $('#chatbody');
    body.innerHTML = rows.length
      ? chatBubbles(rows)
      : `<div class="support-welcome">Как мы можем вам помочь с ${esc(S.brand)}?</div>`;
    body.scrollTop = body.scrollHeight;
  } catch (error) {
    $('#chatbody').textContent = error.message;
  }
}
async function sendChat(event) {
  event.preventDefault();
  const input = $('#chatinput');
  const message = input.value.trim();
  if (!message) return;
  try {
    await api('/api/support/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, category: document.querySelector('#chat-category')?.value || S.ticketCategory || 'account' })
    });
    input.value = '';
    loadChat();
  } catch (error) { toast(error.message); }
}

function go(page) {
  if (S.page === 'public-profile' && page !== 'public-profile') history.pushState({}, '', '/');
  if (page === S.page) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const current = document.querySelector('.page');
  current?.classList.add('page-leave');
  setTimeout(() => {
    S.page = page;
    if (page !== 'case') { S.caseResult = null; S.rouletteItems = []; }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, current ? 150 : 0);
}
function sideTab(tab) { S.tab = tab; render(); }
function setProfileTab(tab) { S.profileTab = tab; render(); }
function login() { S.authModal = true; render(); }
function closeAuthModal() { S.authModal = false; render(); }
function toggleConsent(type) {
  if (type === 'age') S.ageAccepted = !S.ageAccepted;
  if (type === 'terms') S.termsAccepted = !S.termsAccepted;
  const mark = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.2 3.1 3.1L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  for (const key of ['age', 'terms']) {
    const button = document.querySelector(`[data-consent="${key}"]`);
    const checked = key === 'age' ? S.ageAccepted : S.termsAccepted;
    if (button) {
      button.classList.toggle('checked', checked);
      button.setAttribute('aria-checked', String(checked));
      button.innerHTML = checked ? mark : '';
    }
  }
  const submit = document.querySelector('[data-auth-submit]');
  if (submit) submit.disabled = !(S.ageAccepted && S.termsAccepted);
}
function confirmSteamLogin() {
  if (!S.ageAccepted || !S.termsAccepted) return;
  location.href = '/auth/steam';
}
async function logout() { await api('/auth/logout', { method: 'POST' }); location.reload(); }
async function openSettings() {
  try {
    S.settings = await api('/api/settings');
    S.settingsOpen = true;
    render();
  } catch (error) { toast(error.message); }
}
function closeSettings() { S.settingsOpen = false; render(); }
function selectPrivacy(value) {
  if (!S.settings) return;
  S.settings.privacy = value;
  for (const option of document.querySelectorAll?.('[data-privacy]') || []) {
    option.classList.toggle('active', option.dataset.privacy === value);
  }
}
function toggleStreamerMode() {
  if (!S.settings) return;
  S.settings.streamerMode = !S.settings.streamerMode;
  const button = document.querySelector('.settings-switch');
  if (button) {
    button.classList.toggle('active', S.settings.streamerMode);
    button.setAttribute('aria-pressed', String(S.settings.streamerMode));
  }
}
function flashCopySuccess() {
  const copyIcon = document.querySelector('#copy-icon');
  const successIcon = document.querySelector('#copy-success');
  if (!copyIcon || !successIcon) return;
  copyIcon.style.display = 'none';
  successIcon.style.display = 'block';
  setTimeout(() => {
    if (copyIcon) copyIcon.style.display = 'block';
    if (successIcon) successIcon.style.display = 'none';
  }, 1500);
}
function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); return true; }
  catch { return false; }
  finally { area.remove(); }
}
async function copyTradeLink() {
  const value = document.querySelector('#settings-trade')?.value || '';
  if (!value) return toast('Сначала вставьте трейд-ссылку', 'error');
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(value); ok = true; }
      catch { ok = legacyCopy(value); }
    } else {
      ok = legacyCopy(value);
    }
  } catch { ok = legacyCopy(value); }
  if (ok) {
    flashCopySuccess();
    toast('Трейд-ссылка скопирована', 'success');
  } else {
    toast('Не удалось скопировать ссылку', 'error');
  }
}
async function saveSettings() {
  if (!S.settings) return;
  const nickname = document.querySelector('#settings-nickname')?.value?.trim() || '';
  const tradeLink = document.querySelector('#settings-trade')?.value?.trim() || '';
  try {
    const saved = await api('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, tradeLink, privacy: S.settings.privacy, streamerMode: S.settings.streamerMode })
    });
    S.settings = saved;
    if (S.me?.user) S.me.user.name = saved.nickname;
    if (S.profile?.user) S.profile.user.name = saved.nickname;
    S.settingsOpen = false;
    render();
    toast('Настройки сохранены', 'success');
  } catch (error) { toast(error.message); }
}
function openPayment() { S.paymentOpen = true; render(); }
function closePayment() { S.paymentOpen = false; render(); }
function setPaymentTab(tab) { S.paymentTab = tab; S.paymentMethod = 0; render(); }
function selectPaymentMethod(index) { S.paymentMethod = Number(index); render(); }
function setPaymentAmount(amount) { S.paymentAmount = Number(amount); render(); }
function applyPaymentPromo() {
  const code = document.querySelector('#payment-promo')?.value?.trim() || '';
  toast(code ? 'Промокод будет проверен платёжным провайдером' : 'Введите промокод');
}
async function submitPayment() {
  const amount = Number(document.querySelector('#payment-amount')?.value || S.paymentAmount);
  const symbol = CURRENCY_BY_CODE[S.paymentCurrency]?.symbol || '₽';
  if (!Number.isFinite(amount) || amount < 50) return toast(`Минимальная сумма пополнения — 50 ${symbol}`, 'error');
  const amountCents = Math.round(amount * 100);
  try {
    const r = await api('/api/cx-deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountCents }) });
    S.paymentOpen = false;
    S.me.user.balanceCents = r.balanceCents;
    if (S.me?.authenticated) {
      try { S.cxWeekly = await api('/api/cx-weekly'); } catch(_e){}
    }
    render();
    toast('Баланс пополнен на ' + money(r.amountCents), 'success');
  } catch (e) { toast(e.message || 'Ошибка пополнения', 'error'); }
}
async function openChat() {
  try {
    const contact = await api('/api/support/contact');
    const localEmail = typeof localStorage !== 'undefined' ? (localStorage.getItem('keyser-support-email') || '') : '';
    S.chatEmail = contact.email || localEmail;
    S.chatEmailReady = !!S.chatEmail;
  } catch {
    S.chatEmail = '';
    S.chatEmailReady = false;
  }
  S.chat = true;
  render();
}
async function submitSupportEmail() {
  const email = document.querySelector('#support-email')?.value?.trim().toLowerCase() || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return toast('Введите корректный email', 'error');
  try {
    if (S.me?.authenticated) await api('/api/support/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    if (typeof localStorage !== 'undefined') localStorage.setItem('keyser-support-email', email);
    S.chatEmail = email;
    S.chatEmailReady = true;
    render();
  } catch (error) { toast(error.message); }
}
function closeChat() { S.chat = false; render(); }
function setTicketCategory(value){S.ticketCategory=value;}
const TOAST_LIFETIME = 2800;
const TOAST_LIMIT = 3;
const TOAST_GLYPH = { error: '!', success: '✓', '': 'i' };

function toastRoot() {
  let root = $('#toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);
  }
  return root;
}

function dismissToast(node) {
  if (!node || node.dataset.leaving === '1') return;
  node.dataset.leaving = '1';
  clearTimeout(Number(node.dataset.timer));
  node.classList.add('is-leaving');
  setTimeout(() => node.remove(), 200);
}

function toast(text, type = '') {
  const message = String(text ?? '').trim();
  if (!message) return;
  const kind = type === 'error' || type === 'success' ? type : '';
  const root = toastRoot();
  const live = [...root.children].filter(node => node.dataset.leaving !== '1');

  const twin = live.find(node => node.dataset.key === `${kind}|${message}`);
  if (twin) {
    clearTimeout(Number(twin.dataset.timer));
    twin.classList.remove('is-pulse');
    void twin.offsetWidth;
    twin.classList.add('is-pulse');
    twin.dataset.timer = String(setTimeout(() => dismissToast(twin), TOAST_LIFETIME));
    return;
  }

  live.slice(0, Math.max(0, live.length - TOAST_LIMIT + 1)).forEach(dismissToast);

  const node = document.createElement('div');
  node.className = `toast ${kind}`.trim();
  node.dataset.key = `${kind}|${message}`;
  node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  node.innerHTML = `<i class="cx-toast-ico" aria-hidden="true">${TOAST_GLYPH[kind]}</i><span class="cx-toast-text">${esc(message)}</span>`;
  node.addEventListener('click', () => dismissToast(node));
  root.appendChild(node);
  node.dataset.timer = String(setTimeout(() => dismissToast(node), TOAST_LIFETIME));
}

Object.assign(window, {
  go, sideTab, setProfileTab, choose, setBoost, setAddBalance, applyTargetFilters, setTargetPage, sendToUpgrade, sellItem, toggleSellMode, toggleSellItem, sellSelectAll, sellSelectedItems, cxAskSellAll, cxCancelSellAll, cxDoSellAll, cxClaimWeekly, toggleProfileSort, setProfileSort, selectCase, openCase, upgrade,
  login, closeAuthModal, toggleConsent, confirmSteamLogin, logout,
  openSettings, closeSettings, selectPrivacy, toggleStreamerMode, copyTradeLink, saveSettings,
  openPayment, closePayment, setPaymentTab, selectPaymentMethod, setPaymentAmount, applyPaymentPromo, submitPayment,
  openChat, submitSupportEmail, closeChat, sendChat, setTicketCategory,
  toggleTurbo, toggleSoundBtn, toggleCurrencyMenu, setPaymentCurrency, toggleFooterLang, setFooterLang,
  closeUpgradeResult, closeCaseReveal, openInventory, openPublicProfile, acceptCookies, rejectCookies, toggleSidebar
});
function notificationSeenIds() {
  try {
    const value = JSON.parse(localStorage.getItem('keyser-seen-notifications') || '[]');
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}
function closeNotifications(immediate = false) {
  const overlay = document.querySelector('[data-notifications-overlay]');
  if (!overlay) return;
  if (immediate) {
    overlay.remove();
    return;
  }
  if (overlay.classList.contains('notifications-closing')) return;
  overlay.classList.add('notifications-closing');
  const remove = () => overlay.remove();
  overlay.addEventListener('animationend', remove, { once: true });
  setTimeout(remove, 260);
}
async function openNotifications() {
  try {
    const data = await api('/api/notifications');
    const list = (data.notifications || []).filter(n => {
      if (n.audience === 'guests' && S.me?.authenticated) return false;
      if (n.audience === 'authenticated' && !S.me?.authenticated) return false;
      if (n.audience === 'staff' && !['admin','support'].includes(S.me?.user?.role)) return false;
      return true;
    });
    S.notifications = list.slice(0, 20);
    closeNotifications(true);
    const body = S.notifications.length
      ? S.notifications.map(n => `<article class="notification-item notification-${esc(n.kind || 'info')}"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><time>${new Date(n.createdAt).toLocaleString('ru-RU')}</time></article>`).join('')
      : '<div class="notifications-empty">Уведомлений пока нет</div>';
    document.body.insertAdjacentHTML('beforeend', `<div class="notifications-overlay" data-notifications-overlay><div class="notifications-panel fixed-notifications" role="dialog" aria-modal="true" aria-label="Уведомления"><div class="notifications-head"><span>Уведомления</span><div class="notifications-count">${S.notifications.length}</div></div><div class="notifications-list">${body}</div><div class="notifications-foot"><button type="button" onclick="closeNotifications()" aria-label="Закрыть"><img src="/chunks/arrowDownIcon.svg" alt=""></button></div></div></div>`);
    const overlay = document.querySelector('[data-notifications-overlay]');
    translateDom(overlay);
    overlay?.addEventListener('click', event => { if (event.target === overlay) closeNotifications(); });
    const seen = notificationSeenIds();
    S.notifications.forEach(n => seen.add(n.id));
    localStorage.setItem('keyser-seen-notifications', JSON.stringify([...seen].slice(-100)));
    S.unreadNotifications = 0;
    const badge = document.querySelector('#notification-trigger span');
    if (badge) badge.remove();
  } catch (error) { toast(error.message, 'error'); }
}
window.addEventListener('keydown', event => { if (event.key === 'Escape') closeNotifications(); });
Object.assign(window, { openNotifications, closeNotifications });
boot();
