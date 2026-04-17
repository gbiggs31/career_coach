import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCheckinDetail, serializeCheckinAnswers } from "@/lib/services/checkin-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const detail = await getCheckinDetail(id, user.id);
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const answers = await serializeCheckinAnswers(id);
  return NextResponse.json({ ...detail, answers });
}
