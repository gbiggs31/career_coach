import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listCheckins } from "@/lib/services/checkin-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const checkins = await listCheckins(user.id);

  if (format === "markdown") {
    const markdown = checkins
      .map((checkin) => `## ${checkin.week_start_date}\n\n${checkin.summary_text ?? "No summary"}\n`)
      .join("\n");
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="career-coach-export.md"'
      }
    });
  }

  return NextResponse.json(checkins, {
    headers: {
      "Content-Disposition": 'attachment; filename="career-coach-export.json"'
    }
  });
}
