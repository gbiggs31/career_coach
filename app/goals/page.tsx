import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listGoals, listThemes } from "@/lib/services/checkin-service";

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, themes] = await Promise.all([listGoals(user.id), listThemes(user.id)]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const otherGoals = goals.filter((g) => g.status !== "active");

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Progress</div>
          <h1>Goals & themes</h1>
          <p>Repeated ambitions and recurring patterns surfaced across your weekly reflections.</p>
        </div>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <Link href="/" className="button-secondary">
            Dashboard
          </Link>
          <Link href="/search" className="button">
            Ask Aesop
          </Link>
        </div>
      </section>

      <section className="grid columns">
        <article className="card">
          <h2>Active goals</h2>
          <ul className="bullet-list">
            {activeGoals.map((goal) => (
              <li key={goal.id}>
                <strong style={{ fontSize: "0.9rem" }}>{goal.canonical_goal_text}</strong>
              </li>
            ))}
            {activeGoals.length === 0 ? (
              <li className="muted" style={{ fontSize: "0.875rem" }}>
                Goals appear after your first submitted reflection.
              </li>
            ) : null}
          </ul>
          {otherGoals.length > 0 ? (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Past goals
              </h3>
              <ul className="bullet-list">
                {otherGoals.map((goal) => (
                  <li key={goal.id}>
                    <span style={{ fontSize: "0.9rem" }}>{goal.canonical_goal_text}</span>
                    <span className="muted" style={{ fontSize: "0.8rem", marginLeft: 8 }}>{goal.status}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>

        <article className="card">
          <h2>Recurring themes</h2>
          <ul className="bullet-list">
            {themes.map((theme) => (
              <li key={theme.id}>
                <strong style={{ fontSize: "0.9rem" }}>{theme.canonical_theme_name}</strong>
                {theme.description ? (
                  <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                    {theme.description}
                  </div>
                ) : null}
              </li>
            ))}
            {themes.length === 0 ? (
              <li className="muted" style={{ fontSize: "0.875rem" }}>
                Themes appear once the coaching layer has enough data.
              </li>
            ) : null}
          </ul>
        </article>
      </section>
    </main>
  );
}
