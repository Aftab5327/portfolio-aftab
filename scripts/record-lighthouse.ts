/**
 * Turns a folder of Lighthouse JSON reports (several runs per page) into one
 * record — the median score per category per page — and pushes it to Redis
 * (last 20 kept). Used by .github/workflows/lighthouse.yml. Never commits.
 *
 * Usage: npm run lighthouse:record -- <reports-dir>
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { SCORE_KEYS, pushLighthouseRecord, type LighthouseRecord, type ScoreKey, type Scores } from "../lib/lighthouse";
import { getRedis } from "../lib/redis";
import { readJson } from "./lib/fs";

/** Lighthouse category ids → our score keys. */
const CATEGORY_IDS: Record<ScoreKey, string> = {
  performance: "performance",
  accessibility: "accessibility",
  bestPractices: "best-practices",
  seo: "seo"
};

type LighthouseReport = {
  requestedUrl?: string;
  finalDisplayedUrl?: string;
  runtimeError?: { code?: string; message?: string };
  categories?: Record<string, { score: number | null } | undefined>;
};

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

/** Builds a record from parsed reports. Reports with a runtime error or missing scores are skipped. */
export function buildRecord(reports: LighthouseReport[], commit?: string, now = new Date()): LighthouseRecord | null {
  const byPage = new Map<string, { url: string; runs: Scores[] }>();

  for (const report of reports) {
    if (report.runtimeError?.code) continue;
    const url = report.requestedUrl ?? report.finalDisplayedUrl;
    if (!url) continue;

    const scores = {} as Scores;
    let complete = true;
    for (const key of SCORE_KEYS) {
      const score = report.categories?.[CATEGORY_IDS[key]]?.score;
      if (typeof score !== "number") complete = false;
      else scores[key] = Math.round(score * 100);
    }
    if (!complete) continue;

    const pagePath = new URL(url).pathname || "/";
    const entry = byPage.get(pagePath) ?? { url, runs: [] };
    entry.runs.push(scores);
    byPage.set(pagePath, entry);
  }

  if (!byPage.size) return null;

  const pages = [...byPage.entries()]
    .sort(([a], [b]) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)))
    .map(([pagePath, { url, runs }]) => ({
      path: pagePath,
      url,
      runs: runs.length,
      scores: Object.fromEntries(SCORE_KEYS.map((key) => [key, median(runs.map((run) => run[key]))])) as Scores
    }));

  const average = Object.fromEntries(
    SCORE_KEYS.map((key) => [key, Math.round(pages.reduce((sum, page) => sum + page.scores[key], 0) / pages.length)])
  ) as Scores;

  return { t: now.toISOString(), ...(commit ? { commit: commit.slice(0, 7) } : {}), pages, average };
}

export async function main(dir = process.argv[2]) {
  if (!dir) throw new Error("Usage: npm run lighthouse:record -- <reports-dir>");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  const reports = await Promise.all(files.map((file) => readJson(path.join(dir, file)) as Promise<LighthouseReport>));

  const record = buildRecord(reports, process.env.DEPLOY_SHA || process.env.GITHUB_SHA);
  if (!record) throw new Error(`No usable Lighthouse reports in ${dir} (${files.length} file(s))`);

  console.log(`\nLighthouse (median of runs, ${files.length} report(s))\n`);
  for (const page of record.pages) {
    console.log(`  ${page.path.padEnd(32)} ${SCORE_KEYS.map((key) => `${key} ${page.scores[key]}`).join("  ")}  (${page.runs} runs)`);
  }
  console.log(`  ${"average".padEnd(32)} ${SCORE_KEYS.map((key) => `${key} ${record.average[key]}`).join("  ")}`);

  const kv = getRedis();
  if (!kv) {
    console.log("\n  Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN): record not stored.\n");
    return record;
  }
  await pushLighthouseRecord(kv, record);
  console.log("\n  Stored in Redis (last 20 kept).\n");
  return record;
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`\nLighthouse record failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
