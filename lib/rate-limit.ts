/**
 * Rate limiting for public endpoints. Uses @upstash/ratelimit (shared across all
 * serverless instances) when Redis is configured, else an in-memory limiter.
 *
 * IPs are never stored: the Redis limiter keys on SHA-256(salt + IP), and only
 * when RATE_LIMIT_SALT is set (an unsalted IPv4 hash is trivially reversible).
 *
 *   chat:    10 / minute per visitor + 300 / day in total (protects the Groq bill)
 *   contact:  3 / hour per visitor
 */
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { getUpstash } from "@/lib/redis";

type Rule = { limit: number; windowMs: number; window: `${number} ${"m" | "h" | "d"}`; algorithm: "sliding" | "fixed" };

const RULES = {
  "chat:ip": { limit: 10, windowMs: 60_000, window: "1 m", algorithm: "sliding" },
  "chat:global": { limit: 300, windowMs: 86_400_000, window: "1 d", algorithm: "fixed" },
  "contact:ip": { limit: 3, windowMs: 3_600_000, window: "1 h", algorithm: "sliding" }
} satisfies Record<string, Rule>;

type RuleName = keyof typeof RULES;

export const PER_IP_LIMIT = RULES["chat:ip"].limit;
export const GLOBAL_DAILY_LIMIT = RULES["chat:global"].limit;
export const CONTACT_LIMIT = RULES["contact:ip"].limit;

export type RateLimitResult =
  | { ok: true; backend: "redis" | "memory" }
  | { ok: false; scope: "ip" | "global"; retryAfterSeconds: number; backend: "redis" | "memory" };

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// ── In-memory fallback (per instance) ────────────────────────────────────────

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(rule: RuleName, key: string): { ok: boolean; retryAfterSeconds: number } {
  const { limit, windowMs } = RULES[rule];
  const now = Date.now();
  if (memory.size > 10_000) memory.forEach((entry, k) => entry.resetAt <= now && memory.delete(k));

  const id = `${rule}:${key}`;
  const entry = memory.get(id);
  if (!entry || entry.resetAt <= now) {
    memory.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}

// ── Redis (Upstash) ──────────────────────────────────────────────────────────

let limiters: Partial<Record<RuleName, Ratelimit>> | null | undefined;

function getLimiter(rule: RuleName): Ratelimit | null {
  if (limiters === undefined) {
    const redis = getUpstash();
    if (redis && !process.env.RATE_LIMIT_SALT?.trim()) console.warn("RATE_LIMIT_SALT is not set; using the in-memory rate limiter.");
    limiters = redis && process.env.RATE_LIMIT_SALT?.trim() ? {} : null;
  }
  if (!limiters) return null;
  if (!limiters[rule]) {
    const { limit, window, algorithm } = RULES[rule];
    limiters[rule] = new Ratelimit({
      redis: getUpstash()!,
      limiter: algorithm === "sliding" ? Ratelimit.slidingWindow(limit, window) : Ratelimit.fixedWindow(limit, window),
      prefix: `rl:${rule}`
    });
  }
  return limiters[rule]!;
}

const retryAfter = (reset: number) => Math.max(1, Math.ceil((reset - Date.now()) / 1000));

async function hit(rule: RuleName, ip: string | null): Promise<{ ok: boolean; retryAfterSeconds: number; backend: "redis" | "memory" }> {
  const key = ip ?? "all";
  const limiter = getLimiter(rule);
  if (limiter) {
    try {
      const identifier = ip ? hashIp(ip, process.env.RATE_LIMIT_SALT!.trim()) : "all";
      const result = await limiter.limit(identifier);
      return { ok: result.success, retryAfterSeconds: retryAfter(result.reset), backend: "redis" };
    } catch (error) {
      // Redis unreachable: keep protecting the endpoint with the local limiter.
      console.error("Redis rate limit failed; using in-memory limiter:", error instanceof Error ? error.message : error);
    }
  }
  return { ...memoryHit(rule, key), backend: "memory" };
}

export async function checkChatRateLimit(ip: string): Promise<RateLimitResult> {
  const perIp = await hit("chat:ip", ip);
  if (!perIp.ok) return { ok: false, scope: "ip", retryAfterSeconds: perIp.retryAfterSeconds, backend: perIp.backend };
  const global = await hit("chat:global", null);
  if (!global.ok) return { ok: false, scope: "global", retryAfterSeconds: global.retryAfterSeconds, backend: global.backend };
  return { ok: true, backend: perIp.backend };
}

export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  const result = await hit("contact:ip", ip);
  return result.ok ? { ok: true, backend: result.backend } : { ok: false, scope: "ip", retryAfterSeconds: result.retryAfterSeconds, backend: result.backend };
}
