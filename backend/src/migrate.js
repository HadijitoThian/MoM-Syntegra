import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
}

async function applied() {
  const { rows } = await pool.query('SELECT name FROM _migrations');
  return new Set(rows.map((r) => r.name));
}

async function run() {
  await ensureTable();
  const done = await applied();
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  let count = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`[migrate] applying ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FAILED ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }
  console.log(`[migrate] done — ${count} new, ${done.size} already applied`);
  await pool.end();
}

function make() {
  const name = process.argv[3] || process.argv[2]?.replace(/^--make=?/, '');
  if (!name || name === '--make') {
    console.error('Usage: npm run migrate:make -- <name>');
    process.exit(1);
  }
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const file = path.join(migrationsDir, `${ts}_${name}.sql`);
  fs.writeFileSync(file, '-- migration\n');
  console.log(`[migrate] created ${file}`);
}

if (process.argv.includes('--make')) {
  make();
} else {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
