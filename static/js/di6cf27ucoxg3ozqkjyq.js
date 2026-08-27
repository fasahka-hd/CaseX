(function () {
  'use strict';

  const base = new URL(document.baseURI);
  const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
  const locales = new Set(['ru', 'en', 'ua', 'kz', 'be']);
  const statusMessages = {
    400: 'Запрос содержит некорректные данные',
    401: 'Сессия истекла. Войдите через Steam снова',
    403: 'Доступ к операции запрещён',
    404: 'Запрошенные данные не найдены',
    409: 'Состояние изменилось в другой вкладке. Данные будут обновлены',
    422: 'Операция недоступна с текущими параметрами',
    423: 'Аккаунт временно заморожен',
    428: 'Защитный идентификатор операции отсутствует',
    429: 'Слишком много запросов. Попробуйте позже',
    500: 'Сервер не смог завершить операцию',
    503: 'Сервис временно недоступен'
  };

  function appUrl(pathname) {
    const clean = String(pathname || '').replace(/^\/+/, '');
    const value = new URL(clean, base);
    return `${value.pathname}${value.search}${value.hash}`;
  }

  function relativePath() {
    let value = location.pathname;
    const prefix = basePath.replace(/\/$/, '');
    if (prefix && value.startsWith(prefix)) value = value.slice(prefix.length);
    return value.replace(/^\/+|\/+$/g, '');
  }

  function parseRoute() {
    const segments = relativePath().split('/').filter(Boolean);
    const locale = locales.has(String(segments[0] || '').toLowerCase()) ? segments.shift().toLowerCase() : 'ru';
    const route = String(segments.shift() || 'upgrade').toLowerCase();
    if (route === 'cases' && segments[0]) return { locale, page: 'case', id: decodeURIComponent(segments[0]), params: segments.slice(1), query: new URLSearchParams(location.search) };
    if (route === 'profile' && /^\d+$/.test(segments[0] || '')) return { locale, page: 'public-profile', id: segments[0], params: segments.slice(1), query: new URLSearchParams(location.search) };
    const page = ['cases', 'upgrade', 'rewards', 'steal', 'profile', 'inventory'].includes(route) ? route : 'upgrade';
    return { locale, page, id: null, params: segments, query: new URLSearchParams(location.search) };
  }

  function routePath(locale, page, id) {
    const language = locales.has(String(locale || '').toLowerCase()) ? String(locale).toLowerCase() : 'ru';
    let route = page;
    if (page === 'case') route = `cases/${encodeURIComponent(id || '')}`;
    if (page === 'public-profile') route = `profile/${encodeURIComponent(id || '')}`;
    if (page === 'inventory') route = 'profile';
    return appUrl(`${language}/${route}`);
  }

  function randomId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function operationStorageKey(scope, entity) {
    return `casex:operation:${scope}:${String(entity || 'default')}`;
  }

  function operationId(scope, entity) {
    const key = operationStorageKey(scope, entity);
    try {
      const existing = JSON.parse(localStorage.getItem(key) || 'null');
      if (existing?.id && Date.now() - Number(existing.createdAt || 0) < 10 * 60 * 1000) return existing.id;
    } catch {}
    const id = `${scope}:${randomId()}`;
    try { localStorage.setItem(key, JSON.stringify({ id, createdAt: Date.now() })); } catch {}
    return id;
  }

  function completeOperation(scope, entity, id) {
    const key = operationStorageKey(scope, entity);
    try {
      const existing = JSON.parse(localStorage.getItem(key) || 'null');
      if (!id || existing?.id === id) localStorage.removeItem(key);
    } catch {
      try { localStorage.removeItem(key); } catch {}
    }
  }

  class ApiRequestError extends Error {
    constructor(message, response, data) {
      super(message);
      this.name = 'ApiRequestError';
      this.status = Number(response?.status || 0);
      this.code = data?.code || '';
      this.details = data?.details;
      this.retryable = !this.status || [409, 429, 500, 503].includes(this.status);
    }
  }

  async function fetchJson(pathname, options = {}) {
    const opts = { ...options, credentials: 'same-origin' };
    const method = String(opts.method || 'GET').toUpperCase();
    const headers = new Headers(opts.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('X-CaseX-Request', '1');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && opts.csrfToken) headers.set('X-CSRF-Token', opts.csrfToken);
    if (opts.idempotencyKey) headers.set('Idempotency-Key', opts.idempotencyKey);
    delete opts.csrfToken;
    delete opts.idempotencyKey;
    opts.headers = headers;
    if (!opts.signal && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opts.signal = AbortSignal.timeout(method === 'GET' ? 30000 : 45000);
    let response;
    try {
      response = await fetch(appUrl(pathname), opts);
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new ApiRequestError('Сервер долго не отвечает. Повтор операции безопасен', null, { code: 'REQUEST_TIMEOUT' });
      throw new ApiRequestError('Нет соединения с сервером', null, { code: 'NETWORK_ERROR' });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiRequestError(data.error || statusMessages[response.status] || `Ошибка запроса ${response.status}`, response, data);
    return data;
  }

  function resultValues(results, fallbacks) {
    return results.map((result, index) => result.status === 'fulfilled' ? result.value : fallbacks[index]);
  }

  function enhanceImages(root) {
    if (!root) return;
    for (const image of root.querySelectorAll('img:not([data-image-ready])')) {
      image.dataset.imageReady = '1';
      const fail = () => {
        const fallback = image.dataset.fb;
        const fallbackUrl = fallback ? appUrl(fallback) : '';
        if (fallbackUrl && image.src !== new URL(fallbackUrl, location.href).href) {
          image.dataset.fb = '';
          image.src = fallbackUrl;
          return;
        }
        image.classList.add('img-failed');
        image.removeAttribute('srcset');
      };
      image.addEventListener('error', fail, { once: false });
      if (image.complete && image.naturalWidth === 0) fail();
      if (image.loading !== 'lazy') {
        const timer = setTimeout(() => {
          if (!image.complete || image.naturalWidth === 0) fail();
        }, 12000);
        image.addEventListener('load', () => clearTimeout(timer), { once: true });
      }
    }
  }

  let previousFocus = null;
  let activeDialog = null;
  let dialogListener = null;

  function rememberFocus() {
    if (document.activeElement instanceof HTMLElement) previousFocus = document.activeElement;
  }

  function restoreFocus() {
    const target = previousFocus;
    previousFocus = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  function syncDialog(root) {
    const dialogs = [...(root || document).querySelectorAll('[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"]')];
    const dialog = dialogs.at(-1) || null;
    if (dialog === activeDialog) return;
    if (dialogListener) document.removeEventListener('keydown', dialogListener, true);
    activeDialog = dialog;
    dialogListener = null;
    if (!dialog) return;
    dialogListener = event => {
      if (!activeDialog?.isConnected) return;
      if (event.key === 'Escape') {
        const close = activeDialog.querySelector('[data-dialog-cancel],[aria-label="Закрыть"]');
        if (close && !close.disabled) {
          event.preventDefault();
          close.click();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...activeDialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element => element.offsetParent !== null);
      if (!controls.length) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', dialogListener, true);
    requestAnimationFrame(() => {
      const target = dialog.querySelector('[autofocus],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]');
      if (target && !dialog.contains(document.activeElement)) target.focus({ preventScroll: true });
    });
  }

  class RealtimeClient {
    constructor(pathname, handlers = {}, statusHandler = () => {}) {
      this.pathname = pathname;
      this.handlers = handlers;
      this.statusHandler = statusHandler;
      this.source = null;
      this.retry = 1000;
      this.timer = null;
      this.watchdog = null;
      this.closed = false;
      this.lastEventAt = 0;
    }

    setStatus(status) {
      this.status = status;
      this.statusHandler(status);
    }

    connect() {
      if (this.closed || this.source) return;
      this.setStatus('CONNECTING');
      const source = new EventSource(appUrl(this.pathname));
      this.source = source;
      const touch = () => {
        this.lastEventAt = Date.now();
      };
      source.addEventListener('open', () => {
        touch();
        this.retry = 1000;
        this.setStatus('CONNECTED');
      });
      for (const [type, handler] of Object.entries(this.handlers)) {
        source.addEventListener(type, event => {
          touch();
          let payload;
          try { payload = JSON.parse(event.data); } catch { return; }
          try { handler(payload, event); } catch {}
        });
      }
      source.addEventListener('connected', touch);
      source.addEventListener('heartbeat', touch);
      source.onerror = () => this.reconnect();
      clearInterval(this.watchdog);
      this.watchdog = setInterval(() => {
        if (this.lastEventAt && Date.now() - this.lastEventAt > 70000) this.reconnect();
      }, 15000);
    }

    reconnect() {
      if (this.closed) return;
      this.source?.close();
      this.source = null;
      this.setStatus('ERROR');
      clearTimeout(this.timer);
      const delay = Math.min(30000, this.retry) + Math.floor(Math.random() * 500);
      this.retry = Math.min(30000, this.retry * 2);
      this.setStatus('BACKOFF');
      this.timer = setTimeout(() => this.connect(), delay);
    }

    close() {
      this.closed = true;
      clearTimeout(this.timer);
      clearInterval(this.watchdog);
      this.source?.close();
      this.source = null;
      this.setStatus('DISCONNECTED');
    }
  }

  window.CaseXCore = {
    appUrl,
    parseRoute,
    routePath,
    operationId,
    completeOperation,
    fetchJson,
    resultValues,
    enhanceImages,
    rememberFocus,
    restoreFocus,
    syncDialog,
    RealtimeClient,
    ApiRequestError
  };
})();
