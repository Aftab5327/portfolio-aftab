/**
 * Moves a reviewed AI draft from content/drafts/<slug>.md to
 * content/case-studies/<slug>.md, where `npm run sync` picks it up.
 *
 * Usage: npm run approve <slug>
 *        npm run approve <slug> -- --force    (allow remaining TODO markers / parser warnings)
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { SECTION_KEYS } from "../lib/schema";
import { readText } from "./lib/fs";
import { parsePortfolioMarkdown } from "./lib/portfolio-md";

const ROOT = process.cwd();
const DRAFT_DIR = path.join(ROOT, "content", "drafts");
const CASE_STUDY_DIR = path.join(ROOT, "content", "case-studies");

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  // `npm run approve x --force` is swallowed by npm and shows up as npm_config_force instead.
  const force = args.includes("--force") || process.env.npm_config_force === "true";
  const slug = args.find((arg) => !arg.startsWith("-"));

  const drafts = (await readdir(DRAFT_DIR).catch(() => [] as string[])).filter((file) => file.endsWith(".md") && file !== "README.md").map((file) => file.slice(0, -3));
  if (!slug) fail(`Usage: npm run approve <slug> [-- --force]\nPending drafts: ${drafts.join(", ") || "none"}`);

  const draftPath = path.join(DRAFT_DIR, `${slug}.md`);
  const targetPath = path.join(CASE_STUDY_DIR, `${slug}.md`);
  if (!existsSync(draftPath)) fail(`No draft at content/drafts/${slug}.md. Pending drafts: ${drafts.join(", ") || "none"}`);
  if (existsSync(targetPath)) fail(`content/case-studies/${slug}.md already exists. Edit it directly instead of approving a new draft.`);

  const original = await readText(draftPath);
  // Drop the "# AI DRAFT ..." review header the draft script adds to the frontmatter.
  const raw = original.replace(/^# (AI DRAFT:|Check every statement).*\r?\n/gm, "");

  // Line numbers refer to the draft file as the reviewer sees it.
  const todoLines = original
    .split(/\r?\n/)
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.includes("TODO:"));

  const { sections, issues } = parsePortfolioMarkdown(raw, `${slug}.md`);
  const empty = SECTION_KEYS.filter((key) => !sections[key].trim());

  const problems = [
    ...todoLines.map(({ line, number }) => `line ${number}: ${line.trim()}`),
    ...issues,
    ...(empty.length === SECTION_KEYS.length ? ["no ## sections found"] : [])
  ];

  if (problems.length && !force) {
    fail(
      `Not approved: content/drafts/${slug}.md still needs work:\n  - ${problems.join("\n  - ")}\n\n` +
        `Fix these (replace every TODO: line), or approve anyway with: npm run approve ${slug} -- --force`
    );
  }

  await mkdir(CASE_STUDY_DIR, { recursive: true });
  await writeFile(targetPath, raw, "utf8");
  await rm(draftPath);

  console.log(`\nApproved: content/drafts/${slug}.md → content/case-studies/${slug}.md`);
  if (problems.length) console.log(`  (forced with ${problems.length} remaining problem(s))`);
  if (empty.length && empty.length < SECTION_KEYS.length) console.log(`  Empty sections (hidden on the site): ${empty.join(", ")}`);
  console.log(`  Next: commit it. The next sync (or \`npm run sync\`) publishes it to data/projects.json.\n`);
}

main().catch((error: unknown) => fail(`Approve failed: ${error instanceof Error ? error.message : String(error)}`));
