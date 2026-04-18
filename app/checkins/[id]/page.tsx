import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCheckinDetail, serializeCheckinAnswers } from "@/lib/services/checkin-service";
import { WEEKLY_QUESTION_ORDER, WEEKLY_QUESTIONS } from "@/lib/questions";
import { formatWeekLabel } from "@/lib/utils";

export default async function CheckinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getCheckinDetail(id, user.id);

  if (!detail) {
    notFound();
  }

  const answers = await serializeCheckinAnswers(id);

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">{formatWeekLabel(detail.checkin.week_start_date, detail.checkin.week_end_date)}</div>
          <h1>Weekly review</h1>
          <p>Your reflection alongside the signals Aesop extracted.</p>
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

      <article className="card feature-card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <h2>Coaching summary</h2>
          <span className={`status-badge ${detail.checkin.status === "submitted" ? "status-submitted" : "status-draft"}`}>
            {detail.checkin.status}
          </span>
        </div>
        <p style={{ margin: "0 0 12px" }}>{detail.checkin.summary_text ?? "No summary generated yet."}</p>
        {(detail.checkin.summary_bullets_json ?? []).length > 0 ? (
          <ul className="bullet-list">
            {(detail.checkin.summary_bullets_json ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {detail.checkin.next_focus_text ? (
          <div className="callout-card">
            <span className="eyebrow">What matters next</span>
            <p>{detail.checkin.next_focus_text}</p>
          </div>
        ) : null}
      </article>

      <section className="grid columns">
        <article className="card">
          <h2>Your reflection</h2>
          <div className="stack">
            {WEEKLY_QUESTION_ORDER.map((key) => (
              <div key={key} className="detail-block">
                <strong>{WEEKLY_QUESTIONS[key].label}</strong>
                <p>{answers[key] || <span className="muted">Not answered.</span>}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Extracted signals</h2>
          {detail.extraction ? (
            <div className="stack">
              <ExtractionBlock title="Wins" items={detail.extraction.wins_json} />
              <ExtractionBlock title="Challenges" items={detail.extraction.challenges_json} />
              <ExtractionBlock title="Learnings" items={detail.extraction.learnings_json} />
              <ExtractionBlock title="Next-week goals" items={detail.extraction.next_week_goals_json} />
              <ExtractionBlock title="Projects" items={detail.extraction.projects_json} />
              <ExtractionBlock title="Stakeholders" items={detail.extraction.stakeholders_json} />
              <ExtractionBlock title="Themes" items={detail.extraction.themes_json} />
            </div>
          ) : (
            <p className="muted">Signals appear after the reflection has been processed.</p>
          )}
        </article>
      </section>
    </main>
  );
}

function ExtractionBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="detail-block">
      <strong>{title}</strong>
      <ul className="bullet-list" style={{ marginTop: 8 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
