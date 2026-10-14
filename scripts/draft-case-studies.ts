/**
 * Drafts case studies with Groq for `portfolio`-tagged repos that have neither a
 * PORTFOLIO.md nor an approved content/case-studies/<slug>.md.
 *
 * Output goes to content/drafts/<slug>.md and is never overwritten. Review a
 * draft, replace its TODO markers, then `npm run approve <slug>`.
 *
 * Usage: npm run draft                 (all eligible repos)
 *        npm run draft -- <slug> ...   (only these)
 * Needs GROQ_API_KEY; GITHUB_TOKEN optional. See docs/automation.md.
 */
import { appendFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { GROQ_MODEL } from "../lib/config";
import { SECTION_KEYS, formatZodError, profileSchema } from "../lib/schema";
import {
  PORTFOLIO_FILE,
  fetchLanguages,
  fetchRepoFile,
  fetchRepoText,
  github,
  githubJson,
  isPortfolioRepo,
  listPublicRepos,
  slugify,
  type GitHubRepo
} from "./lib/github";
import { readJson, readText } from "./lib/fs";
import { mermaidBlocks, parsePortfolioMarkdown } from "./lib/portfolio-md";

const ROOT = process.cwd();
const PROFILE_PATH = path.join(ROOT, "content", "profile.json");
const DRAFT_DIR = path.join(ROOT, "content", "drafts");
const CASE_STUDY_DIR = path.join(ROOT, "content", "case-studies");
const SKIP_FILE = path.join(ROOT, "content", "draft-skip.txt");

/** Total context sent to the model, in characters (~4 chars per token). */
const MAX_CONTEXT_CHARS = 14_000;
const LIMITS = { readme: 6_000, tree: 2_500, manifest: 2_000, commits: 1_500 };
const MAX_TREE_DEPTH = 3;
const MAX_TREE_ENTRIES = 150;
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "out", ".next", ".git", ".github", "coverage", "vendor",
  "__pycache__", ".venv", "venv", "env", "target", ".idea", ".vscode", ".cache", ".turbo"
]);
const LOCKFILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "poetry.lock",
  "Pipfile.lock", "Cargo.lock", "composer.lock", "Gemfile.lock", "go.sum"
]);

const FENCE = "```";

const SYSTEM_PROMPT = `You write portfolio case studies for software projects. Reply with ONE Markdown document in the exact format below and nothing else: no preamble, no explanation, no surrounding code fence.

STRICT RULES
1. Use ONLY facts stated in the CONTEXT. Do not use outside knowledge about the project.
2. NEVER invent metrics, numbers, percentages, user or customer counts, performance figures, revenue, awards, clients, dates, team sizes or deployment details.
3. When a section needs information the CONTEXT does not contain, write a line starting with "TODO:" that says what the author must add, e.g. "TODO: add measurable results (users, performance, time saved)".
4. The Result section may only contain outcomes stated in the CONTEXT; otherwise it must consist of TODO: lines.
5. Write in the third person about "the project" (never "I" or "we"). Be concise and specific; no marketing language.
6. Do not use raw HTML.

FORMAT (keep the keys, headings and their order exactly):
---
title: <human-readable project name>
tagline: <one sentence, at most 160 characters>
category: <2-3 short labels joined with " · ", e.g. "IoT · Full Stack">
stack: [<technologies evidenced by the CONTEXT, comma-separated>]
---

## Problem
<one short paragraph: the problem or need the project addresses>

## Solution
<one or two short paragraphs: how the project works>

## Result
<bullets of outcomes stated in the CONTEXT, or TODO: lines>

## Features
<3-6 bullets, only features evidenced by the README, file tree or commits>

## Challenges
<1-3 bullets evidenced by the CONTEXT (for example commit messages), or TODO: lines>

## Architecture
<one sentence describing the architecture>

${FENCE}mermaid
flowchart LR
  A[Component] --> B[Component]
${FENCE}

MERMAID RULES: the diagram must start with "flowchart LR". Node ids are short words without spaces. Labels go in square brackets and may contain only letters, digits, spaces, dots, slashes and hyphens (no parentheses, quotes or colons). Only show components evidenced by the CONTEXT.`;

const warnings: string[] = [];
const warn = (message: string) => warnings.push(message);

// ── Context gathering ────────────────────────────────────────────────────────

const truncate = (text: string, limit: number) =>
  text.length <= limit ? text : `${text.slice(0, limit).trimEnd()}\n… [truncated]`;

