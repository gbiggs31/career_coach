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
    <form className="card form-grid" onSubmit={handleSubmit}>
      {WEEKLY_QUESTION_ORDER.map((key) => (
        <div key={key} className="field">
          <label htmlFor={key}>{WEEKLY_QUESTIONS[key].label}</label>
          <textarea
            id={key}
            value={answers[key]}
            onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
            placeholder={WEEKLY_QUESTIONS[key].optional ? "Optional" : "Your reflection"}
          />
        </div>
      ))}
      {error ? <p className="danger">{error}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Saving..." : "Submit weekly check-in"}
        </button>
        <span className="muted">Phase 1 keeps the flow simple. Draft autosave can slot in later.</span>
      </div>
    </form>
  );
}
