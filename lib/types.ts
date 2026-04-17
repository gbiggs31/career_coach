export type CheckinStatus = "draft" | "submitted";

export type QuestionKey =
  | "work_focus"
  | "top_wins"
  | "biggest_challenges"
  | "learning"
  | "next_week"
  | "blockers"
  | "feeling"
  | "anything_else";

export type WeeklyAnswerInput = Record<QuestionKey, string>;

export interface WeeklyCheckinRow {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  status: CheckinStatus;
  submitted_at: string | null;
  raw_payload_json: WeeklyAnswerInput | null;
  raw_combined_text: string | null;
  summary_text: string | null;
  summary_bullets_json: string[] | null;
  next_focus_text: string | null;
  mood_score: number | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyExtractionRow {
  id: string;
  checkin_id: string;
  wins_json: string[];
  challenges_json: string[];
  learnings_json: string[];
  next_week_goals_json: string[];
  blockers_json: string[];
  projects_json: string[];
  stakeholders_json: string[];
  decisions_json: string[];
  themes_json: string[];
  confidence_notes_json: string[];
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  canonical_goal_text: string;
  status: "active" | "completed" | "paused" | "dropped";
  first_seen_at: string;
  last_seen_at: string;
  completion_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThemeRow {
  id: string;
  user_id: string;
  canonical_theme_name: string;
  description: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface CareerStateRow {
  user_id: string;
  active_priorities_json: string[];
  active_challenges_json: string[];
  current_goals_json: string[];
  recurring_themes_json: string[];
  recent_wins_json: string[];
  updated_at: string;
}

export interface SearchResult {
  id: string;
  sourceType: string;
  sourceId: string;
  chunkText: string;
  createdAt: string;
  score?: number;
  weekStartDate?: string;
}

export interface CheckinDetail {
  checkin: WeeklyCheckinRow;
  extraction: WeeklyExtractionRow | null;
}
