#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'cases-catalog.json'), 'utf8'));

const flat = [];
const newIds = [];
const sections = [];
for (const section of catalog.sections) {
  const ids = [];
  for (const c of section.cases) {
    const imgPath = path.join(ROOT, 'cases', 'cases', c.img);
    if (!fs.existsSync(imgPath)) {
      console.error(`[catalog] НЕТ ФАЙЛА иконки: cases/cases/${c.img} (кейс ${c.id})`);
      process.exit(1);
    }
    flat.push({ ...c, section: section.title });
    ids.push(c.id);
    if (c.isNew) newIds.push(c.id);
  }
  sections.push({ title: section.title, ids });
}
console.log(`[catalog] кейсов: ${flat.length}, секций: ${sections.length}, NEW: ${newIds.length}`);

const serverPath = path.join(ROOT, 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');

const entries = flat.map(c => `  { id: ${JSON.stringify(c.id)}, name: ${JSON.stringify(c.name)}, section: ${JSON.stringify(c.section)}, coins: ${c.coins}, image: ${JSON.stringify('/cases/cases/' + c.img)} }`);
const defaultCasesBlock = `const CASE_CATALOG = [\n${entries.join(',\n')}\n];\n\nconst DEFAULT_CASES = buildDefaultCases();`;

const startAnchor = 'const CASE_CATALOG = [';
const endAnchor = 'const DEFAULT_CASES = buildDefaultCases();';
const startIdx = server.indexOf(startAnchor);
const endIdx = server.indexOf(endAnchor);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error('[catalog] не найден блок CASE_CATALOG в server.js');
  process.exit(1);
}
server = server.slice(0, startIdx) + defaultCasesBlock + server.slice(endIdx + endAnchor.length);
fs.writeFileSync(serverPath, server);
console.log('[catalog] server.js обновлён (DEFAULT_CASES)');

const spaPath = path.join(ROOT, 'static', 'js', 'app.js');
let spa = fs.readFileSync(spaPath, 'utf8');

const begin = 'const CASE_SHOP_SECTIONS = ';
const end = 'function casePriceTag(';
const bIdx = spa.indexOf(begin);
const eIdx = spa.indexOf(end);
if (bIdx === -1 || eIdx === -1 || eIdx < bIdx) {
  console.error('[catalog] не найден блок CASE_SHOP_SECTIONS в SPA JS');
  process.exit(1);
}
const frontBlock = `const CASE_SHOP_SECTIONS = ${JSON.stringify(sections, null, 1)};
const CASE_SECTION_BY_ID = new Map();
for (const section of CASE_SHOP_SECTIONS) for (const id of section.ids) CASE_SECTION_BY_ID.set(id, section.title);
const CASE_NEW_IDS = new Set(${JSON.stringify(newIds)});

`;
spa = spa.slice(0, bIdx) + frontBlock + spa.slice(eIdx);
fs.writeFileSync(spaPath, spa);
console.log('[catalog] SPA JS обновлён (CASE_SHOP_SECTIONS)');
console.log('[catalog] готово');
