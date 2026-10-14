/**
 * Builds data/knowledge-index.json for the AI assistant (see docs/ai-assistant.md).
 * Runs automatically before `next build` (prebuild) and at the end of `npm run sync`.
 *
 * Usage: npm run knowledge
 */
import path from "node:path";
import { KNOWLEDGE_INDEX_PATH, writeKnowledgeIndex } from "./lib/knowledge-index";

writeKnowledgeIndex()
  .then(({ changed, chunks, bytes, byType }) => {
    const types = Object.entries(byType)
      .map(([type, count]) => `${type} ${count}`)
      .join(", ");
    const file = path.relative(process.cwd(), KNOWLEDGE_INDEX_PATH).replace(/\\/g, "/");
    console.log(`\nKnowledge index: ${chunks} chunks (${types}), ${(bytes / 1024).toFixed(1)} KB → ${file} ${changed ? "written" : "unchanged"}\n`);
  })
  .catch((error: unknown) => {
    console.error(`\nKnowledge index failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
