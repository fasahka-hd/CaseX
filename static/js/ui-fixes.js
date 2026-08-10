(function () {
  const originalHeader = window.header;
  const originalSidebar = window.sidebar;
  const originalUpgradePage = window.upgradePage;

  const icon = (name, cls) => `<img class="chunk-icon ${cls || ''}" src="/chunks/${name}.svg" alt="" aria-hidden="true">`;

  window.header = function () {
    let html = originalHeader();
    html = html.replace(
      /<a class="telegram"[\s\S]*?<\/a>/,
      `<a class="telegram" href="${esc(S.telegram)}" target="_blank" rel="noopener">${icon('telegramIcon','telegram-icon')}</a>`
    );
    return html;
  };

  window.sidebar = function () {
    let html = originalSidebar();
    html = html.replace(
      /<div class="site-online">[\s\S]*?<\/div>/,
      `<div class="site-online">${icon('online','online-icon')}<div class="online-copy"><span>НА САЙТЕ</span><b>${S.online}</b></div></div>`
    );
    return html;
  };

  function settingsMarkup() {
    const sound = localStorage.getItem('keyser-sound') !== '0';
    const motion = localStorage.getItem('keyser-motion') !== '0';
    return `<div class="settings-pop" id="upgrade-settings">
      <label><span>Звуки</span><input type="checkbox" ${sound ? 'checked' : ''} onchange="toggleSound(this.checked)"></label>
      <label><span>Анимация</span><input type="checkbox" ${motion ? 'checked' : ''} onchange="toggleMotion(this.checked)"></label>
    </div>`;
  }

  window.toggleSound = function (enabled) {
    localStorage.setItem('keyser-sound', enabled ? '1' : '0');
    render();
  };

  window.toggleMotion = function (enabled) {
    localStorage.setItem('keyser-motion', enabled ? '1' : '0');
    render();
  };

  window.toggleSettings = function () {
    const el = document.querySelector('#upgrade-settings');
    if (el) el.classList.toggle('open');
  };

  window.upgradePage = function () {
    let html = originalUpgradePage();
    html = html.replace(
      /<div class="notice">[\s\S]*?<\/div><section class="upgrid">/,
      `<div class="upgrade-tools">
        <button class="sound-btn" onclick="toggleSound(localStorage.getItem('keyser-sound') === '0')" title="Звук">🔊<span>ЗВУК</span></button>
        <button class="settings-btn" onclick="toggleSettings()" title="Настройки">⚙</button>
        ${settingsMarkup()}
      </div><section class="upgrid">`
    );

    const chance = S.chance == null ? 0 : S.chance;
    const spinning = S.spinning && localStorage.getItem('keyser-motion') !== '0';
    html = html.replace(
      /<div class="wheelbox">[\s\S]*?<\/div><div class="panel">/,
      `<div class="wheelbox"><div class="wheelhead"><span>ШАНС АПГРЕЙДА</span><b>${chance}%</b></div><div class="wheel ${spinning ? 'spin' : ''}" style="--chance:${chance}%;--angle:${spinning ? '1440deg' : '0deg'}"><i class="pointer"></i><div class="wheelcenter"><strong>${chance}%</strong><span>${chance === 0 ? 'выберите предметы' : 'расчёт по стоимости'}</span></div></div><button class="upgrade" ${!S.from || !S.to || S.spinning ? 'disabled' : ''} onclick="upgrade()">${S.spinning ? 'АПГРЕЙД...' : 'АПГРЕЙД'}</button><div class="under">${S.from && S.to ? money(S.from.priceCents)+' → '+money(S.to.priceCents) : 'Выберите предмет слева и цель справа'}</div></div><div class="panel">`
    );
    return html;
  };

})();
