/**
 * Uptime samples in Redis (written by scripts/check-uptime.ts every 30 min,
 * read by /stats). Never committed to the repo.
 *   uptime:sites      hash  site id → { name, url }
 *   uptime:<site id>  list  newest-first JSON samples, capped to 7 days
 */
import { parseEntries, safeRead, type KV } from "@/lib/redis";

export const UPTIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** 7 days of 30-minute checks, plus headroom for manual runs. */
export const UPTIME_MAX_SAMPLES = 400;

export type UptimeSite = { id: string; name: string; url: string };
export type UptimeSample = { t: string; status: number; ms: number; ok: boolean; error?: string };

const SITES_KEY = "uptime:sites";
const siteKey = (id: string) => `uptime:${id}`;

const isSample = (value: unknown): value is UptimeSample =>
  Boolean(value) &&
  typeof (value as UptimeSample).t === "string" &&
  typeof (value as UptimeSample).status === "number" &&
  typeof (value as UptimeSample).ms === "number" &&
  typeof (value as UptimeSample).ok === "boolean";

/** Replaces the site registry and appends one sample per site (list capped). */
export async function recordUptime(kv: KV, results: { site: UptimeSite; sample: UptimeSample }[]): Promise<void> {
  await kv.del(SITES_KEY);
  if (results.length) {
    await kv.hset(SITES_KEY, Object.fromEntries(results.map(({ site }) => [site.id, JSON.stringify({ name: site.name, url: site.url })])));
  }
  for (const { site, sample } of results) {
    await kv.lpush(siteKey(site.id), JSON.stringify(sample));
    await kv.ltrim(siteKey(site.id), 0, UPTIME_MAX_SAMPLES - 1);
  }
}

export type UptimeSummary = {
  sites: {
    id: string;
    name: string;
    url: string;
    up: boolean;
    lastStatus: number;
    lastError?: string;
    lastChecked: string;
    uptimePercent: number;
    avgLatencyMs: number;
    samples: number;
  }[];
};

export async function getUptimeSummary(): Promise<UptimeSummary | null> {
  return safeRead(
    "uptime",
    async (kv) => {
      const registry = await kv.hgetall(SITES_KEY);
      if (!registry || !Object.keys(registry).length) return null;

      const cutoff = Date.now() - UPTIME_WINDOW_MS;
      const sites = await Promise.all(
        Object.entries(registry).map(async ([id, raw]) => {
          let meta: { name?: string; url?: string } = {};
          try {
            meta = JSON.parse(raw) as { name?: string; url?: string };
          } catch {
            // keep defaults
          }
          const samples = parseEntries(await kv.lrange(siteKey(id), 0, UPTIME_MAX_SAMPLES - 1), isSample).filter(
            (sample) => Date.parse(sample.t) >= cutoff
          );
          if (!samples.length) return null;

          const up = samples.filter((sample) => sample.ok);
          const latest = samples[0];
          return {
            id,
            name: meta.name ?? id,
            url: meta.url ?? "",
            up: latest.ok,
            lastStatus: latest.status,
            ...(latest.error ? { lastError: latest.error } : {}),
            lastChecked: latest.t,
            uptimePercent: Math.round((up.length / samples.length) * 1000) / 10,
            avgLatencyMs: up.length ? Math.round(up.reduce((sum, sample) => sum + sample.ms, 0) / up.length) : 0,
            samples: samples.length
          };
        })
      );

      const present = sites.filter((site): site is NonNullable<typeof site> => site !== null);
      // The portfolio itself first, then alphabetical.
      present.sort((a, b) => (a.id === "portfolio" ? -1 : b.id === "portfolio" ? 1 : a.name.localeCompare(b.name)));
      return present.length ? { sites: present } : null;
    },
    { cached: true }
  );
}
