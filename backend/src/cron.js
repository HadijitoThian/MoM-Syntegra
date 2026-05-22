// Daily cleanup at 00:00 Jakarta (UTC+7 = 17:00 UTC the previous day).
import cron from 'node-cron';
import fs from 'node:fs';
import path from 'node:path';
import { pool } from './db.js';
import { sendEmail } from './email.js';

const UPLOAD_DIR = path.resolve(process.env.AUDIO_DIR || './uploads');

async function deleteOldAudio() {
  // Audio older than 30 days
  const { rows } = await pool.query(
    `SELECT id, audio_url
       FROM meetings
      WHERE audio_url IS NOT NULL
        AND created_at < now() - INTERVAL '30 days'`,
  );
  let removed = 0;
  for (const m of rows) {
    const filePath = path.join(UPLOAD_DIR, m.audio_url);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.warn(`[cron] could not delete ${filePath}:`, err.message);
    }
    await pool.query('UPDATE meetings SET audio_url = NULL WHERE id = $1', [m.id]);
    removed++;
  }
  if (removed) console.log(`[cron] removed audio for ${removed} meetings`);
}

async function notifyUpcomingDeletions() {
  // Meetings whose audio gets deleted in 3 days (and we haven't notified yet).
  // We piggyback on email_sent_at by using a different flag — simplest: query
  // and dedupe by storing a marker in summary jsonb. To avoid schema sprawl in
  // v1, we just send once per run by filtering on a tight day window.
  const { rows } = await pool.query(
    `SELECT m.id, m.title, m.created_at, m.audio_url, u.email, u.full_name
       FROM meetings m JOIN users u ON u.id = m.user_id
      WHERE m.audio_url IS NOT NULL
        AND m.created_at < now() - INTERVAL '27 days'
        AND m.created_at >= now() - INTERVAL '27 days' - INTERVAL '24 hours'`,
  );
  for (const r of rows) {
    const viewUrl = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/meetings/${r.id}`;
    try {
      await sendEmail({
        to: r.email,
        subject: `Audio rapat akan dihapus dalam 3 hari: ${r.title || 'Meeting'}`,
        text: `Halo${r.full_name ? ` ${r.full_name}` : ''},\n\nAudio dari rapat "${r.title || 'Meeting'}" akan dihapus dalam 3 hari. Transkrip dan ringkasan tetap tersimpan selamanya.\n\nUnduh audio sekarang jika Anda butuh: ${viewUrl}\n\n— Syntegra MoM`,
      });
    } catch (err) {
      console.warn('[cron] notify email failed:', err.message);
    }
  }
  if (rows.length) console.log(`[cron] sent ${rows.length} audio-deletion warnings`);
}

export function startCron() {
  // 00:00 Asia/Jakarta = 17:00 UTC previous day
  cron.schedule('0 17 * * *', async () => {
    console.log('[cron] running daily cleanup');
    try {
      await notifyUpcomingDeletions();
      await deleteOldAudio();
    } catch (err) {
      console.error('[cron] failed:', err.message);
    }
  });
  console.log('[cron] daily cleanup scheduled for 00:00 Asia/Jakarta');
}
