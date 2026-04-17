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
          <h1>Aesop&apos;s weekly review</h1>
          <p>Your words, the extracted signals, and the coaching summary stay side by side so you can trust what is being inferred.</p>
        </div>
        <div className="cta-row">
          <Link href="/" className="button-secondary">
            Back to dashboard
          </Link>
          <Link href="/search" className="button">
            Ask over history
          </Link>
        </div>
      </section>

      <section className="grid">
        <article className="card feature-card">
          <div className="card-title-row">
            <h2>Coaching summary</h2>
            <span className={`status-badge ${detail.checkin.status === "submitted" ? "status-submitted" : "status-draft"}`}>
              {detail.checkin.status}
            </span>
          </div>
          <p>{detail.checkin.summary_text ?? "No summary generated yet."}</p>
          <ul className="bullet-list">
            {(detail.checkin.summary_bullets_json ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {detail.checkin.next_focus_text ? (
            <div className="callout-card">
              <span className="eyebrow">What matters next</span>
              <p>{detail.checkin.next_focus_text}</p>
            </div>
          ) : null}
        </article>

        <div className="columns">
          <article className="card">
            <h2>Your reflection</h2>
            <div className="stack">
              {WEEKLY_QUESTION_ORDER.map((key) => (
                <div key={key} className="detail-block">
                  <strong>{WEEKLY_QUESTIONS[key].label}</strong>
                  <p>{answers[key] || <span className="muted">No answer captured.</span>}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <h2>Signals Coach Aesop pulled out</h2>
            {detail.extraction ? (
              <div className="stack">
                <ExtractionBlock title="Wins" items={detail.extraction.wins_json} />
                <ExtractionBlock title="Challenges" items={detail.extraction.challenges_json} />
                <ExtractionBlock title="Learnings" items={detail.extraction.learnings_json} />
                <ExtractionBlock title="Next-week goals" items={detail.extraction.next_week_goals_json} />
                <ExtractionBlock title="Projects" items={detail.extraction.projects_json} />
                <ExtractionBlock title="Stakeholders" items={detail.extraction.stakeholders_json} />
                <ExtractionBlock title="Themes" items={detail.extraction.themes_json} />
                <ExtractionBlock title="Confidence notes" items={detail.extraction.confidence_notes_json} />
              </div>
            ) : (
              <p className="muted">Structured coaching signals appear after a submission has been processed.</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

function ExtractionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="detail-block">
      <strong>{title}</strong>
      {items.length > 0 ? (
        <ul className="bullet-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No items extracted.</p>
      )}
    </div>
  );
}
