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
  const submittedCount = checkins.filter((c) => c.status === "submitted").length;
  const currentDraft = checkins.find((c) => c.status === "draft") ?? latest;
  const activeGoals = goals.filter((g) => g.status === "active");
  const recentWins = latest?.summary_bullets_json?.slice(0, 3) ?? [];
  const themesToShow = (state?.recurring_themes_json ?? themes.map((t) => t.canonical_theme_name)).slice(0, 8);

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <h1>Welcome back{user.name ? `, ${user.name}` : ""}</h1>
          <p>
            {currentDraft
              ? `${formatWeekLabel(currentDraft.week_start_date, currentDraft.week_end_date)} · ${
                  currentDraft.status === "draft" ? "Your reflection is open" : "Reflection submitted"
                }`
              : "Start your first weekly reflection"}
          </p>
        </div>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <Link href="/checkins/current" className="button">
            This week&apos;s reflection
          </Link>
          <Link href="/search" className="button-secondary">
            Ask Aesop
          </Link>
        </div>
      </section>

      <section className="grid stats-strip" style={{ marginBottom: 16 }}>
        <article className="metric-card metric-card-accent">
          <span className="metric-label">Weeks reflected</span>
          <strong>{submittedCount}</strong>
          <p>{submittedCount > 0 ? "A growing record of your effort." : "Your first submitted week starts the record."}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Active goals</span>
          <strong>{activeGoals.length}</strong>
          <p>Goals repeated across weeks are tracked here.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Recurring themes</span>
          <strong>{themes.length}</strong>
          <p>Patterns that surface across your reflections.</p>
        </article>
      </section>

      <section className="grid dashboard-grid">
        <div className="stack">
          <article className="card feature-card">
            <div className="card-title-row">
              <h2>Latest summary</h2>
              {latest ? (
                <span className="status-badge status-submitted">
                  {formatWeekLabel(latest.week_start_date, latest.week_end_date)}
                </span>
              ) : null}
            </div>
            <p className={latest?.summary_text ? undefined : "muted"}>
              {latest?.summary_text ??
                "Start with this week's reflection. Once submitted, Aesop will generate a summary, goals, and themes you can revisit."}
            </p>
            {recentWins.length > 0 ? (
              <ul className="highlight-list">
                {recentWins.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className="inline-actions">
              <Link href="/checkins/current" className="button">
                Open this week
              </Link>
              {latest ? (
                <Link href={`/checkins/${latest.id}`} className="button-secondary">
                  Review latest
                </Link>
              ) : null}
              <Link href="/api/export?format=json" className="button-secondary">
                Export
              </Link>
            </div>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Weekly timeline</h2>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                {checkins.length} {checkins.length === 1 ? "week" : "weeks"}
              </span>
            </div>
            <ul className="entry-list">
              {checkins.map((checkin) => (
                <li key={checkin.id}>
                  <Link href={`/checkins/${checkin.id}`} className="entry-link">
                    <div className="entry-heading-row">
                      <strong>{formatWeekLabel(checkin.week_start_date, checkin.week_end_date)}</strong>
                      <span className={`status-badge ${checkin.status === "submitted" ? "status-submitted" : "status-draft"}`}>
                        {checkin.status}
                      </span>
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                      {checkin.summary_text ?? "Draft in progress."}
                    </p>
                  </Link>
                </li>
              ))}
              {checkins.length === 0 ? (
                <li className="muted">No reflections yet. Start with this week.</li>
              ) : null}
            </ul>
          </article>
        </div>

        <div className="stack">
          <article className="card">
            <h2>Goals</h2>
            <ul className="bullet-list">
              {activeGoals.slice(0, 6).map((goal) => (
                <li key={goal.id}>
                  <strong style={{ fontSize: "0.9rem" }}>{goal.canonical_goal_text}</strong>
                  <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    {formatDistanceToNowStrict(new Date(goal.last_seen_at), { addSuffix: true })}
                  </div>
                </li>
              ))}
              {activeGoals.length === 0 ? (
                <li className="muted" style={{ fontSize: "0.875rem" }}>
                  Goals appear after your first submitted reflection.
                </li>
              ) : null}
            </ul>
            {activeGoals.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <Link href="/goals" className="button-secondary" style={{ fontSize: "0.82rem" }}>
                  View all goals
                </Link>
              </div>
            ) : null}
          </article>

          <article className="card">
            <h2>Themes</h2>
            <ul className="tag-list">
              {themesToShow.map((theme) => (
                <li key={theme} className="tag">
                  {theme}
                </li>
              ))}
            </ul>
            {themesToShow.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                Themes surface after a few submitted reflections.
              </p>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
