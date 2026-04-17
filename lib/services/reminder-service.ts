import { format } from "date-fns";
import { Resend } from "resend";
import { query } from "../db";
import { getEnv, getOptionalEnv } from "../env";
import { ensureCurrentWeekCheckin } from "./checkin-service";

function getResendClient() {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  return apiKey ? new Resend(apiKey) : null;
}

export async function sendWeeklyReminder(userId: string) {
  const checkin = await ensureCurrentWeekCheckin(userId);
  if (checkin.status === "submitted") {
    return { skipped: true, reason: "already_submitted" as const };
  }

  const userResult = await query<{ email: string; name: string }>(
    `select email, name from users where id = $1 limit 1`,
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new Error("User not found for reminder.");
  }

  const appUrl = getEnv("APP_URL");
  const resend = getResendClient();
  const subject = "Weekly career check-in";
  const link = `${appUrl}/checkins/current`;
  const html = `
    <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;padding:24px">
      <h1 style="font-family:Georgia,serif">Weekly career check-in</h1>
      <p>You asked for a weekly prompt to capture what you worked on, your wins, your challenges, and your goals for next week.</p>
      <p><a href="${link}">Complete this week's check-in</a></p>
      <p>Estimated time: 5 minutes.</p>
      <p style="color:#666">Week of ${format(new Date(checkin.week_start_date), "MMM d, yyyy")}</p>
    </div>
  `;

  if (!resend) {
    return {
      skipped: true,
      reason: "email_not_configured" as const,
      preview: { to: user.email, subject, link }
    };
  }

  await resend.emails.send({
    from: getOptionalEnv("EMAIL_FROM") ?? "Career Coach <coach@example.com>",
    to: user.email,
    subject,
    html
  });

  return { skipped: false };
}
