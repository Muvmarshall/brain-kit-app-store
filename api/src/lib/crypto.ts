import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Parent PIN is always 4 digits; stored as bcrypt hash (never plaintext). */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(String(pin), BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(String(pin), hash);
}

export function isFourDigitPin(pin: unknown): boolean {
  return /^\d{4}$/.test(String(pin ?? ""));
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}
