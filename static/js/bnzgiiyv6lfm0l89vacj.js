(function () {
  'use strict';

  function closeDialog(result) {
    const overlay = document.querySelector('[data-custom-confirm]');
    if (!overlay) return;
    const resolve = overlay._resolve;
    overlay.classList.add('is-closing');
    setTimeout(() => overlay.remove(), 140);
    if (resolve) resolve(result);
  }

  window.customConfirm = function customConfirm(message, options = {}) {
    document.querySelector('[data-custom-confirm]')?.remove();
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'custom-dialog-overlay';
      overlay.dataset.customConfirm = '';
      overlay._resolve = resolve;
      const title = options.title || 'Подтверждение';
      const confirmText = options.confirmText || 'Подтвердить';
      const cancelText = options.cancelText || 'Отмена';
      const icon = options.danger ? '!' : '?';
      const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[char]));
      overlay.innerHTML = `<section class="custom-dialog ${options.danger ? 'is-danger' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="custom-dialog-title" aria-describedby="custom-dialog-message">
        <div class="custom-dialog-icon">${icon}</div>
        <div class="custom-dialog-copy"><h2 id="custom-dialog-title">${safe(title)}</h2><p id="custom-dialog-message">${safe(message)}</p></div>
        <div class="custom-dialog-actions"><button type="button" class="custom-dialog-cancel">${safe(cancelText)}</button><button type="button" class="custom-dialog-confirm">${safe(confirmText)}</button></div>
      </section>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => closeDialog(false));
      overlay.querySelector('.custom-dialog-confirm').addEventListener('click', () => closeDialog(true));
      overlay.addEventListener('click', event => { if (event.target === overlay) closeDialog(false); });
      overlay.querySelector('.custom-dialog-confirm').focus();
    });
  };

  document.addEventListener('keydown', event => {
    if (!document.querySelector('[data-custom-confirm]')) return;
    if (event.key === 'Escape') closeDialog(false);
    if (event.key === 'Enter') closeDialog(true);
  });
})();
