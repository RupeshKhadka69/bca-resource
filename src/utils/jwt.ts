import { createHmac, timingSafeEqual } from "node:crypto";

import type { Role } from "@prisma/client";

export type JwtPayload = {
  userId: string;
  role: Role;
};

type JwtClaims = JwtPayload & {
  iat: number;
  exp: number;
};

const base64UrlEncode = (value: string | Buffer): string => {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
};

const parseExpiresIn = (expiresIn: string): number => {
  if (/^\d+$/.test(expiresIn)) {
    return Number(expiresIn);
  }

  const match = /^(\d+)([smhd])$/i.exec(expiresIn);

  if (!match) {
    throw new Error(`Invalid JWT_EXPIRES_IN value: ${expiresIn}`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid JWT_EXPIRES_IN value: ${expiresIn}`);
  }
};

export const signJwt = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string,
): string => {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiration = issuedAt + parseExpiresIn(expiresIn);
  const claims: JwtClaims = {
    ...payload,
    iat: issuedAt,
    exp: expiration,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
};

export const verifyJwt = (token: string, secret: string): JwtPayload => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid token format");
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signingInput)
    .digest();
  const providedSignature = Buffer.from(
    encodedSignature.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtClaims;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new Error("Token expired");
  }

  return {
    userId: payload.userId,
    role: payload.role,
  };
};
