'use strict';

// Steam OpenID normally starts with a GET redirect. Some Akamai edges currently
// reject the long /openid/login?... URL with Reference #18. We start the same
// OpenID request as a POST form instead, keeping the browser on the normal Steam
// login page while avoiding the blocked query-string redirect.
const express = require('express');

const originalGet = express.application.get;
express.application.get = function patchedGet(path, ...handlers) {
  if (path === '/auth/steam' && handlers.length) {
    const steamLoginHandler = (req, res) => {
      const rawBase = String(process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).trim().replace(/\\/+$/, '');
      const base = /^https?:\\/\\//i.test(rawBase) ? rawBase : `https://${rawBase}`;
      const callback = `${base}/auth/steam/callback`;
      const fields = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': callback,
        'openid.realm': base,
        'openid.ns.sreg': 'http://openid.net/extensions/sreg/1.1',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select'
      };
      const escapeHtml = value => String(value).replace(/[&<>\"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
      }[c]));
      const inputs = Object.entries(fields)
        .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
        .join('');
      const fallback = `https://steamcommunity.com/openid/login?${new URLSearchParams(fields).toString()}`;
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Вход через Steam</title></head>
<body style="margin:0;background:#0a0b0f;color:#fff;font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;min-height:100vh">
<form id="steam-openid" action="https://steamcommunity.com/openid/login" method="post">
${inputs}
<noscript><button type="submit">Продолжить в Steam</button></noscript>
</form>
<div style="text-align:center;color:#aab4c0">Переходим в Steam…<br><a style="color:#56a8ff" href="${escapeHtml(fallback)}">Если переход не сработал, нажмите здесь</a></div>
<script>document.getElementById('steam-openid').submit();</script>
</body></html>`);
    };
    return originalGet.call(this, path, steamLoginHandler);
  }
  return originalGet.call(this, path, ...handlers);
};
