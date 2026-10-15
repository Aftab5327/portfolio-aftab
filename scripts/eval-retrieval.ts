/**
 * Retrieval eval for the AI assistant: recall@5 over content/eval/questions.json.
 * Builds the index in memory from the current data (no Groq, no network), so it
 * measures exactly what the next build will ship. Fails below `minRecall`.
 *
 * Usage: npm run eval:rag            (add -- --verbose to print every top-5)
 */
import path from "node:path";
import { createRetriever } from "../lib/retrieval";
import { readJson } from "./lib/fs";
import { buildKnowledgeFile } from "./lib/knowledge-index";

/** `requires`: skip the question unless a chunk matching it exists (e.g. "log:*" before the first build-log post). */
type EvalCase = { question: string; history?: string[]; expect: string[]; requires?: string };
type EvalFile = { minRecall: number; questions: EvalCase[] };

const K = 5;
const verbose = process.argv.includes("--verbose");

/** An expectation matches a chunk id, an id prefix ending in "*", or a project slug. */
const matches = (expectation: string, chunk: { id: string; projectSlug?: string }) =>
  expectation.endsWith("*") ? chunk.id.startsWith(expectation.slice(0, -1)) : chunk.id === expectation || chunk.projectSlug === expectation;

async function main() {
  const { minRecall, questions: allQuestions } = (await readJson(path.join(process.cwd(), "content", "eval", "questions.json"))) as EvalFile;
  const knowledge = buildKnowledgeFile();
  const retriever = createRetriever(knowledge);

  const questions = allQuestions.filter((item) => !item.requires || knowledge.chunks.some((chunk) => matches(item.requires!, chunk)));
  const skipped = allQuestions.length - questions.length;

  let recallSum = 0;
  const misses: string[] = [];
  console.log(
    `\nRetrieval eval: ${questions.length} questions${skipped ? ` (${skipped} skipped: required content not present yet)` : ""}, ${retriever.chunkCount} chunks, recall@${K}\n`
  );

  for (const item of questions) {
    const previous = item.history?.[item.history.length - 1];
    const { chunks, query, followUp } = retriever.retrieve(item.question, previous, K);
    const found = item.expect.filter((expectation) => chunks.some((chunk) => matches(expectation, chunk)));
    const recall = found.length / item.expect.length;
    recallSum += recall;

    const mark = recall === 1 ? "✓" : recall > 0 ? "~" : "✗";
    console.log(`  ${mark} ${recall.toFixed(2)}  ${item.question}${followUp ? `   (follow-up → "${query}")` : ""}`);
    if (recall < 1) {
      misses.push(item.question);
      console.log(`           missing: ${item.expect.filter((e) => !found.includes(e)).join(", ")}`);
    }
    if (verbose || recall < 1) {
      for (const chunk of chunks) console.log(`           ${chunk.score.toFixed(2).padStart(6)}  ${chunk.id}`);
    }
  }

  const recallAt5 = recallSum / questions.length;
  const passed = recallAt5 >= minRecall;
  console.log(`\n  recall@${K} = ${recallAt5.toFixed(3)} (threshold ${minRecall}) → ${passed ? "PASS" : "FAIL"}${misses.length ? `, ${misses.length} imperfect` : ""}\n`);
  if (!passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`\nEval failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
