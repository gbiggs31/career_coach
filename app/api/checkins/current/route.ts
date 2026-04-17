import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureCurrentWeekCheckin } from "@/lib/services/checkin-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const checkin = await ensureCurrentWeekCheckin(user.id);
  return NextResponse.json(checkin);
}
