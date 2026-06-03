import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
}

async function appliedSet(client) {
  const { rows } = await client.query('SELECT name FROM _migrations');
  return new Set(rows.map((r) => r.name));
}

// Reusable runner — can be called at boot from index.js or via CLI.
export async function applyMigrations({ silent = false } = {}) {
  const log = silent ? () => {} : (...args) => console.log('[migrate]', ...args);
  if (!process.env.DATABASE_URL) {
    log('skipping — DATABASE_URL not set');
    return { applied: 0, skipped: true };
  }

  const client = await pool.connect();
  try {
    // pg advisory lock to prevent concurrent migration runs (e.g. parallel boots)
    await client.query("SELECT pg_advisory_lock(91138291)");
    await ensureTable(client);
    const done = await appliedSet(client);
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    let count = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      log(`applying ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        log(`FAILED ${file}: ${err.message}`);
        throw err;
      }
    }
    log(`done — ${count} new, ${done.size} already applied`);
    return { applied: count, total: done.size + count };
  } finally {
    try { await client.query("SELECT pg_advisory_unlock(91138291)"); } catch {}
    client.release();
  }
}

function makeFile() {
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

// CLI entry point
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.js');
if (isMain) {
  if (process.argv.includes('--make')) {
    makeFile();
  } else {
    applyMigrations()
      .then(() => pool.end())
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}
