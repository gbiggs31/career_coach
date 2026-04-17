# Career Coach MVP

Structured weekly career reflection app built on Next.js and Postgres. The app is designed around reliable capture, inspectable data, and later synthesis rather than generic chat.

## What is included

- Weekly check-in flow with fixed prompts
- Local email/password auth with cookie-backed sessions
- Postgres schema for raw answers, structured extractions, goals, themes, documents, and rolling career state
- AI extraction and summary services with heuristic fallback when `OPENAI_API_KEY` is missing
- Dashboard, current-week check-in page, week detail page, search page, and export endpoint
- Reminder cron endpoint and email service boundary
- Seed script with sample history for local testing

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Start Postgres and set `DATABASE_URL`.

4. Run the seed script:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

## Architecture notes

- `app/`: UI routes and API routes
- `lib/services/checkin-service.ts`: core orchestration for create/list/submit flows
- `lib/services/extraction-service.ts`: grounded extraction and summary generation
- `lib/services/retrieval-service.ts`: keyword-first retrieval with citations
- `lib/services/reminder-service.ts`: reminder email delivery
- `db/migrations/001_init.sql`: inspectable schema baseline with a phase-2-ready embeddings table placeholder

## Auth

The app now uses local email/password auth with server-side sessions stored in Postgres. This keeps local development simple and avoids requiring Supabase or an email provider just to get a usable personal web app.

After seeding, you can log in with:

- Email: `demo@example.com`
- Password: `password123`

You can also create your own account at `/signup`.

## Cron

Call:

```bash
POST /api/cron/send-weekly-reminders
x-cron-secret: <CRON_SECRET>
```

This creates the current-week draft if needed and sends reminders only when the week is still incomplete.

## AI behavior

- Structured extraction returns grounded JSON only
- Summaries stay constrained to the submitted text
- When OpenAI is not configured, the app still works using deterministic fallback extraction for Phase 1 testing

## Not yet implemented

- Autosave drafts
- Embeddings pipeline
- Semantic retrieval
- AI-composed answers over retrieved sources
- Editable summaries/goals/themes
