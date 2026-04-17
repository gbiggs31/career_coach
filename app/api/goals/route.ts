import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listGoals } from "@/lib/services/checkin-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const goals = await listGoals(user.id);
  return NextResponse.json(goals);
}
