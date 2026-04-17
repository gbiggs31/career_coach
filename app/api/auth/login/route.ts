import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/auth/user-service";
import { createUserSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const user = await authenticateUser(payload.email, payload.password);
    await createUserSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
