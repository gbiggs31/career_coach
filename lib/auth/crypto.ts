import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password: string, salt?: string) {
  const nextSalt = salt ?? randomBytes(16).toString("hex");
  const derived = scryptSync(password, nextSalt, 64).toString("hex");
  return `${nextSalt}:${derived}`;
}

export function createPasswordHash(password: string) {
  return hashPassword(password);
}

export function isPasswordValid(password: string, storedHash: string) {
  const [salt, storedDerived] = storedHash.split(":");
  const passwordHash = hashPassword(password, salt);
  const [, derived] = passwordHash.split(":");
  return timingSafeEqual(Buffer.from(storedDerived, "hex"), Buffer.from(derived, "hex"));
}
