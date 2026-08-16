'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

const FROM = process.env.SMTP_FROM || process.env.MAIL_FROM || '';
const HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || '';
const PORT = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
const USER = process.env.SMTP_USER || process.env.MAIL_USER || '';
const PASS = process.env.SMTP_PASS || process.env.MAIL_PASS || '';
const SECURE = /^(true|1|yes|ssl)$/i.test(String(process.env.SMTP_SECURE || '')) || PORT === 465;
const APP_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

let transporter = null;
let lastError = '';

function configured() {
  return !!(nodemailer && HOST && FROM);
}

function getTransport() {
  if (!configured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: SECURE,
    auth: USER ? { user: USER, pass: PASS } : undefined,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    socketTimeout: 20000,
    connectionTimeout: 15000
  });
  return transporter;
}

function unsubscribeToken(userId) {
  const secret = process.env.SESSION_SECRET || 'unsubscribe-secret';
  return crypto.createHmac('sha256', secret).update(`mail:${userId}`).digest('hex').slice(0, 32);
}
function verifyUnsubscribeToken(userId, token) {
  const expected = unsubscribeToken(userId);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function unsubscribeUrl(userId) {
  return `${APP_URL.replace(/\/+$/, '')}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}

function wrapHtml(body) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0b0f;color:#e6e9ee;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0f;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#12151f;border:1px solid rgba(86,168,255,.18);border-radius:10px;overflow:hidden;">
        <tr><td style="padding:22px 28px;background:linear-gradient(180deg,#1b2436,#12151f);border-bottom:1px solid rgba(86,168,255,.18);">
          <span style="font-size:20px;font-weight:800;letter-spacing:.06em;color:#fff;">КЕЙСЕР</span>
        </td></tr>
        <tr><td style="padding:28px;color:#dce5f1;font-size:14px;line-height:1.6;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid rgba(86,168,255,.12);color:#8d97a4;font-size:12px;">
          Вы получили это письмо, потому что зарегистрированы на сайте.<br>
          <a href="\${unsubscribeLink}" style="color:#56a8ff;text-decoration:none;">Отписаться от рассылки</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendMail({ to, subject, html, text, userId }) {
  if (!to) throw new Error('Не указан адрес получателя');
  const transport = getTransport();
  if (!transport) {
    const reason = !nodemailer
      ? 'nodemailer не установлен'
      : (!HOST ? 'SMTP_HOST не задан' : 'SMTP_FROM не задан');
    const err = new Error(`Почта не настроена: ${reason}`);
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
  const unsub = userId ? unsubscribeUrl(userId) : '';
  const rendered = html
    ? wrapHtml(html).replace('${unsubscribeLink}', unsub || APP_URL)
    : undefined;
  const info = await transport.sendMail({
    from: FROM,
    to,
    subject,
    text: text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''),
    html: rendered,
    headers: unsub ? { 'List-Unsubscribe': `<${unsub}>` } : undefined
  });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

function describe() {
  if (!configured()) return 'почта отключена (нет SMTP_HOST/SMTP_FROM)';
  return `SMTP ${USER ? 'AUTH' : 'open'} → ${HOST}:${PORT}${SECURE ? '/SSL' : ''} от ${FROM}`;
}

module.exports = {
  sendMail,
  configured,
  describe,
  unsubscribeToken,
  verifyUnsubscribeToken,
  lastError: () => lastError
};
