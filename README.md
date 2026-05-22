# Syntegra MoM

Automatic meeting notes for Indonesian SMEs. Record a meeting in the browser, get a transcript, summary, action items, and a mind map by email when you're done.

- **Stack**: React 18 + Vite + Tailwind (PWA) / Express 4 + Postgres 14 / Groq Whisper + Claude Sonnet / Resend / Midtrans
- **Pricing**: Rp 49,000/month, 7-day free trial
- **Hosting**: Railway (single service, backend serves the built frontend)

## Repo layout

```
syntegra-mom/
├── backend/          Express API + serves frontend/dist in production
│   ├── src/
│   │   ├── index.js          server bootstrap
│   │   ├── db.js             pg pool
│   │   ├── routes/           api route modules
│   │   └── migrate.js        migration runner
│   └── migrations/           *.sql files, applied in filename order
├── frontend/         React + Vite SPA, PWA
│   ├── src/
│   └── index.html
├── .env.example
└── package.json      npm workspaces root
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (or a `DATABASE_URL` you can point at)

## Setup

```bash
# 1. Install deps for all workspaces
npm install

# 2. Configure env
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and JWT_SECRET

# 3. Create the database (one-off)
createdb syntegra_mom

# 4. Run migrations
npm run migrate

# 5. Start dev servers (backend :3000, frontend :5173 with proxy to backend)
npm run dev
```

Open http://localhost:5173.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run backend + frontend in parallel |
| `npm run build` | Build frontend to `frontend/dist`, then backend prep |
| `npm start` | Production: backend serves API + built frontend |
| `npm run migrate` | Apply pending SQL migrations |
| `npm run migrate:make -- name` | Create a new timestamped migration file |

## Deploy (Railway)

Build/start config lives in [`railway.json`](railway.json) + [`nixpacks.toml`](nixpacks.toml). Railway will build the frontend and serve it from the backend, as **a single service**.

1. Create a Railway project from this GitHub repo.
2. **Delete any auto-created `frontend` service** — Railway sometimes spawns one per workspace. We only want the single root service.
3. On the single service, leave **Root Directory empty** (config files at the repo root drive the build).
4. Add a **Postgres** addon (sets `DATABASE_URL` automatically).
5. Add a **Volume** mounted at `/data/uploads` (for audio retention).
6. Set env vars on the service:
   - `JWT_SECRET` (32+ random chars — `openssl rand -hex 32`)
   - `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`
   - `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_PRODUCTION=true`
   - `PUBLIC_URL=https://mom.syntegra.co.id`
   - `AUDIO_DIR=/data/uploads`
   - `NODE_ENV=production`
7. Deploy. Railway uses the committed config (build → `npm install && npm run build`, start → `npm start`, healthcheck → `/api/health`).
8. After first deploy, open a Railway shell on the service and run `npm run migrate`.
9. Point `mom.syntegra.co.id` at the Railway service.
10. In the Midtrans dashboard, set the **Payment Notification URL** to
    `https://mom.syntegra.co.id/api/subscriptions/webhook`.

## Status

MVP complete (Day 1–5):
- Auth: signup / login / forgot / reset (JWT, bcrypt)
- Recorder: MediaRecorder + Wake Lock + flagged moments + pause/resume
- Transcription: Groq Whisper Large v3
- Summarisation: Claude Sonnet → JSON (overview, action items, decisions, next steps, mermaid mind map)
- Email: Resend with RFC 2047-encoded subjects
- Subscription: Midtrans Snap checkout + webhook + gating (recorder requires active trial or paid)
- Cleanup cron: 30-day audio retention with 3-day warning email
- Settings, history, bilingual UI (ID/EN)

Phase 2 backlog: recurring auto-renewal, calendar integration, speaker diarisation, team accounts.