async function fetchReadme(repo: GitHubRepo): Promise<string> {
  const response = await github(`/repos/${repo.full_name}/readme`, "application/vnd.github.raw");
  if (response.status === 404) return "";
  if (!response.ok) throw new Error(`fetching README failed: ${response.status}`);
  return response.text();
}

async function fetchTree(repo: GitHubRepo): Promise<string[]> {
  const data = await githubJson<{ tree: { path: string; type: string }[] }>(
    `/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`
  );
  return data.tree
    .filter((entry) => {
      const parts = entry.path.split("/");
      return parts.length <= MAX_TREE_DEPTH && !parts.some((part) => SKIP_DIRS.has(part)) && !LOCKFILES.has(parts[parts.length - 1]);
    })
    .map((entry) => (entry.type === "tree" ? `${entry.path}/` : entry.path))
    .sort()
    .slice(0, MAX_TREE_ENTRIES);
}

async function fetchManifests(repo: GitHubRepo, tree: string[]): Promise<string> {
  const parts: string[] = [];

  if (tree.includes("package.json")) {
    const raw = await fetchRepoText(repo, "package.json");
    if (raw) {
      try {
        const pkg = JSON.parse(raw) as Record<string, unknown>;
        const keys = (value: unknown) => (value && typeof value === "object" ? Object.keys(value) : []);
        parts.push(
          [
            "package.json:",
            pkg.name ? `  name: ${String(pkg.name)}` : "",
            pkg.description ? `  description: ${String(pkg.description)}` : "",
            `  scripts: ${keys(pkg.scripts).join(", ") || "none"}`,
            `  dependencies: ${keys(pkg.dependencies).join(", ") || "none"}`,
            `  devDependencies: ${keys(pkg.devDependencies).join(", ") || "none"}`
          ]
            .filter(Boolean)
            .join("\n")
        );
      } catch {
        parts.push(`package.json (unparsed):\n${raw}`);
      }
    }
  }

  for (const file of ["requirements.txt", "pyproject.toml", "platformio.ini"]) {
    if (!tree.includes(file)) continue;
    const raw = await fetchRepoText(repo, file);
    if (raw) parts.push(`${file}:\n${raw.trim()}`);
  }

  return parts.join("\n\n");
}

async function fetchCommitMessages(repo: GitHubRepo): Promise<string[]> {
  const commits = await githubJson<{ sha: string; commit: { message: string } }[]>(
    `/repos/${repo.full_name}/commits?per_page=30&sha=${encodeURIComponent(repo.default_branch)}`
  );
  return commits.map((item) => item.commit.message.split("\n")[0].trim()).filter((message) => message && !/^Merge /.test(message));
}

async function latestSha(repo: GitHubRepo): Promise<string> {
  const commits = await githubJson<{ sha: string }[]>(
    `/repos/${repo.full_name}/commits?per_page=1&sha=${encodeURIComponent(repo.default_branch)}`
  ).catch(() => []);
  return commits[0]?.sha.slice(0, 7) ?? "unknown";
}

async function buildContext(repo: GitHubRepo): Promise<string> {
  const [readme, tree, languages, commits] = await Promise.all([
    fetchReadme(repo),
    fetchTree(repo),
    fetchLanguages(repo),
    fetchCommitMessages(repo)
  ]);
  const manifests = await fetchManifests(repo, tree);

  const sections = [
    [
      "# Repository",
      `name: ${repo.name}`,
      `url: ${repo.html_url}`,
      `description: ${repo.description ?? "(none)"}`,
      `homepage: ${repo.homepage || "(none)"}`,
      `primary language: ${repo.language ?? "(unknown)"}`,
      `languages: ${languages.map((language) => `${language.name} ${language.percent}%`).join(", ") || "(unknown)"}`,
      `topics: ${(repo.topics ?? []).filter((topic) => topic !== "portfolio").join(", ") || "(none)"}`
    ].join("\n"),
    `# README\n${truncate(readme.trim() || "(no README)", LIMITS.readme)}`,
    `# File tree (depth <= ${MAX_TREE_DEPTH})\n${truncate(tree.join("\n") || "(empty)", LIMITS.tree)}`,
    manifests ? `# Dependency manifests\n${truncate(manifests, LIMITS.manifest)}` : "",
    `# Recent commit messages (newest first)\n${truncate(commits.map((message) => `- ${message}`).join("\n") || "(none)", LIMITS.commits)}`
  ].filter(Boolean);

  return truncate(sections.join("\n\n"), MAX_CONTEXT_CHARS);
}

