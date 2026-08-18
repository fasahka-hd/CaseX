'use strict';

const express = require('express');

const originalGet = express.application.get;
express.application.get = function patchedGet(path, ...handlers) {
  if (path === '/auth/dev' || (Array.isArray(path) && path.includes('/auth/dev'))) {
    return this;
  }
  return originalGet.call(this, path, ...handlers);
};

const originalSend = express.response.send;
express.response.send = function patchedSend(body) {
  if (typeof body === 'string' && body.includes('/auth/dev')) {
    body = body
      .replace(/<a[^>]*href=["']\/auth\/dev["'][^>]*>.*?<\/a>/gis, '')
      .replace(/<a[^>]*href=["']\/auth\/dev["'][^>]*>.*?<\/a>/gis, '')
      .replace(/\s*[^<]{0,80}\/auth\/dev[^<]{0,120}/gi, '');
  }
  return originalSend.call(this, body);
};
