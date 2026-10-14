/**
 * Captures a 1600×900 screenshot of each project's liveUrl with Playwright
 * (Chromium) and stores it as public/projects/auto/<slug>.webp.
 *
 * A project is captured when it has a liveUrl and either no explicit `image` or
 * `autoScreenshot: true`. To avoid commit churn, an existing screenshot is only
 * replaced when more than 2% of pixels changed. Results go to data/screenshots.json.
 *
 * Usage: npm run screenshots                 (all eligible projects)
 *        npm run screenshots -- <slug> ...   (only these)
 *        npm run screenshots -- --force      (replace even if nearly identical)
 * Needs a Chromium build: npx playwright install chromium
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { chromium, type Browser } from "playwright";
import sharp from "sharp";
import { readJson, readText } from "./lib/fs";
import { formatZodError, projectsFileSchema, screenshotsFileSchema, type Project, type ScreenshotEntry } from "../lib/schema";

const ROOT = process.cwd();
const PROJECTS_PATH = path.join(ROOT, "data", "projects.json");
const SCREENSHOTS_PATH = path.join(ROOT, "data", "screenshots.json");
const AUTO_DIR = path.join(ROOT, "public", "projects", "auto");

const WIDTH = 1600;
const HEIGHT = 900;
const NAVIGATION_TIMEOUT_MS = 30_000;
const SETTLE_DELAY_MS = 1_500;
const WEBP_QUALITY = 80;
/** Replace an existing screenshot only if more than this share of pixels changed. */
const CHANGE_THRESHOLD = 0.02;

const relative = (filePath: string) => path.relative(ROOT, filePath).replace(/\\/g, "/");
const sitePath = (slug: string) => `/projects/auto/${slug}.webp`;
const filePath = (slug: string) => path.join(AUTO_DIR, `${slug}.webp`);

const wantsScreenshot =(project: Project) => Boolean(project.liveUrl) && (!project.image || project.autoScreenshot);

async function capture(browser: Browser, url: string): Promise<Buffer> {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: NAVIGATION_TIMEOUT_MS });
    if (response && response.status() >= 400) throw new Error(`HTTP ${response.status()}`);
    // Give client-side rendering and web fonts a moment; don't fail on chatty pages.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(SETTLE_DELAY_MS);
    return await page.screenshot({ type: "png", timeout: NAVIGATION_TIMEOUT_MS });
  } finally {
    await context.close();
  }
}

/** Share of pixels that differ between two images, compared at WIDTH×HEIGHT. */
async function changedRatio(previous: Buffer, next: Buffer): Promise<number> {
  const toRaw = (image: Buffer) => sharp(image).resize(WIDTH, HEIGHT, { fit: "fill" }).ensureAlpha().raw().toBuffer();
  const [a, b] = await Promise.all([toRaw(previous), toRaw(next)]);
  // threshold 0.2 ignores faint shading shifts (animated glows, gradients); back-to-back
  // captures of a live dashboard measured ~1% noise at 0.2 vs ~1.4% at 0.1.
  const different = pixelmatch(a, b, null, WIDTH, HEIGHT, { threshold: 0.2 });
  return different / (WIDTH * HEIGHT);
}

