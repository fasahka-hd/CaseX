'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'data', 'cases', 'chunks', 'deploy', 'docs']);
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

function collect(dir, found = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) collect(path.join(dir, entry.name), found);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

const files = collect(ROOT).sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`✗ ${path.relative(ROOT, file)}`);
    const output = String(result.stderr || result.stdout || '').trim();
    if (output) console.error(output.split('\n').slice(0, 6).join('\n'));
  }
}
console.log(failed ? `\nСинтаксических ошибок: ${failed}` : `Синтаксис OK (${files.length} файлов)`);
process.exit(failed ? 1 : 0);
