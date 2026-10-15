/**
 * Lighthouse results in Redis (written by scripts/record-lighthouse.ts after each
 * production deploy, read by /stats). Never committed: a commit would trigger a
 * deploy, which would trigger Lighthouse again.
 *   lighthouse:runs   list  newest-first JSON records, last 20
 */
import { parseEntries, safeRead, type KV } from "@/lib/redis";

export const LIGHTHOUSE_KEY = "lighthouse:runs";
export const LIGHTHOUSE_MAX_RUNS = 20;

export const SCORE_KEYS = ["performance", "accessibility", "bestPractices", "seo"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];
export type Scores = Record<ScoreKey, number>;

export type LighthouseRecord = {
  /** ISO time of the run. */
  t: string;
  /** Deployed commit, when known. */
  commit?: string;
  pages: { path: string; url: string; runs: number; scores: Scores }[];
  /** Mean of the per-page medians. */
  average: Scores;
};

const isScores = (value: unknown): value is Scores =>
  Boolean(value) && SCORE_KEYS.every((key) => typeof (value as Scores)[key] === "number");

const isRecord = (value: unknown): value is LighthouseRecord =>
  Boolean(value) &&
  typeof (value as LighthouseRecord).t === "string" &&
  Array.isArray((value as LighthouseRecord).pages) &&
  isScores((value as LighthouseRecord).average);

export async function pushLighthouseRecord(kv: KV, record: LighthouseRecord): Promise<void> {
  await kv.lpush(LIGHTHOUSE_KEY, JSON.stringify(record));
  await kv.ltrim(LIGHTHOUSE_KEY, 0, LIGHTHOUSE_MAX_RUNS - 1);
}

/** Newest first; null without Redis or before the first run. */
export async function getLighthouseHistory(): Promise<LighthouseRecord[] | null> {
  return safeRead(
    "lighthouse",
    async (kv) => {
      const records = parseEntries(await kv.lrange(LIGHTHOUSE_KEY, 0, LIGHTHOUSE_MAX_RUNS - 1), isRecord);
      return records.length ? records : null;
    },
    { cached: true }
  );
}
