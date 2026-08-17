'use strict';

const path = require('path');
const { spawn } = require('child_process');

const mode = process.argv[2] || 'default';
const env = { ...process.env };

if (mode === 'pg') {
  env.DB_DRIVER = 'postgres';
  env.REDIS_ENABLED = env.REDIS_ENABLED === '0' ? '0' : '1';
}

const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env,
  stdio: 'inherit'
});

child.on('exit', code => process.exit(code == null ? 0 : code));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    try { child.kill(signal); } catch (_) {}
  });
}
