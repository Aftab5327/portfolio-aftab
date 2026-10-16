/**
 * CI guard for the resumes. Run after `next build`.
 *  - Generated /resume.pdf: must be prerendered, a valid PDF, under 300 KB, at most 2 pages.
 *  - Uploaded CV (profile.resume.source = "uploaded"): public/<uploadedPath> must exist,
 *    be a valid PDF and be under 1 MB.
 *
 * Usage: npm run check:resume
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { primaryResume } from "../lib/resume-file";
import { formatZodError, profileSchema } from "../lib/schema";

// Where Next 14 writes the body of a statically prerendered route handler.
const GENERATED_PATH = path.join(process.cwd(), ".next", "server", "app", "resume.pdf.body");
const GENERATED_MAX_BYTES = 300 * 1024;
const GENERATED_MAX_PAGES = 2;
const UPLOADED_MAX_BYTES = 1024 * 1024;

type Result = { summary: string; failures: string[] };

async function checkPdf(file: string, label: string, maxBytes: number, maxPages?: number): Promise<Result> {
  const failures: string[] = [];
  const bytes = await readFile(file);
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") failures.push("file does not start with a %PDF- header");
  if (bytes.length >= maxBytes) failures.push(`size ${(bytes.length / 1024).toFixed(1)} KB is not under ${maxBytes / 1024} KB`);

  let pages = 0;
  try {
    // ignoreEncryption: designed PDFs exported by some tools carry an owner password; they still open fine.
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    pages = pdf.getPageCount();
    if (pages < 1) failures.push("PDF has no pages");
    if (maxPages && pages > maxPages) failures.push(`${pages} pages (max ${maxPages}): trim profile content or lower resume.projectLimit`);
  } catch (error) {
    failures.push(`not a valid PDF: ${(error as Error).message}`);
  }

  const limits = `limits: < ${maxBytes / 1024} KB${maxPages ? `, ≤ ${maxPages} pages` : ""}`;
  return { summary: `${label}: ${(bytes.length / 1024).toFixed(1)} KB, ${pages} page(s) (${limits})`, failures };
}

async function main() {
  const results: Result[] = [];

  if (!(await stat(GENERATED_PATH).catch(() => null))) {
    throw new Error(`${path.relative(process.cwd(), GENERATED_PATH)} not found. Run \`npm run build\` first (is app/resume.pdf/route.ts still force-static?).`);
  }
  results.push(await checkPdf(GENERATED_PATH, "generated /resume.pdf", GENERATED_MAX_BYTES, GENERATED_MAX_PAGES));

  const profileResult = profileSchema.safeParse(JSON.parse((await readFile(path.join(process.cwd(), "content", "profile.json"), "utf8")).replace(/^﻿/, "")));
  if (!profileResult.success) throw new Error(formatZodError(profileResult.error, "content/profile.json"));
  const cv = primaryResume(profileResult.data.resume, profileResult.data.firstName);

  if (cv.source === "uploaded") {
    const file = path.join(process.cwd(), "public", cv.href);
    if (!(await stat(file).catch(() => null))) {
      results.push({ summary: `uploaded ${cv.href}`, failures: [`public${cv.href} not found (profile.resume.uploadedPath)`] });
    } else {
      results.push(await checkPdf(file, `uploaded ${cv.href}`, UPLOADED_MAX_BYTES));
    }
  }

  for (const result of results) {
    if (result.failures.length) console.error(`\n✗ ${result.summary}\n  - ${result.failures.join("\n  - ")}`);
    else console.log(`\n✓ ${result.summary}`);
  }
  console.log("");
  if (results.some((result) => result.failures.length)) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`\n✗ Resume check failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
