/**
 * CI guard for the generated resume. Run after `next build`.
 * Fails if /resume.pdf wasn't prerendered, isn't a valid PDF, is 300 KB or more,
 * or has more than 2 pages.
 *
 * Usage: npm run check:resume
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

// Where Next 14 writes the body of a statically prerendered route handler.
const PDF_PATH = path.join(process.cwd(), ".next", "server", "app", "resume.pdf.body");
const MAX_BYTES = 300 * 1024;
const MAX_PAGES = 2;

async function main() {
  const failures: string[] = [];

  const info = await stat(PDF_PATH).catch(() => null);
  if (!info) {
    throw new Error(`${path.relative(process.cwd(), PDF_PATH)} not found. Run \`npm run build\` first (is app/resume.pdf/route.ts still force-static?).`);
  }

  const bytes = await readFile(PDF_PATH);
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") failures.push("file does not start with a %PDF- header");
  if (bytes.length >= MAX_BYTES) failures.push(`size ${(bytes.length / 1024).toFixed(1)} KB is not under ${MAX_BYTES / 1024} KB`);

  let pages = 0;
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    pages = pdf.getPageCount();
    if (pages < 1) failures.push("PDF has no pages");
    if (pages > MAX_PAGES) failures.push(`${pages} pages (max ${MAX_PAGES}): trim profile content or lower resume.projectLimit`);
  } catch (error) {
    failures.push(`not a valid PDF: ${(error as Error).message}`);
  }

  const summary = `resume.pdf: ${(bytes.length / 1024).toFixed(1)} KB, ${pages} page(s)`;
  if (failures.length) {
    console.error(`\n✗ ${summary}\n  - ${failures.join("\n  - ")}\n`);
    process.exitCode = 1;
  } else {
    console.log(`\n✓ ${summary} (limits: < ${MAX_BYTES / 1024} KB, ≤ ${MAX_PAGES} pages)\n`);
  }
}

main().catch((error: unknown) => {
  console.error(`\n✗ Resume check failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
