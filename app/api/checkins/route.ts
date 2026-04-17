import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listCheckins } from "@/lib/services/checkin-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const checkins = await listCheckins(user.id);
  return NextResponse.json(checkins);
}
