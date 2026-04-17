import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendWeeklyReminder } from "@/lib/services/reminder-service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await query<{ id: string }>(`select id from users`);
  const results = await Promise.all(users.rows.map((user) => sendWeeklyReminder(user.id)));

  return NextResponse.json({ sent: results.filter((result) => !result.skipped).length, results });
}
