import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { submitCheckin } from "@/lib/services/checkin-service";

const submitSchema = z.object({
  work_focus: z.string().default(""),
  top_wins: z.string().default(""),
  biggest_challenges: z.string().default(""),
  learning: z.string().default(""),
  next_week: z.string().default(""),
  blockers: z.string().default(""),
  feeling: z.string().default(""),
  anything_else: z.string().default("")
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = submitSchema.parse(await request.json());
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await submitCheckin(id, user.id, payload);
    return NextResponse.json({ checkinId: result.checkin.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit check-in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
