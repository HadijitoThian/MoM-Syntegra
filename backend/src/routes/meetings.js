import express from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth, requireActiveSubscription } from '../auth.js';
import { requireQuota, deductUsage } from '../quota.js';
import { transcribeAudio } from '../groq.js';
import { summariseTranscript } from '../claude.js';
import { sendEmail } from '../email.js';
import { buildMeetingEmail } from '../emailTemplates.js';

async function summariseAndEmail(meetingId, userId) {
  // Runs after the HTTP response is sent. Errors only logged.
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.email AS user_email, u.full_name AS user_full_name
         FROM meetings m JOIN users u ON u.id = m.user_id
        WHERE m.id = $1`,
      [meetingId],
    );
    const meeting = rows[0];
    if (!meeting || !meeting.transcript) return;

    const summary = await summariseTranscript({
      transcript: meeting.transcript,
      flagged: meeting.flagged_moments,
      durationSeconds: meeting.duration_seconds,
    });

    const summaryPayload = {
      overview: summary.overview,
      action_items: summary.action_items,
      key_decisions: summary.key_decisions,
      next_steps: summary.next_steps,
    };
    await pool.query(
      `UPDATE meetings
          SET summary = $1,
              mind_map_mermaid = $2,
              title = COALESCE(NULLIF(title, ''), $3)
        WHERE id = $4`,
      [summaryPayload, summary.mind_map_mermaid, summary.title, meetingId],
    );

    const viewUrl = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/meetings/${meetingId}`;
    const email = buildMeetingEmail({
      user: { email: meeting.user_email, full_name: meeting.user_full_name },
      meeting,
      summary: { ...summaryPayload, title: summary.title || meeting.title },
      viewUrl,
    });
    try {
      await sendEmail({ to: meeting.user_email, ...email });
      await pool.query(`UPDATE meetings SET email_sent_at = now() WHERE id = $1`, [meetingId]);
    } catch (err) {
      console.error('[summarise:email] failed:', err.message);
    }
  } catch (err) {
    console.error('[summarise] failed:', err.message);
  }
}

const router = express.Router();

const UPLOAD_DIR = path.resolve(process.env.AUDIO_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = (file.originalname.split('.').pop() || 'webm').toLowerCase().slice(0, 5);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title, duration_seconds, transcript IS NOT NULL AS has_transcript,
            summary IS NOT NULL AS has_summary, flagged_moments, created_at
       FROM meetings
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
    [req.userId],
  );
  res.json({ meetings: rows });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM meetings WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ meeting: rows[0] });
});

router.post('/transcribe', requireActiveSubscription, requireQuota, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_audio' });

  const duration = Number(req.body.duration_seconds) || 0;
  const title = (req.body.title || '').slice(0, 200) || null;
  const languageHint = req.body.language || null;
  let flaggedMoments = null;
  if (req.body.flagged_moments) {
    try {
      flaggedMoments = JSON.parse(req.body.flagged_moments);
    } catch {
      flaggedMoments = null;
    }
  }

  const { rows: created } = await pool.query(
    `INSERT INTO meetings (user_id, title, duration_seconds, flagged_moments, audio_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [req.userId, title, duration, flaggedMoments, req.file.filename],
  );
  const meetingId = created[0].id;

  try {
    const buffer = fs.readFileSync(req.file.path);
    const result = await transcribeAudio({
      buffer,
      filename: req.file.originalname || 'audio.webm',
      mimeType: req.file.mimetype,
      languageHint,
    });
    await pool.query(
      `UPDATE meetings SET transcript = $1 WHERE id = $2`,
      [result.text, meetingId],
    );
    // Deduct quota from the actual duration we just transcribed.
    await deductUsage(req.userId, duration);
    res.json({
      meeting_id: meetingId,
      transcript: result.text,
      language: result.language,
      duration: result.duration,
    });
    // Kick off summarisation + email after responding to keep UX snappy.
    summariseAndEmail(meetingId, req.userId);
  } catch (err) {
    console.error('[transcribe] failed:', err.message);
    res.status(502).json({ error: 'transcription_failed', detail: err.message, meeting_id: meetingId });
  }
});

// Manual re-summarisation (e.g., if Claude failed the first time).
router.post('/:id/summarise', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, transcript FROM meetings WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  if (!rows[0].transcript) return res.status(400).json({ error: 'no_transcript' });
  res.json({ ok: true, queued: true });
  summariseAndEmail(req.params.id, req.userId);
});

export default router;
