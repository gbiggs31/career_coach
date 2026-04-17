import { query, withTransaction } from "../db";
import { WEEKLY_QUESTION_ORDER, WEEKLY_QUESTIONS } from "../questions";
import type {
  CareerStateRow,
  CheckinDetail,
  GoalRow,
  QuestionKey,
  ThemeRow,
  WeeklyAnswerInput,
  WeeklyCheckinRow,
  WeeklyExtractionRow
} from "../types";
import { getWeekBounds, toTitleCase, uniqueNormalized } from "../utils";
import { buildCombinedText, extractStructuredData, summarizeWeeklyCheckin } from "./extraction-service";

export async function getUserById(userId: string) {
  const result = await query<{ id: string; email: string; name: string | null; timezone: string }>(
    `select id, email, name, timezone from users where id = $1 limit 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function ensureCurrentWeekCheckin(userId: string) {
  const { weekStartDate, weekEndDate } = getWeekBounds();
  const existing = await query<WeeklyCheckinRow>(
    `select * from weekly_checkins where user_id = $1 and week_start_date = $2 limit 1`,
    [userId, weekStartDate]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const created = await query<WeeklyCheckinRow>(
    `insert into weekly_checkins (
      user_id, week_start_date, week_end_date, status, raw_payload_json
    ) values ($1, $2, $3, 'draft', $4)
    returning *`,
    [
      userId,
      weekStartDate,
      weekEndDate,
      JSON.stringify(
        Object.fromEntries(WEEKLY_QUESTION_ORDER.map((key) => [key, ""])) as WeeklyAnswerInput
      )
    ]
  );

  return created.rows[0];
}

export async function listCheckins(userId: string) {
  const result = await query<WeeklyCheckinRow>(
    `select * from weekly_checkins
     where user_id = $1
     order by week_start_date desc`,
    [userId]
  );

  return result.rows;
}

export async function getCheckinDetail(checkinId: string, userId: string): Promise<CheckinDetail | null> {
  const [checkinResult, extractionResult] = await Promise.all([
    query<WeeklyCheckinRow>(
      `select * from weekly_checkins where id = $1 and user_id = $2 limit 1`,
      [checkinId, userId]
    ),
    query<WeeklyExtractionRow>(
      `select we.* from weekly_extractions we
       join weekly_checkins wc on wc.id = we.checkin_id
       where we.checkin_id = $1 and wc.user_id = $2 limit 1`,
      [checkinId, userId]
    )
  ]);

  const checkin = checkinResult.rows[0];
  if (!checkin) {
    return null;
  }

  return {
    checkin,
    extraction: extractionResult.rows[0] ?? null
  };
}

export async function listGoals(userId: string) {
  const result = await query<GoalRow>(
    `select * from goals where user_id = $1 order by last_seen_at desc`,
    [userId]
  );

  return result.rows;
}

export async function listThemes(userId: string) {
  const result = await query<ThemeRow>(
    `select * from themes where user_id = $1 order by last_seen_at desc`,
    [userId]
  );

  return result.rows;
}

export async function getCareerState(userId: string) {
  const result = await query<CareerStateRow>(
    `select * from career_state where user_id = $1 limit 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

function canonicalizeGoal(goal: string) {
  return goal.trim().replace(/[.?!]+$/, "");
}

async function linkGoals(tx: typeof query, userId: string, checkinId: string, goals: string[]) {
  const normalizedGoals = uniqueNormalized(goals.map(canonicalizeGoal));

  for (const goal of normalizedGoals) {
    const existing = await tx<GoalRow>(
      `select * from goals
       where user_id = $1
       and lower(canonical_goal_text) = lower($2)
       and status = 'active'
       limit 1`,
      [userId, goal]
    );

    const goalRow =
      existing.rows[0] ??
      (
        await tx<GoalRow>(
          `insert into goals (
            user_id, canonical_goal_text, status, first_seen_at, last_seen_at
          ) values ($1, $2, 'active', now(), now())
          returning *`,
          [userId, goal]
        )
      ).rows[0];

    if (existing.rows[0]) {
      await tx(
        `update goals set last_seen_at = now(), updated_at = now()
         where id = $1`,
        [goalRow.id]
      );
    }

    await tx(
      `insert into goal_mentions (goal_id, checkin_id, mention_text)
       values ($1, $2, $3)
       on conflict do nothing`,
      [goalRow.id, checkinId, goal]
    );
  }
}

async function linkThemes(tx: typeof query, userId: string, checkinId: string, themes: string[]) {
  const normalizedThemes = uniqueNormalized(themes.map((theme) => toTitleCase(theme.trim())));

  for (const theme of normalizedThemes) {
    const existing = await tx<ThemeRow>(
      `select * from themes
       where user_id = $1
       and lower(canonical_theme_name) = lower($2)
       limit 1`,
      [userId, theme]
    );

    const themeRow =
      existing.rows[0] ??
      (
        await tx<ThemeRow>(
          `insert into themes (
            user_id, canonical_theme_name, description, first_seen_at, last_seen_at
          ) values ($1, $2, $3, now(), now())
          returning *`,
          [userId, theme, `Recurring theme captured from weekly reflections: ${theme}`]
        )
      ).rows[0];

    if (existing.rows[0]) {
      await tx(
        `update themes set last_seen_at = now(), updated_at = now()
         where id = $1`,
        [themeRow.id]
      );
    }

    await tx(
      `insert into theme_mentions (theme_id, checkin_id, mention_text)
       values ($1, $2, $3)
       on conflict do nothing`,
      [themeRow.id, checkinId, theme]
    );
  }
}

async function updateCareerState(
  tx: typeof query,
  userId: string,
  extraction: WeeklyExtractionRow
) {
  await tx(
    `insert into career_state (
      user_id,
      active_priorities_json,
      active_challenges_json,
      current_goals_json,
      recurring_themes_json,
      recent_wins_json,
      updated_at
    ) values ($1, $2, $3, $4, $5, $6, now())
    on conflict (user_id) do update set
      active_priorities_json = excluded.active_priorities_json,
      active_challenges_json = excluded.active_challenges_json,
      current_goals_json = excluded.current_goals_json,
      recurring_themes_json = excluded.recurring_themes_json,
      recent_wins_json = excluded.recent_wins_json,
      updated_at = now()`,
    [
      userId,
      JSON.stringify(extraction.next_week_goals_json),
      JSON.stringify(extraction.challenges_json),
      JSON.stringify(extraction.next_week_goals_json),
      JSON.stringify(extraction.themes_json),
      JSON.stringify(extraction.wins_json)
    ]
  );
}

async function replaceDocumentChunks(
  tx: typeof query,
  userId: string,
  checkin: WeeklyCheckinRow,
  extraction: WeeklyExtractionRow
) {
  await tx(`delete from documents where source_id = $1`, [checkin.id]);

  const chunks = [
    checkin.summary_text ? ["summary", checkin.summary_text] : null,
    checkin.raw_combined_text ? ["weekly_checkin", checkin.raw_combined_text] : null,
    ...extraction.wins_json.map((value) => ["win", value] as const),
    ...extraction.challenges_json.map((value) => ["challenge", value] as const),
    ...extraction.next_week_goals_json.map((value) => ["goal", value] as const),
    ...extraction.learnings_json.map((value) => ["learning", value] as const)
  ].filter(Boolean) as ReadonlyArray<readonly [string, string]>;

  for (const [index, [sourceType, chunkText]] of chunks.entries()) {
    await tx(
      `insert into documents (
        user_id, source_type, source_id, chunk_text, chunk_order
      ) values ($1, $2, $3, $4, $5)`,
      [userId, sourceType, checkin.id, chunkText, index]
    );
  }
}

export async function submitCheckin(checkinId: string, userId: string, answers: WeeklyAnswerInput) {
  const combinedText = buildCombinedText(answers);
  const extracted = await extractStructuredData(answers);
  const summary = await summarizeWeeklyCheckin(answers);

  return withTransaction(async (tx) => {
    const checkinResult = await tx<WeeklyCheckinRow>(
      `update weekly_checkins set
        raw_payload_json = $1,
        raw_combined_text = $2,
        summary_text = $3,
        summary_bullets_json = $4,
        next_focus_text = $5,
        mood_score = $6,
        confidence_score = $7,
        status = 'submitted',
        submitted_at = now(),
        updated_at = now()
       where id = $8 and user_id = $9
       returning *`,
      [
        JSON.stringify(answers),
        combinedText,
        summary.summary_paragraph,
        JSON.stringify(summary.bullet_highlights),
        summary.next_focus,
        extracted.mood_score ?? null,
        extracted.confidence_score ?? null,
        checkinId,
        userId
      ]
    );

    const checkin = checkinResult.rows[0];
    if (!checkin) {
      throw new Error("Check-in not found.");
    }

    const extractionResult = await tx<WeeklyExtractionRow>(
      `insert into weekly_extractions (
        checkin_id,
        wins_json,
        challenges_json,
        learnings_json,
        next_week_goals_json,
        blockers_json,
        projects_json,
        stakeholders_json,
        decisions_json,
        themes_json,
        confidence_notes_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (checkin_id) do update set
        wins_json = excluded.wins_json,
        challenges_json = excluded.challenges_json,
        learnings_json = excluded.learnings_json,
        next_week_goals_json = excluded.next_week_goals_json,
        blockers_json = excluded.blockers_json,
        projects_json = excluded.projects_json,
        stakeholders_json = excluded.stakeholders_json,
        decisions_json = excluded.decisions_json,
        themes_json = excluded.themes_json,
        confidence_notes_json = excluded.confidence_notes_json,
        updated_at = now()
      returning *`,
      [
        checkin.id,
        JSON.stringify(extracted.wins),
        JSON.stringify(extracted.challenges),
        JSON.stringify(extracted.learnings),
        JSON.stringify(extracted.next_week_goals),
        JSON.stringify(extracted.blockers),
        JSON.stringify(extracted.projects),
        JSON.stringify(extracted.stakeholders),
        JSON.stringify(extracted.decisions),
        JSON.stringify(extracted.themes),
        JSON.stringify(extracted.confidence_notes)
      ]
    );

    const extraction = extractionResult.rows[0];

    await linkGoals(tx, userId, checkin.id, extracted.next_week_goals);
    await linkThemes(tx, userId, checkin.id, extracted.themes);

    await updateCareerState(tx, userId, extraction);
    await replaceDocumentChunks(tx, userId, checkin, extraction);

    for (const key of WEEKLY_QUESTION_ORDER) {
      const questionText = WEEKLY_QUESTIONS[key].label;
      await tx(
        `insert into weekly_answers (
          checkin_id, question_key, question_text, answer_text
        ) values ($1, $2, $3, $4)
        on conflict (checkin_id, question_key) do update set
          question_text = excluded.question_text,
          answer_text = excluded.answer_text`,
        [checkin.id, key, questionText, answers[key]]
      );
    }

    return {
      checkin,
      extraction
    };
  });
}

export async function serializeCheckinAnswers(checkinId: string) {
  const answers = await query<{ question_key: QuestionKey; answer_text: string }>(
    `select question_key, answer_text from weekly_answers where checkin_id = $1`,
    [checkinId]
  );

  return Object.fromEntries(
    WEEKLY_QUESTION_ORDER.map((key) => [key, answers.rows.find((row) => row.question_key === key)?.answer_text ?? ""])
  ) as WeeklyAnswerInput;
}
