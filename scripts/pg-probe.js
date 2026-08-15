'use strict';

const { Client } = require('pg');

const wantCount = process.argv.includes('--count');

const client = new Client({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'upgrader',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'upgrader',
  connectionTimeoutMillis: 5000
});

(async () => {
  try {
    await client.connect();
    if (wantCount) {
      try {
        const result = await client.query('SELECT COUNT(*)::int AS c FROM users');
        console.log(`USERS=${result.rows[0].c}`);
      } catch (_) {
        console.log('USERS=0');
      }
    }
    console.log('OK');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
