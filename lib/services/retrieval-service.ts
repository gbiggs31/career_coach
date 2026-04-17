import { query } from "../db";
import type { SearchResult } from "../types";

export async function searchHistory(params: {
  userId: string;
  queryText: string;
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [`d.user_id = $1`, `d.chunk_text ilike $2`];
  const values: unknown[] = [params.userId, `%${params.queryText}%`];

  if (params.startDate) {
    values.push(params.startDate);
    conditions.push(`wc.week_start_date >= $${values.length}`);
  }

  if (params.endDate) {
    values.push(params.endDate);
    conditions.push(`wc.week_end_date <= $${values.length}`);
  }

  const result = await query<{
    id: string;
    source_type: string;
    source_id: string;
    chunk_text: string;
    created_at: string;
    week_start_date: string;
  }>(
    `select
       d.id,
       d.source_type,
       d.source_id,
       d.chunk_text,
       d.created_at,
       wc.week_start_date
     from documents d
     left join weekly_checkins wc on wc.id = d.source_id
     where ${conditions.join(" and ")}
     order by wc.week_start_date desc nulls last, d.created_at desc
     limit 20`,
    values
  );

  const matches: SearchResult[] = result.rows.map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    chunkText: row.chunk_text,
    createdAt: row.created_at,
    weekStartDate: row.week_start_date
  }));

  const citations = matches
    .slice(0, 5)
    .map((match) => `[${match.weekStartDate ?? match.createdAt}] ${match.chunkText}`);

  const answer =
    matches.length === 0
      ? "No matching history found for that query yet."
      : `Found ${matches.length} matching history item${matches.length === 1 ? "" : "s"}. Most relevant sources mention: ${citations.join(" ")}`;

  return {
    matches,
    answer,
    citations
  };
}
