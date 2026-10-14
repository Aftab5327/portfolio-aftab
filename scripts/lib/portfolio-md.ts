/**
 * Parser for the PORTFOLIO.md format (YAML frontmatter + "## Section" bodies).
 * Used for repo PORTFOLIO.md files, approved content/case-studies/*.md files and
 * AI drafts, so all three are validated identically.
 */
import path from "node:path";
import matter from "gray-matter";
import {
  FRONTMATTER_KEYS,
  SECTION_KEYS,
  portfolioFrontmatterSchema,
  type PortfolioFrontmatter,
  type ProjectSections,
  type SectionKey
} from "../../lib/schema";
import { encodePath, type GitHubRepo } from "./github";

const SECTION_ALIASES: Record<string, SectionKey> = {
  problem: "problem",
  solution: "solution",
  result: "result",
  results: "result",
  features: "features",
  feature: "features",
  challenges: "challenges",
  challenge: "challenges",
  architecture: "architecture"
};

export const emptySections = (): ProjectSections => ({
  problem: "",
  solution: "",
  result: "",
  features: "",
  challenges: "",
  architecture: ""
});

const isFence = (line: string) => /^\s*(```|~~~)/.test(line);

/** Splits the Markdown body on level-2 headings (ignoring headings inside code fences). */
function splitSections(body: string, label: string, warn: (message: string) => void): ProjectSections {
  const sections = emptySections();
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let current: SectionKey | null = null;
  let buffer: string[] = [];
  let inFence = false;
  let ignoredText = false;

  const flush = () => {
    if (current) {
      const text = buffer.join("\n").trim();
      sections[current] = sections[current] ? `${sections[current]}\n\n${text}` : text;
    }
    buffer = [];
  };

  for (const line of lines) {
    if (isFence(line)) inFence = !inFence;

    const heading = inFence ? null : line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flush();
      const key = SECTION_ALIASES[heading[1].toLowerCase().replace(/[^a-z]/g, "")];
      if (!key) warn(`${label}: unknown section "## ${heading[1]}" ignored (expected ${SECTION_KEYS.join(", ")})`);
      current = key ?? null;
      continue;
    }

    if (current) buffer.push(line);
    else if (line.trim() && !/^#\s/.test(line)) ignoredText = true;
  }
  flush();

  if (ignoredText) warn(`${label}: text outside a ## section was ignored`);
  return sections;
}

/** Makes relative links/images point at the repo on GitHub (outside code fences). */
export function absolutizeMarkdown(markdown: string, repo: GitHubRepo): string {
  if (!markdown) return markdown;

  const resolve = (target: string, kind: "raw" | "blob") => {
    if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return target;
    const clean = path.posix.normalize(target.replace(/^\.?\//, "").replace(/^\//, ""));
    if (clean.startsWith("..")) return target;
    return kind === "raw"
      ? `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${encodePath(clean)}`
      : `${repo.html_url}/blob/${repo.default_branch}/${encodePath(clean)}`;
  };

  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (isFence(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .replace(/(!\[[^\]]*\]\()\s*([^)\s]+)/g, (_m, prefix: string, target: string) => prefix + resolve(target, "raw"))
        .replace(/((?:^|[^!])\[[^\]]*\]\()\s*([^)\s]+)/g, (_m, prefix: string, target: string) => prefix + resolve(target, "blob"));
    })
    .join("\n");
}

export type ParsedPortfolio = {
  frontmatter: PortfolioFrontmatter;
  sections: ProjectSections;
  /** Problems found; the parser drops the offending part and carries on. */
  issues: string[];
};

/**
 * Parses a PORTFOLIO.md-format document. Never throws: invalid frontmatter fields,
 * unknown keys and unknown headings are reported in `issues` and skipped.
 * Pass `repo` to rewrite relative links/images to GitHub URLs.
 */
export function parsePortfolioMarkdown(markdown: string, label: string, repo?: GitHubRepo): ParsedPortfolio {
  const issues: string[] = [];
  const warn = (message: string) => issues.push(message);

  let parsed: matter.GrayMatterFile<string>;
  try {
    // A fresh options object bypasses gray-matter's module-level cache.
    parsed = matter(markdown, {});
  } catch (error) {
    warn(`${label}: could not parse frontmatter (${(error as Error).message})`);
    return { frontmatter: {}, sections: emptySections(), issues };
  }

  const unknownKeys = Object.keys(parsed.data).filter((key) => !FRONTMATTER_KEYS.includes(key));
  if (unknownKeys.length) warn(`${label}: unknown frontmatter key(s) ignored: ${unknownKeys.join(", ")}`);

  // Drop only the invalid fields so one typo doesn't discard the whole frontmatter.
  const data: Record<string, unknown> = { ...parsed.data };
  let result = portfolioFrontmatterSchema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "");
      warn(`${label}: frontmatter "${field}" is invalid (${issue.message}); ignored`);
      delete data[field];
    }
    result = portfolioFrontmatterSchema.safeParse(data);
  }
  const frontmatter: PortfolioFrontmatter = result.success ? result.data : {};

  const sections = splitSections(parsed.content, label, warn);
  if (repo) for (const key of SECTION_KEYS) sections[key] = absolutizeMarkdown(sections[key], repo);

  return { frontmatter, sections, issues };
}

/** Extracts the source of every ```mermaid block. */
export function mermaidBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/^\s*```mermaid[^\n]*\n([\s\S]*?)^\s*```/gm)].map((match) => match[1].trim());
}
