import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth/session";

export async function POST() {
  await clearUserSession();
  return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
}
