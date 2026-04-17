import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listGoals, listThemes } from "@/lib/services/checkin-service";

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, themes] = await Promise.all([listGoals(user.id), listThemes(user.id)]);

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Rolling state</div>
          <h1>Goals & Themes</h1>
          <p>Conservative linking keeps repeated goals and recurring themes visible across weeks without hiding the raw entries behind abstraction.</p>
        </div>
        <div className="cta-row">
          <Link href="/" className="button-secondary">
            Back to dashboard
          </Link>
          <Link href="/search" className="button">
            Search history
          </Link>
        </div>
      </section>

      <section className="columns">
        <article className="card">
          <h2>Tracked goals</h2>
          <ul className="bullet-list">
            {goals.map((goal) => (
              <li key={goal.id}>
                <strong>{goal.canonical_goal_text}</strong>
                <div className="muted">{goal.status}</div>
              </li>
            ))}
            {goals.length === 0 ? <li className="muted">Goals will appear here after the first submitted check-in.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h2>Tracked themes</h2>
          <ul className="bullet-list">
            {themes.map((theme) => (
              <li key={theme.id}>
                <strong>{theme.canonical_theme_name}</strong>
                <div className="muted">{theme.description}</div>
              </li>
            ))}
            {themes.length === 0 ? <li className="muted">Themes appear after the extraction pipeline runs.</li> : null}
          </ul>
        </article>
      </section>
    </main>
  );
}
