/**
 * Upstash Redis access. Everything that uses Redis must work without it:
 * getRedis() returns null when UPSTASH_REDIS_REST_URL / _TOKEN are missing,
 * and callers hide the feature (or fall back) instead of failing.
 *
 * Rule: live metrics (chat analytics, uptime, Lighthouse, last sync) live here,
 * never in the repo. A commit triggers a deploy, which triggers Lighthouse.
 */
import { Redis } from "@upstash/redis";

/** The small command surface the site uses. Values are raw strings (JSON is parsed by callers). */
export interface KV {
  get(key: string): Promise<string | null>;
  /** `exSeconds` sets an expiry; `keepTtl` keeps the key's existing expiry when overwriting. */
  set(key: string, value: string, options?: { exSeconds?: number; keepTtl?: boolean }): Promise<unknown>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  hset(key: string, values: Record<string, string>): Promise<number>;
  hgetall(key: string): Promise<Record<string, string> | null>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
}

export const isRedisConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

const clients = new Map<string, Redis>();

/**
 * The underlying Upstash client (needed by @upstash/ratelimit), or null.
 * `cached: true` lets Next's data cache keep read results for the page's
 * revalidate window (used by /stats, so each visit doesn't hit Redis).
 */
export function getUpstash({ cached = false }: { cached?: boolean } = {}): Redis | null {
  if (!isRedisConfigured()) return null;
  const key = cached ? "cached" : "live";
  let client = clients.get(key);
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
      automaticDeserialization: false,
      cache: cached ? "force-cache" : "no-store"
    });
    clients.set(key, client);
  }
  return client;
}

export function getRedis(options: { cached?: boolean } = {}): KV | null {
  const redis = getUpstash(options);
  if (!redis) return null;

  const asString = (value: unknown) => (value === null || value === undefined ? null : String(value));
  return {
    get: async (key) => asString(await redis.get(key)),
    set: (key, value, options) =>
      options?.keepTtl
        ? redis.set(key, value, { keepTtl: true })
        : options?.exSeconds
          ? redis.set(key, value, { ex: options.exSeconds })
          : redis.set(key, value),
    del: (key) => redis.del(key),
    incr: (key) => redis.incr(key),
    expire: (key, seconds) => redis.expire(key, seconds),
    hincrby: (key, field, increment) => redis.hincrby(key, field, increment),
    hset: (key, values) => redis.hset(key, values),
    hgetall: async (key) => {
      // With automaticDeserialization off, Upstash returns HGETALL as the raw flat
      // [field, value, field, value, …] array rather than an object.
      const result: unknown = await redis.hgetall(key);
      if (!result) return null;
      if (Array.isArray(result)) {
        if (!result.length) return null;
        const out: Record<string, string> = {};
        for (let i = 0; i + 1 < result.length; i += 2) out[String(result[i])] = String(result[i + 1]);
        return out;
      }
      return Object.fromEntries(Object.entries(result as Record<string, unknown>).map(([field, value]) => [field, String(value)]));
    },
    lpush: (key, ...values) => redis.lpush(key, ...values),
    ltrim: (key, start, stop) => redis.ltrim(key, start, stop),
    lrange: async (key, start, stop) => (await redis.lrange<unknown>(key, start, stop)).map(String)
  };
}

/** Runs a Redis read, returning null (and logging) instead of throwing. */
export async function safeRead<T>(label: string, read: (kv: KV) => Promise<T>, options: { cached?: boolean } = {}): Promise<T | null> {
  const kv = getRedis(options);
  if (!kv) return null;
  try {
    return await read(kv);
  } catch (error) {
    console.error(`Redis read failed (${label}):`, error instanceof Error ? error.message : error);
    return null;
  }
}

/** Parses JSON list entries, skipping anything malformed. */
export function parseEntries<T>(values: string[], isValid: (value: unknown) => value is T): T[] {
  const out: T[] = [];
  for (const value of values) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isValid(parsed)) out.push(parsed);
    } catch {
      // ignore malformed entries
    }
  }
  return out;
}
