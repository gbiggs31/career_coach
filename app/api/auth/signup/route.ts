import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/auth/user-service";
import { createUserSession } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  timezone: z.string().min(1).default("Europe/London")
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const user = await createUser(payload);
    await createUserSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
