(function () {
  'use strict';

  let active = null;

  function safe(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  function closeDialog(result) {
    const overlay = active;
    if (!overlay || overlay.dataset.closed === '1') return;
    overlay.dataset.closed = '1';
    active = null;
    const resolve = overlay._resolve;
    const previous = overlay._previousFocus;
    overlay.classList.add('is-closing');
    const remove = () => {
      overlay.remove();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      window.CaseXCore?.syncDialog(document);
    };
    overlay.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 180);
    resolve?.(Boolean(result));
  }

  window.customConfirm = function customConfirm(message, options = {}) {
    if (active) closeDialog(false);
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      const identity = `custom-dialog-${Date.now().toString(36)}`;
      overlay.className = 'custom-dialog-overlay';
      overlay.dataset.customConfirm = '';
      overlay._resolve = resolve;
      overlay._previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      overlay.innerHTML = `<section class="custom-dialog ${options.danger ? 'is-danger' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="${identity}-title" aria-describedby="${identity}-message" tabindex="-1">
        <div class="custom-dialog-icon" aria-hidden="true">${options.danger ? '!' : '?'}</div>
        <div class="custom-dialog-copy"><h2 id="${identity}-title">${safe(options.title || 'Подтверждение')}</h2><p id="${identity}-message">${safe(message)}</p></div>
        <div class="custom-dialog-actions"><button type="button" class="custom-dialog-cancel" data-dialog-cancel>${safe(options.cancelText || 'Отмена')}</button><button type="button" class="custom-dialog-confirm">${safe(options.confirmText || 'Подтвердить')}</button></div>
      </section>`;
      active = overlay;
      document.body.appendChild(overlay);
      overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => closeDialog(false));
      overlay.querySelector('.custom-dialog-confirm').addEventListener('click', () => closeDialog(true));
      overlay.addEventListener('click', event => {
        if (event.target === overlay) closeDialog(false);
      });
      window.CaseXCore?.syncDialog(document);
      requestAnimationFrame(() => overlay.querySelector('.custom-dialog-cancel')?.focus());
    });
  };
})();
