/* CaseX Figma navigation layer. Keeps existing app logic and routes intact. */
(function () {
  'use strict';

  const NAV = [
    { page: 'cases', label: 'CASE', icon: '/chunks/cases.svg' },
    { page: 'upgrade', label: 'UPGRADE', icon: '/chunks/upgrade.svg' },
    { page: 'steal', label: 'WHEEL', icon: '/static/media/wheel-icon.0208491142afd52d68d1.png' },
    { page: 'rewards', label: 'REWARD', icon: '/static/media/gift.0afe2fe566b54243c42d.svg' }
  ];

  function goPage(page) {
    if (typeof window.go === 'function') window.go(page);
  }

  function ensureSidebar() {
    let rail = document.querySelector('.cx-figma-sidebar');
    if (!rail) {
      rail = document.createElement('aside');
      rail.className = 'cx-figma-sidebar';
      rail.setAttribute('aria-label', 'Основная навигация');
      document.body.appendChild(rail);
    }
    if (!rail.children.length) {
      rail.innerHTML = NAV.map(item => `
        <button type="button" class="cx-figma-nav-item" data-cx-page="${item.page}" aria-label="${item.label}">
          <img src="${item.icon}" alt="">
          <span>${item.label}</span>
        </button>`).join('');
      rail.addEventListener('click', event => {
        const button = event.target.closest('[data-cx-page]');
        if (!button) return;
        goPage(button.dataset.cxPage);
      });
    }
  }

  function ensureTopCards() {
    const top = document.querySelector('.top');
    if (!top || document.querySelector('.cx-figma-topcards')) return;
    const cards = document.createElement('div');
    cards.className = 'cx-figma-topcards';
    cards.innerHTML = `
      <button type="button" class="cx-figma-topcard giveaway" onclick="go('rewards')">РОЗЫГРЫШЫ</button>
      <button type="button" class="cx-figma-topcard inventory" onclick="go('profile')">ИНВЕНТАРЬ</button>`;
    top.insertBefore(cards, top.querySelector('.actions'));
  }

  function syncActive() {
    const page = document.querySelector('.page')?.dataset.page || '';
    document.querySelectorAll('.cx-figma-nav-item').forEach(button => {
      const active = button.dataset.cxPage === page || (button.dataset.cxPage === 'cases' && page === 'case');
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function sync() {
    ensureSidebar();
    ensureTopCards();
    syncActive();
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function') {
    window.render = function () {
      const result = originalRender.apply(this, arguments);
      requestAnimationFrame(sync);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', sync);
  window.addEventListener('load', sync);
  setTimeout(sync, 0);
  setTimeout(sync, 500);
})();
