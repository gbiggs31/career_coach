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
  const currentDraft = checkins.find((checkin) => checkin.status === "draft") ?? latest;
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const recentWins = latest?.summary_bullets_json?.slice(0, 3) ?? [];
  const themesToShow = (state?.recurring_themes_json ?? themes.map((theme) => theme.canonical_theme_name)).slice(0, 6);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy-block">
          <div className="pill">Coach Aesop</div>
          <h1 className="hero-title">A weekly coaching ritual for the work behind your work.</h1>
          <p className="hero-copy">
            Capture what is going well, where you are feeling stretched, and how your time is lining up with the goals you care about.
            Coach Aesop keeps the pattern visible from week to week so your progress feels grounded instead of vague.
          </p>
          <div className="cta-row">
            <Link href="/checkins/current" className="button">
              Continue this week&apos;s reflection
            </Link>
            <Link href="/goals" className="button-secondary">
              Review progress
            </Link>
            <Link href="/search" className="button-secondary">
              Ask Aesop
            </Link>
          </div>
        </div>
        <aside className="hero-aside">
          <div className="hero-note">
            <span className="eyebrow">This week&apos;s focus</span>
            <strong>{currentDraft ? formatWeekLabel(currentDraft.week_start_date, currentDraft.week_end_date) : "Get started"}</strong>
            <p>{currentDraft?.status === "draft" ? "Your reflection is open and ready to continue." : "Your latest reflection is available to review."}</p>
          </div>
          <div className="hero-note">
            <span className="eyebrow">Why it helps</span>
            <p>Reflection becomes more useful when wins, frictions, goals, and themes stay connected over time.</p>
          </div>
        </aside>
      </section>

      <section className="grid stats-strip">
        <article className="metric-card metric-card-accent">
          <span className="metric-label">Weeks reflected</span>
          <strong>{submittedCount}</strong>
          <p>{submittedCount > 0 ? "A growing record of how your effort is evolving." : "Your first submitted week becomes the baseline."}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Active goals</span>
          <strong>{activeGoals.length}</strong>
          <p>Repeated goals stay visible so you can see where momentum is building or stalling.</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Recurring themes</span>
          <strong>{themes.length}</strong>
          <p>Patterns across weeks help turn raw thoughts into clearer coaching signals.</p>
        </article>
      </section>

      <section className="grid dashboard-grid">
        <div className="stack">
          <article className="card feature-card">
            <div className="card-title-row">
              <h2>Current coaching snapshot</h2>
              {latest ? (
                <span className="pill">{formatWeekLabel(latest.week_start_date, latest.week_end_date)}</span>
              ) : null}
            </div>
            <p>
              {latest?.summary_text ??
                "Start with this week&apos;s reflection. Once you submit, Aesop will turn your answers into a concise summary, goals, and themes you can revisit later."}
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
                Open this week&apos;s reflection
              </Link>
              {latest ? (
                <Link href={`/checkins/${latest.id}`} className="button-secondary">
                  Review latest summary
                </Link>
              ) : null}
              <Link href="/api/export?format=json" className="button-secondary">
                Export your record
              </Link>
            </div>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Weekly timeline</h2>
              <span className="muted">{checkins.length} weeks captured</span>
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
                    <p className="muted">{checkin.summary_text ?? "Draft in progress. Return to capture this week before it gets fuzzy."}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="stack">
          <article className="card">
            <div className="card-title-row">
              <h2>Momentum at a glance</h2>
              <span className="muted">What Aesop is noticing</span>
            </div>
            <div className="meta-grid">
              <div className="metric">
                <strong>{submittedCount}</strong>
                <span>Reflections submitted</span>
              </div>
              <div className="metric">
                <strong>{activeGoals.length}</strong>
                <span>Active goals</span>
              </div>
              <div className="metric">
                <strong>{themes.length}</strong>
                <span>Live patterns</span>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>Goals you are steering toward</h2>
            <ul className="bullet-list">
              {activeGoals.slice(0, 6).map((goal) => (
                <li key={goal.id}>
                  <strong>{goal.canonical_goal_text}</strong>
                  <div className="muted">
                    Seen {formatDistanceToNowStrict(new Date(goal.last_seen_at), { addSuffix: true })}
                  </div>
                </li>
              ))}
              {activeGoals.length === 0 ? <li className="muted">Your goals will start to gather here after your first submitted week.</li> : null}
            </ul>
          </article>

          <article className="card">
            <h2>Themes worth paying attention to</h2>
            <ul className="tag-list">
              {themesToShow.map((theme) => (
                <li key={theme} className="tag">
                  {theme}
                </li>
              ))}
            </ul>
            {themesToShow.length === 0 ? <p className="muted">Recurring themes will surface once a few weeks are in place.</p> : null}
          </article>
        </div>
      </section>
    </main>
  );
}
