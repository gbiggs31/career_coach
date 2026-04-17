import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const SESSION_COOKIE = "career_coach_session";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);

  await query(
    `insert into user_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + interval '30 days')`,
    [userId, tokenHash]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (rawToken) {
    await query(`delete from user_sessions where token_hash = $1`, [hashSessionToken(rawToken)]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const result = await query<{
    id: string;
    email: string;
    name: string | null;
    timezone: string;
  }>(
    `select u.id, u.email, u.name, u.timezone
     from user_sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1
       and s.expires_at > now()
     limit 1`,
    [hashSessionToken(rawToken)]
  );

  return result.rows[0] ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}
