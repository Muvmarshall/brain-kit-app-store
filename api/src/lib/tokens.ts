import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

export type AccessClaims = {
  sub: string; // user id
  hid: string; // household id
  email: string;
};

const secret = () => new TextEncoder().encode(config.jwtSecret);

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ hid: claims.hid, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTtlSeconds}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub || typeof payload.hid !== "string" || typeof payload.email !== "string") {
    throw new Error("invalid_token");
  }
  return { sub: payload.sub, hid: payload.hid, email: payload.email };
}
