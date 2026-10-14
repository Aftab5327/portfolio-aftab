/**
 * Lexical retrieval over the knowledge index (MiniSearch, BM25-style scoring
 * with fuzzy + prefix matching). Server-only: imported by app/api/chat/route.ts
 * and the eval script, never by client components.
 */
import MiniSearch from "minisearch";
import indexJson from "@/data/knowledge-index.json";
import { miniSearchOptions, type IndexedChunk, type KnowledgeChunk, type KnowledgeIndexFile } from "@/lib/knowledge";

export type RetrievedChunk = KnowledgeChunk & { score: number };

export type Retrieval = {
  chunks: RetrievedChunk[];
  /** The query actually searched (rewritten for follow-ups). */
  query: string;
  followUp: boolean;
};

/**
 * A question with no content words left after stop-word removal ("Who is Aftab?",
 * "Tell me about him") is a general question about the person.
 */
const GENERAL_QUERY = "about bio summary background profile";

/** Pronouns and short questions that only make sense with the previous turn ("what stack did it use?"). */
const FOLLOW_UP = /\b(it|its|it's|that|this|those|these|they|them|their|there|same|the project|that project|which one)\b/i;

export function rewriteQuery(question: string, previousUserMessage?: string): { query: string; followUp: boolean } {
  const trimmed = question.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const followUp = Boolean(previousUserMessage?.trim()) && (FOLLOW_UP.test(trimmed) || wordCount <= 3);
  return { query: followUp ? `${previousUserMessage!.trim()} ${trimmed}` : trimmed, followUp };
}

export function createRetriever(file: KnowledgeIndexFile) {
  const index = MiniSearch.loadJSON<IndexedChunk>(file.index, miniSearchOptions(file.stopWords));
  const byId = new Map(file.chunks.map((chunk) => [chunk.id, chunk]));

  return {
    chunkCount: file.chunks.length,
    retrieve(question: string, previousUserMessage?: string, limit = 5): Retrieval {
      const { query, followUp } = rewriteQuery(question, previousUserMessage);
      let results = index.search(query);
      if (results.length === 0) results = index.search(GENERAL_QUERY);
      const chunks = results
        .slice(0, limit)
        .flatMap((result) => {
          const chunk = byId.get(String(result.id));
          return chunk ? [{ ...chunk, score: Math.round(result.score * 100) / 100 }] : [];
        });
      return { chunks, query, followUp };
    }
  };
}

let retriever: ReturnType<typeof createRetriever> | undefined;

/** Retriever over the committed/build-time index (data/knowledge-index.json). */
export function getRetriever() {
  retriever ??= createRetriever(indexJson as KnowledgeIndexFile);
  return retriever;
}
