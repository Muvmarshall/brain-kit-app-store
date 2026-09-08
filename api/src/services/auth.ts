import { eq, and, isNull, gt } from "drizzle-orm";
import type { AppDb } from "../db/types.js";
import { households, users, refreshTokens } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  isFourDigitPin,
  hashToken,
  newRefreshToken,
} from "../lib/crypto.js";
import { signAccessToken } from "../lib/tokens.js";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";

function refreshExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + config.refreshTtlDays);
  return d;
}

async function issueTokens(
  db: AppDb,
  user: { id: string; householdId: string; email: string },
) {
  const accessToken = await signAccessToken({
    sub: user.id,
    hid: user.householdId,
    email: user.email,
  });
  const rawRefresh = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(rawRefresh),
    expiresAt: refreshExpiry(),
  });
  return {
    accessToken,
    refreshToken: rawRefresh,
    expiresIn: config.accessTtlSeconds,
    tokenType: "Bearer" as const,
  };
}

export async function signup(
  db: AppDb,
  input: { email: string; password: string; pin: string },
) {
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(input.password ?? "");
  const pin = String(input.pin ?? "");

  if (!email || !email.includes("@")) {
    throw new AppError(400, "invalid_email", "Valid parent email required");
  }
  if (password.length < 8) {
    throw new AppError(400, "weak_password", "Password must be at least 8 characters");
  }
  if (!isFourDigitPin(pin)) {
    throw new AppError(400, "invalid_pin", "PIN must be exactly 4 digits");
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    throw new AppError(409, "email_taken", "An account with this email already exists");
  }

  const [passwordHash, pinHash] = await Promise.all([hashPassword(password), hashPin(pin)]);

  const [hh] = await db.insert(households).values({ pinHash }).returning();
  if (!hh) throw new AppError(500, "signup_failed", "Could not create household");

  const [user] = await db
    .insert(users)
    .values({
      householdId: hh.id,
      email,
      passwordHash,
    })
    .returning();
  if (!user) throw new AppError(500, "signup_failed", "Could not create user");

  const tokens = await issueTokens(db, {
    id: user.id,
    householdId: user.householdId,
    email: user.email,
  });

  return {
    user: { id: user.id, email: user.email, householdId: user.householdId },
    ...tokens,
  };
}

export async function login(
  db: AppDb,
  input: { email: string; password: string },
) {
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(input.password ?? "");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }

  const tokens = await issueTokens(db, {
    id: user.id,
    householdId: user.householdId,
    email: user.email,
  });

  return {
    user: { id: user.id, email: user.email, householdId: user.householdId },
    ...tokens,
  };
}

export async function refresh(db: AppDb, refreshToken: string) {
  const raw = String(refreshToken ?? "");
  if (!raw) throw new AppError(400, "missing_token", "refreshToken required");

  const tokenHash = hashToken(raw);
  const now = new Date();
  const [row] = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
    })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AppError(401, "invalid_refresh", "Invalid or expired refresh token");
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(eq(refreshTokens.id, row.id));

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user) throw new AppError(401, "invalid_refresh", "User not found");

  const tokens = await issueTokens(db, {
    id: user.id,
    householdId: user.householdId,
    email: user.email,
  });

  return {
    user: { id: user.id, email: user.email, householdId: user.householdId },
    ...tokens,
  };
}

export async function verifyHouseholdPin(
  db: AppDb,
  householdId: string,
  pin: string,
) {
  if (!isFourDigitPin(pin)) {
    throw new AppError(400, "invalid_pin", "PIN must be exactly 4 digits");
  }
  const [hh] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);
  if (!hh) throw new AppError(404, "not_found", "Household not found");
  const ok = await verifyPin(String(pin), hh.pinHash);
  if (!ok) throw new AppError(401, "pin_mismatch", "Incorrect PIN");
  return { ok: true };
}
