import OpenAI from "openai";
import { z } from "zod";
import { getOptionalEnv, isAiEnabled } from "../env";
import { EXTRACTION_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from "../prompts";
import { uniqueNormalized } from "../utils";
import type { WeeklyAnswerInput } from "../types";

const extractionSchema = z.object({
  wins: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  learnings: z.array(z.string()).default([]),
  next_week_goals: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  stakeholders: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  confidence_notes: z.array(z.string()).default([]),
  mood_score: z.number().min(0).max(1).nullable().optional(),
  confidence_score: z.number().min(0).max(1).nullable().optional()
});

const summarySchema = z.object({
  summary_paragraph: z.string(),
  bullet_highlights: z.array(z.string()).min(3).max(6),
  next_focus: z.string()
});

export type ExtractionOutput = z.infer<typeof extractionSchema>;
export type SummaryOutput = z.infer<typeof summarySchema>;

function createClient() {
  const apiKey = getOptionalEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

function splitAnswer(text: string) {
  return uniqueNormalized(
    text
      .split(/\n|•|- /g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );
}

export function buildCombinedText(answers: WeeklyAnswerInput) {
  return Object.entries(answers)
    .filter(([, value]) => value.trim().length > 0)
    .map(([key, value]) => `${key}:\n${value.trim()}`)
    .join("\n\n");
}

function heuristicThemes(answers: WeeklyAnswerInput) {
  const text = Object.values(answers).join(" ").toLowerCase();
  const themes: Array<[string, string[]]> = [
    ["promotion frustration", ["promotion", "recognition", "visibility"]],
    ["stakeholder influence", ["stakeholder", "alignment", "cross-team", "buy-in"]],
    ["reactive work", ["firefighting", "interrupt", "urgent", "reactive"]],
    ["scope ambiguity", ["unclear", "scope", "ambiguity", "requirements"]],
    ["manager relationship", ["manager", "feedback", "support"]],
    ["focus and prioritization", ["priority", "prioritization", "focus"]]
  ];

  return themes
    .filter(([, markers]) => markers.some((marker) => text.includes(marker)))
    .map(([theme]) => theme);
}

export async function extractStructuredData(answers: WeeklyAnswerInput): Promise<ExtractionOutput> {
  if (!isAiEnabled()) {
    return {
      wins: splitAnswer(answers.top_wins),
      challenges: splitAnswer(answers.biggest_challenges),
      learnings: splitAnswer(answers.learning),
      next_week_goals: splitAnswer(answers.next_week),
      blockers: splitAnswer(answers.blockers),
      projects: [],
      stakeholders: [],
      decisions: [],
      themes: heuristicThemes(answers),
      confidence_notes: ["Heuristic fallback used because OPENAI_API_KEY is not configured."],
      mood_score: null,
      confidence_score: null
    };
  }

  const client = createClient();
  const model = getOptionalEnv("OPENAI_MODEL") ?? "gpt-5-mini";
  if (!client) {
    throw new Error("OpenAI client unavailable.");
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: EXTRACTION_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: JSON.stringify(answers)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "weekly_extraction",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            wins: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            learnings: { type: "array", items: { type: "string" } },
            next_week_goals: { type: "array", items: { type: "string" } },
            blockers: { type: "array", items: { type: "string" } },
            projects: { type: "array", items: { type: "string" } },
            stakeholders: { type: "array", items: { type: "string" } },
            decisions: { type: "array", items: { type: "string" } },
            themes: { type: "array", items: { type: "string" } },
            confidence_notes: { type: "array", items: { type: "string" } },
            mood_score: { type: ["number", "null"] },
            confidence_score: { type: ["number", "null"] }
          },
          required: [
            "wins",
            "challenges",
            "learnings",
            "next_week_goals",
            "blockers",
            "projects",
            "stakeholders",
            "decisions",
            "themes",
            "confidence_notes",
            "mood_score",
            "confidence_score"
          ]
        }
      }
    }
  });

  return extractionSchema.parse(JSON.parse(response.output_text));
}

export async function summarizeWeeklyCheckin(answers: WeeklyAnswerInput): Promise<SummaryOutput> {
  if (!isAiEnabled()) {
    const wins = splitAnswer(answers.top_wins).slice(0, 3);
    const challenges = splitAnswer(answers.biggest_challenges).slice(0, 2);
    const nextFocus = splitAnswer(answers.next_week)[0] ?? "Keep the stated priorities moving.";

    return {
      summary_paragraph:
        answers.work_focus.trim() || "Weekly reflection captured with heuristic summary fallback.",
      bullet_highlights: uniqueNormalized([...wins, ...challenges]).slice(0, 5),
      next_focus: nextFocus
    };
  }

  const client = createClient();
  const model = getOptionalEnv("OPENAI_MODEL") ?? "gpt-5-mini";
  if (!client) {
    throw new Error("OpenAI client unavailable.");
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: SUMMARY_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: JSON.stringify(answers)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "weekly_summary",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary_paragraph: { type: "string" },
            bullet_highlights: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 6
            },
            next_focus: { type: "string" }
          },
          required: ["summary_paragraph", "bullet_highlights", "next_focus"]
        }
      }
    }
  });

  return summarySchema.parse(JSON.parse(response.output_text));
}
