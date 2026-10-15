/**
 * Lighthouse budget gate for preview deployments. Reads the reports folder,
 * takes the median of the runs per page, compares every page against
 * lighthouse-budgets.json, writes a Markdown table (for the PR comment and the
 * job summary) and exits 1 if any score is below budget.
 *
 * Usage: npm run lighthouse:gate -- <reports-dir> <markdown-out> [preview-url]
 */
import { appendFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SCORE_KEYS, type ScoreKey, type Scores } from "../lib/lighthouse";
import { readJson } from "./lib/fs";
import { buildRecord } from "./record-lighthouse";

const LABELS: Record<ScoreKey, string> = { performance: "Performance", accessibility: "Accessibility", bestPractices: "Best practices", seo: "SEO" };
export const COMMENT_MARKER = "<!-- lighthouse-gate -->";

export type GateResult = { passed: boolean; markdown: string; failures: string[] };

export function evaluate(pages: { path: string; runs: number; scores: Scores }[], budgets: Scores, previewUrl = ""): GateResult {
  const failures: string[] = [];
  const header = `| Page | ${SCORE_KEYS.map((key) => `${LABELS[key]} (≥ ${budgets[key]})`).join(" | ")} | Runs |`;
  const divider = `|---|${SCORE_KEYS.map(() => "---:").join("|")}|---:|`;
  const rows = pages.map((page) => {
    const cells = SCORE_KEYS.map((key) => {
      const ok = page.scores[key] >= budgets[key];
      if (!ok) failures.push(`${page.path} ${LABELS[key]} ${page.scores[key]} < ${budgets[key]}`);
      return `${ok ? "✅" : "❌"} ${page.scores[key]}`;
    });
    return `| \`${page.path}\` | ${cells.join(" | ")} | ${page.runs} |`;
  });

  const passed = failures.length === 0 && pages.length > 0;
  const markdown = [
    COMMENT_MARKER,
    `### ${passed ? "✅" : "❌"} Lighthouse budget ${passed ? "passed" : "failed"}`,
    "",
    previewUrl ? `Preview: ${previewUrl} · mobile · median of 3 runs per page` : "Mobile · median of 3 runs per page",
    "",
    pages.length ? [header, divider, ...rows].join("\n") : "_No usable Lighthouse reports (all runs failed)._",
    "",
    failures.length ? `**Below budget:** ${failures.join("; ")}` : "",
    "",
    "<sub>Budgets: `lighthouse-budgets.json`. The SEO crawlability audit is skipped on previews because Vercel marks them `noindex`.</sub>"
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");

  return { passed, markdown, failures };
}

export async function main(args = process.argv.slice(2)) {
  const [dir, out, previewUrl = ""] = args;
  if (!dir || !out) throw new Error("Usage: npm run lighthouse:gate -- <reports-dir> <markdown-out> [preview-url]");

  const budgets = (await readJson(path.join(process.cwd(), "lighthouse-budgets.json"))) as Scores;
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  const reports = await Promise.all(files.map((file) => readJson(path.join(dir, file)) as Promise<Parameters<typeof buildRecord>[0][number]>));
  const record = buildRecord(reports);
  const result = evaluate(record?.pages ?? [], budgets, previewUrl);

  await writeFile(out, `${result.markdown}\n`, "utf8");
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${result.markdown}\n`);
  console.log(`\n${result.markdown}\n`);

  if (!result.passed) process.exitCode = 1;
  return result;
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`\nLighthouse gate failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