const shortError = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split("\n")[0].replace(/\s+/g, " ").slice(0, 200);

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || process.env.npm_config_force === "true";
  const only = new Set(args.filter((arg) => !arg.startsWith("-")));

  const projectsResult = projectsFileSchema.safeParse(await readJson(PROJECTS_PATH));
  if (!projectsResult.success) throw new Error(formatZodError(projectsResult.error, relative(PROJECTS_PATH)));
  const projects = projectsResult.data.projects;

  let previousRaw = "";
  let previous: Record<string, ScreenshotEntry> = {};
  try {
    previousRaw = await readText(SCREENSHOTS_PATH);
    const parsed = screenshotsFileSchema.safeParse(JSON.parse(previousRaw));
    if (parsed.success) previous = parsed.data;
    else console.warn(`  ${relative(SCREENSHOTS_PATH)} is invalid and will be rebuilt`);
  } catch {
    // First run.
  }

  const eligible = projects.filter(wantsScreenshot);
  const targets = eligible.filter((project) => !only.size || only.has(project.slug));
  const next: Record<string, ScreenshotEntry> = {};
  const report = { replaced: [] as string[], unchanged: [] as string[], failed: [] as string[], removed: [] as string[] };

  // Keep entries for eligible projects we aren't capturing this run (e.g. filtered with <slug> args).
  for (const project of eligible) if (previous[project.slug]) next[project.slug] = previous[project.slug];

  console.log(`\nProject screenshots: ${targets.length} to capture (${eligible.length} eligible of ${projects.length} projects)\n`);

  let browser: Browser | undefined;
  try {
    if (targets.length) browser = await chromium.launch();

    for (const project of targets) {
      const before = previous[project.slug];
      process.stdout.write(`  ▸ ${project.slug} (${project.liveUrl}) … `);
      try {
        const png = await capture(browser!, project.liveUrl);
        const webp = await sharp(png).webp({ quality: WEBP_QUALITY }).toBuffer();
        const existing = await readFile(filePath(project.slug)).catch(() => null);
        // Compare WebP with WebP so lossy-compression noise doesn't count as a change.
        const ratio = existing ? await changedRatio(existing, webp) : 1;

        if (!existing || force || ratio > CHANGE_THRESHOLD) {
          await mkdir(AUTO_DIR, { recursive: true });
          await writeFile(filePath(project.slug), webp);
          next[project.slug] = { path: sitePath(project.slug), capturedAt: new Date().toISOString(), status: "ok" };
          report.replaced.push(project.slug);
          console.log(existing ? `updated (${(ratio * 100).toFixed(1)}% changed)` : `captured (${Math.round(webp.length / 1024)} KB)`);
        } else {
          next[project.slug] = {
            path: sitePath(project.slug),
            capturedAt: before?.capturedAt || new Date().toISOString(),
            status: "ok"
          };
          report.unchanged.push(project.slug);
          console.log(`unchanged (${(ratio * 100).toFixed(2)}% ≤ ${CHANGE_THRESHOLD * 100}%)`);
        }
      } catch (error) {
        // Keep whatever screenshot we had; just record the failure.
        next[project.slug] = {
          path: before?.path ?? "",
          capturedAt: before?.capturedAt ?? "",
          status: "failed",
          error: shortError(error)
        };
        report.failed.push(project.slug);
        console.log(`failed: ${shortError(error)}`);
      }
    }
  } finally {
    await browser?.close();
  }

  // Projects that no longer qualify (explicit image added, liveUrl removed, project deleted).
  if (!only.size) {
    for (const slug of Object.keys(previous)) {
      if (!next[slug]) {
        await rm(filePath(slug), { force: true });
        report.removed.push(slug);
      }
    }
  }

  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
  const validated = screenshotsFileSchema.safeParse(sorted);
  if (!validated.success) throw new Error(formatZodError(validated.error, relative(SCREENSHOTS_PATH)));

  const json = `${JSON.stringify(sorted, null, 2)}\n`;
  const changed = json !== previousRaw.replace(/\r\n/g, "\n");
  if (changed) await writeFile(SCREENSHOTS_PATH, json, "utf8");

  console.log(`\n  Captured/updated: ${report.replaced.length}${report.replaced.length ? ` → ${report.replaced.join(", ")}` : ""}`);
  console.log(`  Unchanged:        ${report.unchanged.length}${report.unchanged.length ? ` → ${report.unchanged.join(", ")}` : ""}`);
  console.log(`  Failed:           ${report.failed.length}${report.failed.length ? ` → ${report.failed.join(", ")}` : ""}`);
  console.log(`  Removed:          ${report.removed.length}${report.removed.length ? ` → ${report.removed.join(", ")}` : ""}`);
  console.log(`  Output:           ${relative(SCREENSHOTS_PATH)} ${changed ? "written" : "unchanged"}\n`);

  // Fail the run only if every capture failed (e.g. Chromium missing), not for one flaky site.
  if (targets.length && report.failed.length === targets.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`\nScreenshots failed: ${shortError(error)}\n`);
  process.exitCode = 1;
});
