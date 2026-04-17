"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WEEKLY_QUESTION_ORDER, WEEKLY_QUESTIONS } from "@/lib/questions";
import type { WeeklyAnswerInput } from "@/lib/types";

export function CheckinForm({
  checkinId,
  initialAnswers
}: {
  checkinId: string;
  initialAnswers: WeeklyAnswerInput;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const completedCount = WEEKLY_QUESTION_ORDER.filter((key) => answers[key].trim().length > 0).length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/checkins/${checkinId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(answers)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Unable to submit this check-in.");
        return;
      }

      const payload = (await response.json()) as { checkinId: string };
      router.push(`/checkins/${payload.checkinId}`);
      router.refresh();
    });
  }

  return (
    <form className="card form-grid reflection-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <span className="eyebrow">Reflection progress</span>
          <h2>
            {completedCount} of {WEEKLY_QUESTION_ORDER.length} prompts answered
          </h2>
        </div>
        <p className="muted">Short, honest answers are enough. This is for clarity, not performance.</p>
      </div>
      {WEEKLY_QUESTION_ORDER.map((key, index) => (
        <div key={key} className="question-card">
          <div className="question-index">{index + 1}</div>
          <div className="field">
            <label htmlFor={key}>{WEEKLY_QUESTIONS[key].label}</label>
            <textarea
              id={key}
              value={answers[key]}
              onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={WEEKLY_QUESTIONS[key].optional ? "Optional" : "Write what feels true for this week"}
            />
          </div>
        </div>
      ))}
      {error ? <p className="danger">{error}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Saving..." : "Finish this week's reflection"}
        </button>
        <span className="muted">Coach Aesop will turn this into a weekly summary, themes, and next-step coaching.</span>
      </div>
    </form>
  );
}
