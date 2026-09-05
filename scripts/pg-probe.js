'use strict';

const { Client } = require('pg');

const PG_HOST = process.env.PGHOST || '127.0.0.1';
const PG_PORT = Number(process.env.PGPORT || 5432);
const PG_USER = process.env.PGUSER || 'upgrader';
const PG_PASS = process.env.PGPASSWORD || '';
const PG_DB = process.env.PGDATABASE || 'upgrader';

async function main() {
  const client = new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASS,
    database: PG_DB,
    connectionTimeoutMillis: 5000,
    ssl: false
  });
  await client.connect();
  if (process.argv.includes('--count')) {
    try {
      const result = await client.query('SELECT COUNT(*) AS c FROM users');
      console.log(`OK USERS=${Number(result.rows[0] && result.rows[0].c) || 0}`);
    } catch (error) {
      if (String(error && error.code) === '42P01') {
        console.log('OK USERS=0');
      } else {
        throw error;
      }
    }
  } else {
    await client.query('SELECT 1');
    console.log('OK');
  }
  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
