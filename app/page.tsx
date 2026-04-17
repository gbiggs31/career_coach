import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { requireUser } from "@/lib/auth/session";
import { ensureCurrentWeekCheckin, getCareerState, listCheckins, listGoals, listThemes } from "@/lib/services/checkin-service";
import { formatWeekLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureCurrentWeekCheckin(user.id);
  const [checkins, goals, themes, state] = await Promise.all([
    listCheckins(user.id),
    listGoals(user.id),
    listThemes(user.id),
    getCareerState(user.id)
  ]);

  const latest = checkins[0] ?? null;
  const submittedCount = checkins.filter((checkin) => checkin.status === "submitted").length;

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Structured first, chat second</div>
          <h1 className="hero-title">Career Coach</h1>
          <p className="hero-copy">
            Weekly reflection capture, reliable memory, and a review flow that stays useful after the novelty wears off.
          </p>
        </div>
        <div className="cta-row">
          <Link href="/checkins/current" className="button">
            Open this week&apos;s check-in
          </Link>
          <Link href="/goals" className="button-secondary">
            View goals & themes
          </Link>
          <Link href="/search" className="button-secondary">
            Search history
          </Link>
          <Link href="/goals" className="button-secondary">
            View goals & themes
          </Link>
          <Link href="/api/export?format=json" className="button-secondary">
            Export JSON
          </Link>
        </div>
      </section>

      <section className="grid dashboard-grid">
        <div className="stack">
          <article className="card">
            <div className="card-title-row">
              <h2>Latest snapshot</h2>
              {latest ? (
                <span className="pill">{formatWeekLabel(latest.week_start_date, latest.week_end_date)}</span>
              ) : null}
            </div>
            <p>{latest?.summary_text ?? "No submitted check-ins yet. Seed data includes a draft for the current week."}</p>
            <div className="inline-actions">
              <Link href="/checkins/current" className="button">
                Continue weekly check-in
              </Link>
              {latest ? (
                <Link href={`/checkins/${latest.id}`} className="button-secondary">
                  Review latest week
                </Link>
              ) : null}
            </div>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Past weeks</h2>
              <span className="muted">{checkins.length} total entries</span>
            </div>
            <ul className="entry-list">
              {checkins.map((checkin) => (
                <li key={checkin.id}>
                  <Link href={`/checkins/${checkin.id}`}>
                    <strong>{formatWeekLabel(checkin.week_start_date, checkin.week_end_date)}</strong>
                    <p className="muted">{checkin.summary_text ?? "Draft in progress"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="stack">
          <article className="card">
            <h2>Momentum</h2>
            <div className="meta-grid">
              <div className="metric">
                <strong>{submittedCount}</strong>
                <span>Weeks submitted</span>
              </div>
              <div className="metric">
                <strong>{goals.filter((goal) => goal.status === "active").length}</strong>
                <span>Active goals</span>
              </div>
              <div className="metric">
                <strong>{themes.length}</strong>
                <span>Tracked themes</span>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>Current active goals</h2>
            <ul className="bullet-list">
              {goals.slice(0, 6).map((goal) => (
                <li key={goal.id}>
                  <strong>{goal.canonical_goal_text}</strong>
                  <div className="muted">
                    Seen {formatDistanceToNowStrict(new Date(goal.last_seen_at), { addSuffix: true })}
                  </div>
                </li>
              ))}
              {goals.length === 0 ? <li className="muted">Goals appear here after your first submitted week.</li> : null}
            </ul>
          </article>

          <article className="card">
            <h2>Recurring themes</h2>
            <ul className="tag-list">
              {(state?.recurring_themes_json ?? themes.map((theme) => theme.canonical_theme_name)).map((theme) => (
                <li key={theme} className="tag">
                  {theme}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
