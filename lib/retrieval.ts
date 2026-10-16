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

/**
 * At most this many chunks from one project in a result set, so a project with many
 * case-study sections can't crowd out everything else (e.g. the experience entry that
 * describes the same work).
 */
export const MAX_CHUNKS_PER_PROJECT = 3;

/** "project:hrms:solution" -> "project:hrms"; other chunks are their own group. */
const sourceOf = (id: string) => (id.startsWith("project:") ? id.split(":").slice(0, 2).join(":") : id);

export function createRetriever(file: KnowledgeIndexFile) {
  const index = MiniSearch.loadJSON<IndexedChunk>(file.index, miniSearchOptions(file.stopWords));
  const byId = new Map(file.chunks.map((chunk) => [chunk.id, chunk]));

  return {
    chunkCount: file.chunks.length,
    retrieve(question: string, previousUserMessage?: string, limit = 5): Retrieval {
      const { query, followUp } = rewriteQuery(question, previousUserMessage);
      let results = index.search(query);
      if (results.length === 0) results = index.search(GENERAL_QUERY);
      const perSource = new Map<string, number>();
      const chunks: RetrievedChunk[] = [];
      for (const result of results) {
        if (chunks.length >= limit) break;
        const chunk = byId.get(String(result.id));
        if (!chunk) continue;
        const source = sourceOf(chunk.id);
        const taken = perSource.get(source) ?? 0;
        if (taken >= MAX_CHUNKS_PER_PROJECT) continue;
        perSource.set(source, taken + 1);
        chunks.push({ ...chunk, score: Math.round(result.score * 100) / 100 });
      }
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
