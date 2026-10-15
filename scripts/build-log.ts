/**
 * Weekly build log: summarises the last 7 days of real commits across the
 * `portfolio`-tagged repos and this site's repo into a short post, written by
 * Groq from commit messages and repo names only, and validated so nothing is
 * invented. Writes content/build-log/<yyyy>-w<ww>.md (the workflow commits it).
 *
 * Usage: npm run build-log                    (week that ended last Sunday, UTC)
 *        npm run build-log -- --now 2026-10-13T03:30:00Z   (backfill a specific week)
 *        npm run build-log -- --force         (overwrite an existing post)
 * Needs GROQ_API_KEY; GITHUB_TOKEN optional.
 */
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { BUILD_LOG_DIR } from "../lib/build-log";
import { GROQ_MODEL, SOURCE_REPO_NAME } from "../lib/config";
import { profileSchema } from "../lib/schema";
import { readJson } from "./lib/fs";
import { githubJson, isPortfolioRepo, listPublicRepos } from "./lib/github";
import { callGroq, cleanOutput, inventedNumbers, type ChatMessage } from "./lib/groq";

const MIN_COMMITS = 3;
const MAX_COMMITS_IN_PROMPT = 60;
const DAY = 86_400_000;

type ApiCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name?: string; date?: string } | null };
  author?: { login?: string; type?: string } | null;
  parents?: { sha: string }[];
};

export type Commit = { repo: string; sha: string; url: string; message: string; date: string };

/** ISO-8601 week number (weeks start on Monday). */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7) };
}

/** The 7 days before today's 00:00 UTC (run on Monday → Monday..Sunday of last week). */
export function period(now: Date) {
  const until = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since = new Date(until.getTime() - 7 * DAY);
  const { year, week } = isoWeek(since);
  return {
    since,
    until,
    slug: `${year}-w${String(week).padStart(2, "0")}`,
    weekStart: since.toISOString().slice(0, 10),
    weekEnd: new Date(until.getTime() - DAY).toISOString().slice(0, 10),
    date: until.toISOString().slice(0, 10)
  };
}

const SKIP_MESSAGES = [/^Merge (pull request|branch|remote-tracking)/i, /^chore\((data|media)\)/i, /^docs\((build-log|case-studies)\)/i];

/** Bots, merges and automated data/media commits are not "meaningful" work. */
export function isMeaningful(commit: ApiCommit): boolean {
  if ((commit.parents?.length ?? 1) > 1) return false;
  if (commit.author?.type === "Bot" || /\[bot\]$/i.test(commit.author?.login ?? "") || /\[bot\]/i.test(commit.commit.author?.name ?? "")) return false;
  const subject = commit.commit.message.split("\n")[0].trim();
  return Boolean(subject) && !SKIP_MESSAGES.some((pattern) => pattern.test(subject));
}

async function fetchCommits(fullName: string, since: Date, until: Date): Promise<ApiCommit[]> {
  const all: ApiCommit[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const batch = await githubJson<ApiCommit[]>(
      `/repos/${fullName}/commits?since=${since.toISOString()}&until=${until.toISOString()}&per_page=100&page=${page}`
    ).catch((error: Error) => {
      // An empty repository answers 409; anything else is worth a warning but not a failure.
      if (!/ 409 /.test(error.message)) console.warn(`  ! ${fullName}: ${error.message.slice(0, 120)}`);
      return [] as ApiCommit[];
    });
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

const SYSTEM_PROMPT = `You write a short weekly engineering log for a developer's portfolio, from their git commit messages. Reply with ONE Markdown document in the exact format below and nothing else: no preamble, no surrounding code fence.

STRICT RULES
1. Use ONLY information in the COMMITS. Never invent features, numbers, metrics, users, dates, technologies or outcomes.
2. Write 3 to 6 bullet points in total, grouped under a "### <repository>" heading per repository. Use the repository names exactly as given, and only repositories that have commits.
3. Each bullet is one plain sentence in the past tense describing what changed. Combine related commits into one bullet.
4. No links, no code blocks, no raw HTML, no emojis, no marketing language.

FORMAT:
---
title: <specific title under 70 characters summarising the week>
---

### <repository>
- <bullet>
- <bullet>

### <repository>
- <bullet>`;

export function validatePost(markdown: string, repos: string[], context: string): string[] {
  const problems: string[] = [];
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(markdown, {});
  } catch {
    return ["The frontmatter block (--- title: ... ---) could not be parsed."];
  }

  const title = typeof parsed.data.title === "string" ? parsed.data.title.trim() : "";
  if (!title) problems.push('Frontmatter "title" is missing.');
  else if (title.length > 90) problems.push("The title must be under 70 characters.");

  const lines = parsed.content.split("\n").map((line) => line.trim()).filter(Boolean);
  const repoNames = new Map(repos.map((repo) => [repo.toLowerCase(), repo]));
  let bullets = 0;
  let underHeading = false;

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      underHeading = true;
      if (!repoNames.has(heading[1].trim().toLowerCase())) problems.push(`Unknown repository heading "${heading[1]}". Use only: ${repos.join(", ")}.`);
      continue;
    }
    if (/^[-*]\s+\S/.test(line)) {
      bullets += 1;
      if (!underHeading) problems.push("Every bullet must be under a ### <repository> heading.");
      continue;
    }
    problems.push(`Unexpected line (only ### headings and - bullets are allowed): "${line.slice(0, 60)}"`);
  }

  if (bullets < 3 || bullets > 6) problems.push(`Write 3 to 6 bullets in total (found ${bullets}).`);
  if (/https?:\/\/|\]\(|<[a-z]/i.test(parsed.content)) problems.push("Do not include links or HTML.");

  const invented = inventedNumbers(`${title}\n${parsed.content}`, context);
  if (invented.length) problems.push(`These numbers do not appear in the COMMITS: ${invented.join(", ")}. Remove them.`);

  return [...new Set(problems)];
}

