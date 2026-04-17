import { query } from "@/lib/db";
import { createPasswordHash, isPasswordValid } from "./crypto";

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
  timezone?: string;
}) {
  const existing = await query<{ id: string }>(`select id from users where lower(email) = lower($1) limit 1`, [
    input.email
  ]);

  if (existing.rows[0]) {
    throw new Error("An account with that email already exists.");
  }

  const result = await query<{ id: string; email: string; name: string | null; timezone: string }>(
    `insert into users (email, name, timezone, password_hash)
     values ($1, $2, $3, $4)
     returning id, email, name, timezone`,
    [
      input.email.trim().toLowerCase(),
      input.name?.trim() || null,
      input.timezone?.trim() || "Europe/London",
      createPasswordHash(input.password)
    ]
  );

  return result.rows[0];
}

export async function authenticateUser(email: string, password: string) {
  const result = await query<{
    id: string;
    email: string;
    name: string | null;
    timezone: string;
    password_hash: string | null;
  }>(
    `select id, email, name, timezone, password_hash
     from users
     where lower(email) = lower($1)
     limit 1`,
    [email]
  );

  const user = result.rows[0];
  if (!user?.password_hash) {
    throw new Error("Invalid email or password.");
  }

  if (!isPasswordValid(password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone
  };
}
