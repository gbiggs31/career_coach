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
          <div className="pill">Progress signals</div>
          <h1>How your goals are evolving</h1>
          <p>Repeated ambitions and recurring themes stay visible here so you can tell whether your weeks are lining up with the direction you want.</p>
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
                <div className="muted">Status: {goal.status}</div>
              </li>
            ))}
            {goals.length === 0 ? <li className="muted">Your goals will appear here after the first submitted reflection.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h2>Recurring themes</h2>
          <ul className="bullet-list">
            {themes.map((theme) => (
              <li key={theme.id}>
                <strong>{theme.canonical_theme_name}</strong>
                <div className="muted">{theme.description}</div>
              </li>
            ))}
            {themes.length === 0 ? <li className="muted">Themes will appear after the coaching layer has enough to work with.</li> : null}
          </ul>
        </article>
      </section>
    </main>
  );
}