/** YAML frontmatter using JSON values (valid YAML, safely escaped). */
function frontmatter(values: Record<string, unknown>): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
}

async function setGitHubOutput(values: Record<string, string>) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(""));
}

export async function main(args = process.argv.slice(2)) {
  const nowArg = args[args.indexOf("--now") + 1];
  const now = args.includes("--now") && nowArg ? new Date(nowArg) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`Invalid --now value "${nowArg}"`);
  const force = args.includes("--force") || process.env.npm_config_force === "true";

  const week = period(now);
  const target = path.join(BUILD_LOG_DIR, `${week.slug}.md`);
  console.log(`\nBuild log ${week.slug} (${week.weekStart} → ${week.weekEnd})\n`);

  if (existsSync(target) && !force) {
    console.log(`  content/build-log/${week.slug}.md already exists; skipped (use --force to regenerate).\n`);
    await setGitHubOutput({ written: "false", slug: week.slug });
    return { written: false, reason: "exists" as const };
  }

  const profile = profileSchema.parse(await readJson(path.join(process.cwd(), "content", "profile.json")));
  const owner = profile.githubUsername;
  const tagged = (await listPublicRepos(owner)).filter(isPortfolioRepo).map((repo) => repo.full_name);
  const ownRepo = process.env.GITHUB_REPOSITORY || `${owner}/${SOURCE_REPO_NAME}`;
  const repos = [...new Set([ownRepo, ...tagged])];

  const commits: Commit[] = [];
  for (const fullName of repos) {
    const repoName = fullName.split("/")[1];
    for (const item of await fetchCommits(fullName, week.since, week.until)) {
      if (!isMeaningful(item)) continue;
      commits.push({
        repo: repoName,
        sha: item.sha,
        url: item.html_url,
        message: item.commit.message.trim(),
        date: item.commit.author?.date ?? ""
      });
    }
  }
  commits.sort((a, b) => a.date.localeCompare(b.date));

  const activeRepos = [...new Set(commits.map((commit) => commit.repo))];
  console.log(`  Repos checked: ${repos.length}; meaningful commits: ${commits.length} in ${activeRepos.length} repo(s)`);

  if (commits.length < MIN_COMMITS) {
    console.log(`  Fewer than ${MIN_COMMITS} meaningful commits; skipping this week.\n`);
    await setGitHubOutput({ written: "false", slug: week.slug });
    return { written: false, reason: "too-few-commits" as const };
  }

  const context = activeRepos
    .map((repo) => {
      const lines = commits
        .filter((commit) => commit.repo === repo)
        .slice(-MAX_COMMITS_IN_PROMPT)
        .map((commit) => {
          const [subject, ...rest] = commit.message.split("\n");
          const body = rest.join(" ").replace(/\s+/g, " ").trim().slice(0, 200);
          return `- ${subject.trim()}${body ? ` (${body})` : ""}`;
        });
      return `## ${repo}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `COMMITS (${week.weekStart} to ${week.weekEnd}):\n\n${context}\n\nWrite the weekly log now.` }
  ];

  let output = cleanOutput(await callGroq(messages, { maxTokens: 600 }));
  let problems = validatePost(output, activeRepos, context);
  if (problems.length) {
    console.log(`  invalid output (${problems.length} problem(s)); retrying once`);
    messages.push(
      { role: "assistant", content: output },
      { role: "user", content: `Your post has these problems:\n${problems.map((p) => `- ${p}`).join("\n")}\n\nReturn the corrected, complete post in the exact format, using only the COMMITS.` }
    );
    output = cleanOutput(await callGroq(messages, { maxTokens: 600 }));
    problems = validatePost(output, activeRepos, context);
  }
  if (problems.length) {
    throw new Error(`model output still invalid after retry:\n  - ${problems.join("\n  - ")}`);
  }

  const parsed = matter(output, {});
  const file = [
    "---",
    frontmatter({
      title: String(parsed.data.title).trim(),
      date: week.date,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      repos: activeRepos,
      commitCount: commits.length,
      aiGenerated: true,
      model: GROQ_MODEL,
      commits: commits.map(({ repo, sha, url, message, date }) => ({ repo, sha: sha.slice(0, 12), url, message: message.split("\n")[0].trim(), date }))
    }),
    "---",
    "",
    parsed.content.trim(),
    ""
  ].join("\n");

  await mkdir(BUILD_LOG_DIR, { recursive: true });
  await writeFile(target, file, "utf8");
  await setGitHubOutput({ written: "true", slug: week.slug });
  console.log(`  Wrote content/build-log/${week.slug}.md: "${String(parsed.data.title).trim()}"\n`);
  return { written: true, slug: week.slug };
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`\nBuild log failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