// ── Model call + validation ──────────────────────────────────────────────────

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGroq(messages: ChatMessage[]): Promise<string> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.2, max_tokens: 2000, messages })
    });

    if (response.status === 429 && attempt < 2) {
      const wait = Math.min(Number(response.headers.get("retry-after")) || 20, 60);
      console.log(`    rate limited by Groq; waiting ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`Groq API ${response.status}: ${(await response.text()).slice(0, 200)}`);

    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("Groq returned an empty response");
    return content;
  }
}

/** Removes a code fence wrapped around the whole document, if the model added one. */
function cleanOutput(text: string): string {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  return `${(wrapped ? wrapped[1] : trimmed).trim()}\n`;
}

/** Metric-like numbers: "40%", "3x", "10k", "500+", "120 ms", "1,000 users"... */
const METRIC_PATTERN =
  /\b(\d[\d,.]*)\s*(%|x\b|×|k\b|\+|ms\b|users?\b|customers?\b|clients?\b|downloads?\b|visitors?\b|requests?\b|hours?\b|minutes?\b|seconds?\b|days?\b|times\b)/gi;

function validateDraft(markdown: string, context: string, slug: string): string[] {
  const problems: string[] = [];
  if (!markdown.startsWith("---")) problems.push("The document must start with the --- frontmatter block.");

  const { frontmatter, sections, issues } = parsePortfolioMarkdown(markdown, slug);
  problems.push(...issues.map((issue) => issue.replace(`${slug}: `, "")));

  for (const key of ["title", "tagline", "category"] as const) {
    if (!frontmatter[key]?.trim()) problems.push(`Frontmatter "${key}" is missing.`);
  }
  if (!frontmatter.stack?.length) problems.push(`Frontmatter "stack" must be a non-empty list.`);

  for (const key of SECTION_KEYS) {
    if (!sections[key].trim()) problems.push(`Section "## ${key[0].toUpperCase()}${key.slice(1)}" is missing or empty.`);
  }

  const diagrams = mermaidBlocks(sections.architecture);
  if (diagrams.length === 0) {
    problems.push("The Architecture section must contain a ```mermaid code block.");
  } else {
    for (const diagram of diagrams) {
      if (!/^(flowchart|graph)\s+(LR|RL|TB|TD|BT)\b/.test(diagram)) problems.push('The mermaid diagram must start with "flowchart LR".');
      const badLabels = diagram.match(/\[[^\]]*["():][^\]]*\]/g);
      if (badLabels) problems.push(`Mermaid labels must not contain parentheses, quotes or colons: ${badLabels.slice(0, 3).join(" ")}`);
    }
  }

  // Any metric-like number must appear in the context; otherwise it was invented.
  const prose = SECTION_KEYS.map((key) => sections[key].replace(/```[\s\S]*?```/g, ""))
    .join("\n")
    .split("\n")
    .filter((line) => !line.includes("TODO:"))
    .join("\n");
  const invented = [...prose.matchAll(METRIC_PATTERN)]
    .filter((match) => !context.includes(match[1]))
    .map((match) => match[0].trim());
  if (invented.length) {
    problems.push(
      `These numbers do not appear in the CONTEXT and must be removed or replaced with a TODO: line: ${[...new Set(invented)].join(", ")}`
    );
  }

  return problems;
}

function withReviewHeader(markdown: string, repo: GitHubRepo, sha: string, slug: string): string {
  const header = [
    `# AI DRAFT: generated ${new Date().toISOString().slice(0, 10)} by npm run draft from ${repo.full_name}@${sha} (${GROQ_MODEL}).`,
    `# Check every statement against the repo and replace each TODO marker, then run: npm run approve ${slug}`
  ].join("\n");
  return markdown.replace(/^---\r?\n/, `---\n${header}\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function listDrafts(): Promise<string[]> {
  return (await readdir(DRAFT_DIR).catch(() => [] as string[]))
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .map((file) => file.slice(0, -3))
    .sort();
}

async function readSkipList(): Promise<Set<string>> {
  const raw = await readText(SKIP_FILE).catch(() => "");
  return new Set(
    raw
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean)
  );
}

async function setGitHubOutput(values: Record<string, string>) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(""));
}

async function main() {
  const only = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith("-")));

  const profileResult = profileSchema.safeParse(await readJson(PROFILE_PATH));
  if (!profileResult.success) throw new Error(formatZodError(profileResult.error, "content/profile.json"));
  const username = profileResult.data.githubUsername;
  const skipList = await readSkipList();

  console.log(`\nCase-study drafts for @${username} (${GROQ_MODEL})\n`);

  const tagged = (await listPublicRepos(username)).filter(isPortfolioRepo);
  const skipped: string[] = [];
  const candidates: { repo: GitHubRepo; slug: string }[] = [];

  for (const repo of tagged) {
    const slug = slugify(repo.name);
    if (only.size && !only.has(slug)) continue;
    if (skipList.has(slug)) skipped.push(`${slug}: listed in content/draft-skip.txt`);
    else if (existsSync(path.join(CASE_STUDY_DIR, `${slug}.md`))) skipped.push(`${slug}: approved case study exists`);
    else if (existsSync(path.join(DRAFT_DIR, `${slug}.md`))) skipped.push(`${slug}: draft already exists`);
    else if (await fetchRepoFile(repo, PORTFOLIO_FILE)) skipped.push(`${slug}: repo has ${PORTFOLIO_FILE}`);
    else candidates.push({ repo, slug });
  }

  const drafted: string[] = [];
  const failed: string[] = [];

  if (candidates.length && !process.env.GROQ_API_KEY) {
    throw new Error(`GROQ_API_KEY is not set (${candidates.length} repo(s) need a draft: ${candidates.map((c) => c.slug).join(", ")})`);
  }

  for (const { repo, slug } of candidates) {
    console.log(`  ▸ ${slug}`);
    try {
      const [context, sha] = await Promise.all([buildContext(repo), latestSha(repo)]);
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CONTEXT:\n${context}\n\nWrite the PORTFOLIO.md for this project now.` }
      ];

      let output = cleanOutput(await callGroq(messages));
      let problems = validateDraft(output, context, slug);

      if (problems.length) {
        console.log(`    invalid output (${problems.length} problem(s)); retrying once`);
        messages.push(
          { role: "assistant", content: output },
          {
            role: "user",
            content: `Your document has these problems:\n${problems.map((problem) => `- ${problem}`).join("\n")}\n\nReturn the corrected, complete document in the exact format. Use only facts from the CONTEXT and TODO: lines for anything unknown.`
          }
        );
        output = cleanOutput(await callGroq(messages));
        problems = validateDraft(output, context, slug);
      }

      if (problems.length) {
        failed.push(slug);
        warn(`${slug}: model output still invalid after retry; skipped:\n      - ${problems.join("\n      - ")}`);
        continue;
      }

      await mkdir(DRAFT_DIR, { recursive: true });
      const target = path.join(DRAFT_DIR, `${slug}.md`);
      if (existsSync(target)) {
        warn(`${slug}: a draft appeared while running; not overwritten`);
        continue;
      }
      await writeFile(target, withReviewHeader(output, repo, sha, slug), "utf8");
      drafted.push(slug);
      const todos = (output.match(/TODO:/g) ?? []).length;
      console.log(`    wrote content/drafts/${slug}.md (${todos} TODO marker(s) to fill in)`);
    } catch (error) {
      failed.push(slug);
      warn(`${slug}: ${(error as Error).message}`);
    }
  }

  const allDrafts = await listDrafts();
  await setGitHubOutput({ count: String(drafted.length), slugs: drafted.join(", "), all_slugs: allDrafts.join(", ") });

  console.log(`\n  Tagged repos:  ${tagged.length}`);
  console.log(`  Drafted:       ${drafted.length}${drafted.length ? ` → ${drafted.join(", ")}` : ""}`);
  console.log(`  Skipped:       ${skipped.length}${skipped.length ? `\n      ${skipped.join("\n      ")}` : ""}`);
  console.log(`  Failed:        ${failed.length}${failed.length ? ` → ${failed.join(", ")}` : ""}`);
  console.log(`  Pending drafts in content/drafts/: ${allDrafts.length ? allDrafts.join(", ") : "none"}`);
  if (warnings.length) {
    console.log(`\n  Warnings (${warnings.length}):`);
    for (const message of warnings) console.log(`    - ${message}`);
  }
  console.log("");
}

main().catch((error: unknown) => {
  console.error(`\nDraft failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
