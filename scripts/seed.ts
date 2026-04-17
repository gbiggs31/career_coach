import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { createPasswordHash } from "../lib/auth/crypto";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });
  const migrationPath = path.join(process.cwd(), "db", "migrations", "001_init.sql");
  const sql = await readFile(migrationPath, "utf8");

  await pool.query(sql);

  await pool.query(`alter table users add column if not exists password_hash text`);
  await pool.query(`
    create table if not exists user_sessions (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `);

  const email = process.env.DEMO_USER_EMAIL ?? "demo@example.com";
  const name = process.env.DEMO_USER_NAME ?? "Demo User";
  const timezone = process.env.DEMO_USER_TIMEZONE ?? "Europe/London";

  const user = await pool.query<{ id: string }>(
    `insert into users (email, name, timezone)
     values ($1, $2, $3)
     on conflict (email) do update set name = excluded.name, timezone = excluded.timezone
     returning id`,
    [email, name, timezone]
  );

  const userId = user.rows[0].id;

  await pool.query(`update users set password_hash = $2 where id = $1 and password_hash is null`, [
    userId,
    createPasswordHash("password123")
  ]);

  await pool.query(
    `insert into weekly_checkins (
      user_id, week_start_date, week_end_date, status, submitted_at,
      raw_payload_json, raw_combined_text, summary_text, summary_bullets_json, next_focus_text
    ) values
      (
        $1, '2026-03-30', '2026-04-05', 'submitted', now(),
        $2::jsonb,
        $3,
        $4,
        $5::jsonb,
        $6
      ),
      (
        $1, '2026-04-06', '2026-04-12', 'submitted', now(),
        $7::jsonb,
        $8,
        $9,
        $10::jsonb,
        $11
      )
    on conflict (user_id, week_start_date) do nothing`,
    [
      userId,
      JSON.stringify({
        work_focus: "Shipped analytics instrumentation for the onboarding flow and spent a lot of time unblocking support tickets.",
        top_wins: "Closed the analytics rollout. Helped a teammate debug a flaky data pipeline.",
        biggest_challenges: "Reactive support work kept breaking focus. Requirements changed late.",
        learning: "Need tighter scoping before kickoff.",
        next_week: "Document onboarding funnel metrics and regain deep work time.",
        blockers: "Waiting on product sign-off for follow-up experiments.",
        feeling: "A little stretched but still positive.",
        anything_else: "Manager appreciated the faster response time."
      }),
      "work_focus:\nShipped analytics instrumentation for the onboarding flow and spent a lot of time unblocking support tickets.",
      "A week split between forward progress on onboarding analytics and reactive support demands.",
      JSON.stringify([
        "Rolled out onboarding analytics instrumentation",
        "Unblocked support issues quickly",
        "Learned that late requirement changes hurt focus"
      ]),
      "Protect deep work while documenting the new metrics.",
      JSON.stringify({
        work_focus: "Prepared Q2 planning notes, drove alignment with design, and wrapped a customer-facing fix.",
        top_wins: "Resolved a long-running customer bug. Got design aligned on the next release. Drafted a clear Q2 priorities memo.",
        biggest_challenges: "Promotion expectations still feel fuzzy. Too many urgent requests from adjacent teams.",
        learning: "Influence work needs to be visible, not just done quietly.",
        next_week: "Turn the priorities memo into concrete milestones and clarify promotion criteria.",
        blockers: "Need manager feedback on scope and success criteria.",
        feeling: "More focused than last week, but still frustrated by reactive work.",
        anything_else: "I should track cross-team wins more explicitly."
      }),
      "work_focus:\nPrepared Q2 planning notes, drove alignment with design, and wrapped a customer-facing fix.",
      "The week combined visible delivery, planning work, and recurring concern about promotion clarity.",
      JSON.stringify([
        "Resolved a long-running customer bug",
        "Aligned design on the next release",
        "Drafted a Q2 priorities memo",
        "Noticed repeated frustration with reactive work"
      ]),
      "Convert the plan into milestones and get concrete manager feedback."
    ]
  );

  console.log(`Seed complete for ${email} (${userId}).`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
