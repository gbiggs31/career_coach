import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendWeeklyReminder } from "@/lib/services/reminder-service";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await query<{ id: string }>(`select id from users`);

  console.info("[cron] weekly reminders started", {
    userCount: users.rows.length,
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    appUrl: process.env.APP_URL ?? null,
    emailFrom: process.env.EMAIL_FROM ?? null
  });

  const results = await Promise.all(
    users.rows.map(async (user) => {
      try {
        const result = await sendWeeklyReminder(user.id);

        if (result.skipped) {
          console.info("[cron] weekly reminder skipped", { userId: user.id, reason: result.reason });
        } else {
          console.info("[cron] weekly reminder sent", { userId: user.id, emailId: result.emailId });
        }

        return { userId: user.id, ok: true as const, ...result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[cron] weekly reminder failed", { userId: user.id, error: message });
        return { userId: user.id, ok: false as const, error: message };
      }
    })
  );

  const summary = {
    totalUsers: results.length,
    sent: results.filter((result) => result.ok && !result.skipped).length,
    skipped: results.filter((result) => result.ok && result.skipped).length,
    failed: results.filter((result) => !result.ok).length
  };

  console.info("[cron] weekly reminders finished", summary);

  return NextResponse.json({ ...summary, results }, { status: summary.failed > 0 ? 500 : 200 });
}
