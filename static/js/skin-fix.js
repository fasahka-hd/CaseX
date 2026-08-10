(() => {
  const originalFetch = window.fetch.bind(window);
  const wearNames = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' };
  let skinMapPromise = null;

  function fullSkinName(item) {
    if (!item || typeof item !== 'object') return '';
    const raw = String(item.name || item.market_hash_name || '').trim();
    if (!raw) return '';
    if (/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/.test(raw)) return raw;
    const wear = wearNames[String(item.wear || '').toUpperCase()];
    return wear ? `${raw} (${wear})` : raw;
  }

  function baseSkinName(item) {
    const raw = fullSkinName(item);
    return raw.replace(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, '');
  }

  function loadSkinMap() {
    if (skinMapPromise) return skinMapPromise;
    skinMapPromise = originalFetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json', { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Skin API HTTP ${response.status}`);
        return response.json();
      })
      .then(skins => {
        const exact = new Map();
        const base = new Map();
        for (const skin of Array.isArray(skins) ? skins : []) {
          if (!skin?.image) continue;
          if (skin.market_hash_name) exact.set(String(skin.market_hash_name).trim(), skin.image);
          if (skin.name && !base.has(String(skin.name).trim())) base.set(String(skin.name).trim(), skin.image);
        }
        return { exact, base };
      })
      .catch(error => {
        console.warn('[skin-fix] skin catalog unavailable:', error);
        return { exact: new Map(), base: new Map() };
      });
    return skinMapPromise;
  }

  function fixItem(item, maps) {
    if (!item || typeof item !== 'object') return item;
    const exact = maps.exact.get(fullSkinName(item));
    const base = maps.base.get(baseSkinName(item));
    const image = exact || base;
    return image ? { ...item, icon: image, itemIcon: image } : item;
  }

  function fixPayload(payload, maps) {
    if (Array.isArray(payload)) return payload.map(item => fixItem(item, maps));
    if (!payload || typeof payload !== 'object') return payload;
    const result = { ...payload };
    if (Array.isArray(result.items)) result.items = result.items.map(item => fixItem(item, maps));
    if (Array.isArray(result.cases)) result.cases = result.cases.map(item => {
      if (!item || typeof item !== 'object') return item;
      return { ...item, ...(Array.isArray(item.items) ? { items: item.items.map(entry => fixItem(entry, maps)) } : {}) };
    });
    if (Array.isArray(result.drops)) result.drops = result.drops.map(item => fixItem(item, maps));
    return result;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (!/\/api\/(catalog|inventory|live-drops)(?:\?|$)/.test(requestUrl)) return response;
    try {
      const maps = await loadSkinMap();
      const payload = await response.clone().json();
      const fixed = fixPayload(payload, maps);
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(fixed), { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      console.warn('[skin-fix] response left unchanged:', error);
      return response;
    }
  };
})();
