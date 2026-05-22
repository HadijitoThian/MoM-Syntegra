import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import meetingsRoutes from './routes/meetings.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import { startCron } from './cron.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// Liveness: process is up. Always 200 — used by Railway healthcheck.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Readiness: dependencies (DB) are reachable. May return 503.
app.get('/api/ready', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT now() AS now');
    res.json({ ok: true, db_time: rows[0].now });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// Serve the built frontend if it exists, regardless of NODE_ENV. In local dev
// you'll use `vite` on :5173 (which proxies /api here) and dist may not exist.
const distDir = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log(`[mom] serving frontend from ${distDir}`);
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  console.log(`[mom] no frontend build at ${distDir} — API only`);
}

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`[mom] api listening on :${port}`);
  if (process.env.NODE_ENV !== 'test') startCron();
});
