import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { searchHistory } from "@/lib/services/retrieval-service";

const searchSchema = z.object({
  query: z.string().min(1),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    const body = searchSchema.parse(await request.json());
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await searchHistory({
      userId: user.id,
      queryText: body.query,
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
