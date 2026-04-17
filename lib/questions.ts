import { QuestionKey } from "./types";

export const WEEKLY_QUESTION_ORDER: QuestionKey[] = [
  "work_focus",
  "top_wins",
  "biggest_challenges",
  "learning",
  "next_week",
  "blockers",
  "feeling",
  "anything_else"
];

export const WEEKLY_QUESTIONS: Record<QuestionKey, { label: string; optional?: boolean }> = {
  work_focus: {
    label: "What did you work on most this week?"
  },
  top_wins: {
    label: "What were your top wins?"
  },
  biggest_challenges: {
    label: "What were your biggest challenges?"
  },
  learning: {
    label: "What did you learn?"
  },
  next_week: {
    label: "What matters most next week?"
  },
  blockers: {
    label: "Any blockers, risks, or decisions coming up?"
  },
  feeling: {
    label: "Optional: how are you feeling about work right now?",
    optional: true
  },
  anything_else: {
    label: "Anything else worth capturing?",
    optional: true
  }
};
