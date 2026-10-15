/**
 * Uptime check for the portfolio and every project with a liveUrl. Records the
 * status code and latency of a GET (10 s timeout) to Redis (last 7 days per
 * site). Run every 30 minutes by .github/workflows/uptime.yml. Never commits.
 *
 * Usage: npm run uptime
 * Env:   SITE_URL (or NEXT_PUBLIC_SITE_URL), UPSTASH_REDIS_REST_URL/TOKEN (optional: without them results are only printed)
 */
import path from "node:path";
import { getRedis } from "../lib/redis";
import { projectsFileSchema } from "../lib/schema";
import { recordUptime, type UptimeSample, type UptimeSite } from "../lib/uptime";
import { readJson } from "./lib/fs";

const TIMEOUT_MS = 10_000;

export async function checkSite(url: string, timeoutMs = TIMEOUT_MS): Promise<UptimeSample> {
  const started = performance.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "portfolio-uptime/1.0 (+https://github.com)" }
    });
    const ms = Math.round(performance.now() - started);
    void response.body?.cancel().catch(() => undefined);
    return { t: new Date().toISOString(), status: response.status, ms, ok: response.status >= 200 && response.status < 400 };
  } catch (error) {
    const ms = Math.round(performance.now() - started);
    const name = error instanceof Error ? error.name : "";
    const message = name === "TimeoutError" || name === "AbortError" ? `timeout after ${timeoutMs / 1000}s` : error instanceof Error ? error.message : String(error);
    return { t: new Date().toISOString(), status: 0, ms, ok: false, error: message.slice(0, 120) };
  }
}

/** The portfolio (from SITE_URL / NEXT_PUBLIC_SITE_URL, unless it's localhost) plus every project liveUrl. */
export async function uptimeSites(root = process.cwd()): Promise<UptimeSite[]> {
  const { projects } = projectsFileSchema.parse(await readJson(path.join(root, "data", "projects.json")));
  const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  const sites: UptimeSite[] = [];
  if (siteUrl && !/\/\/(localhost|127\.0\.0\.1)/.test(siteUrl)) sites.push({ id: "portfolio", name: "Portfolio", url: siteUrl });
  for (const project of projects) {
    if (project.liveUrl) sites.push({ id: project.slug, name: project.title, url: project.liveUrl });
  }
  return sites;
}

export async function main() {
  const sites = await uptimeSites();
  if (!sites.length) {
    console.log("\nUptime: no sites to check (set SITE_URL and/or add liveUrl to projects).\n");
    return;
  }

  const results = await Promise.all(sites.map(async (site) => ({ site, sample: await checkSite(site.url) })));

  console.log(`\nUptime check (${results.length} site(s))\n`);
  for (const { site, sample } of results) {
    const state = sample.ok ? "UP  " : "DOWN";
    console.log(`  ${state} ${String(sample.status || "—").padEnd(4)} ${String(sample.ms).padStart(5)} ms  ${site.name} (${site.url})${sample.error ? `  ${sample.error}` : ""}`);
  }

  const kv = getRedis();
  if (!kv) {
    console.log("\n  Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN): results not stored.\n");
    return;
  }
  await recordUptime(kv, results);
  console.log(`\n  Stored ${results.length} sample(s) in Redis.\n`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`\nUptime check failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
