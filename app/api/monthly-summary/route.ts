import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { listCheckins } from "@/lib/services/checkin-service";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/)
});

export async function POST(request: Request) {
  try {
    const { month } = schema.parse(await request.json());
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const checkins = await listCheckins(user.id);
    const matching = checkins.filter((checkin) => checkin.week_start_date.startsWith(month));

    const summary = matching
      .map((checkin) => `- ${checkin.week_start_date}: ${checkin.summary_text ?? "No summary"}`)
      .join("\n");

    return NextResponse.json({
      month,
      summary: summary || "No check-ins found for that month."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate monthly summary.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
