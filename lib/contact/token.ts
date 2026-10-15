/**
 * Signed form tokens for the "minimum time on form" check. The form fetches a
 * token when it loads (GET /api/contact/token); the submit must arrive at least
 * MIN_FORM_MS later. Tokens are HMAC-SHA256 signed with CONTACT_TOKEN_SECRET
 * (falls back to RATE_LIMIT_SALT) so bots can't forge an old timestamp.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { MAX_FORM_AGE_MS, MIN_FORM_MS } from "@/lib/contact/shared";

const secret = () => process.env.CONTACT_TOKEN_SECRET?.trim() || process.env.RATE_LIMIT_SALT?.trim() || "";

const sign = (payload: string, key: string) => createHmac("sha256", key).update(`contact-form:${payload}`).digest("base64url");

/** "<issuedAtMs>.<signature>" (unsigned "<issuedAtMs>." when no secret is configured). */
export function mintFormToken(now = Date.now()): string {
  const key = secret();
  const issuedAt = String(now);
  return `${issuedAt}.${key ? sign(issuedAt, key) : ""}`;
}

export type TokenCheck = { ok: true } | { ok: false; reason: "invalid" | "too-fast" | "expired" };

export function verifyFormToken(token: string, now = Date.now()): TokenCheck {
  const match = /^(\d{13})\.([A-Za-z0-9_-]*)$/.exec(token ?? "");
  if (!match) return { ok: false, reason: "invalid" };
  const [, issuedAt, signature] = match;

  const key = secret();
  if (key) {
    const expected = Buffer.from(sign(issuedAt, key));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  }

  const age = now - Number(issuedAt);
  if (age < MIN_FORM_MS) return { ok: false, reason: "too-fast" };
  if (age > MAX_FORM_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}
