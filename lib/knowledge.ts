/**
 * Shared definitions for the assistant's knowledge index: the chunk shape, the
 * index file format and the MiniSearch options. Used by the index builder
 * (scripts/lib/knowledge-index.ts) and the retriever (lib/retrieval.ts), so
 * indexing and querying always tokenize text the same way.
 */
import MiniSearch, { type Options, type SearchOptions } from "minisearch";

export type ChunkType = "profile" | "skills" | "experience" | "education" | "certifications" | "resume" | "project";

export type KnowledgeChunk = {
  /** Stable id, e.g. "profile:contact", "skills:database", "project:infrasense-360:challenges". */
  id: string;
  title: string;
  text: string;
  type: ChunkType;
  /** Where the chunk's information lives on the site, e.g. "/projects/infrasense-360#challenges". */
  url: string;
  tags: string[];
  projectSlug?: string;
};

export type KnowledgeIndexFile = {
  version: 1;
  /** Extra stop words (e.g. the owner's name, which appears in every chunk). */
  stopWords: string[];
  chunks: KnowledgeChunk[];
  /** Serialized MiniSearch index, kept as a string (cheap to type-check and to load). */
  index: string;
};

/** Words that carry no meaning for retrieval ("what stack did it use" → "stack"). */
const BASE_STOP_WORDS = [
  "a", "about", "all", "also", "am", "an", "and", "any", "are", "as", "at", "be", "been", "but", "by", "can", "could",
  "did", "do", "does", "doing", "for", "from", "get", "give", "had", "has", "have", "he", "her", "here", "him", "his",
  "how", "i", "if", "in", "into", "is", "it", "its", "just", "know", "let", "like", "me", "more", "much", "my", "of", "on",
  "one", "or", "our", "please", "she", "show", "so", "some", "tell", "than", "that", "the", "their", "them", "then",
  "there", "these", "they", "this", "those", "to", "us", "use", "used", "uses", "using", "was", "we", "were", "what",
  "when", "where", "which", "who", "whom", "why", "will", "with", "would", "you", "your"
];

export function makeProcessTerm(extraStopWords: string[] = []) {
  const stopWords = new Set([...BASE_STOP_WORDS, ...extraStopWords.map((word) => word.toLowerCase())]);
  return (term: string): string | null => {
    const value = term.toLowerCase();
    if (stopWords.has(value)) return null;
    if (value.length < 2 && !/\d/.test(value)) return null;
    return value;
  };
}

/** Indexed document: a chunk plus its tags flattened into one searchable string. */
export type IndexedChunk = Pick<KnowledgeChunk, "id" | "title" | "text"> & { keywords: string };

export const SEARCH_OPTIONS: SearchOptions = {
  boost: { title: 3, keywords: 2 },
  fuzzy: 0.2,
  prefix: true,
  combineWith: "OR"
};

export function miniSearchOptions(stopWords: string[]): Options<IndexedChunk> {
  return {
    idField: "id",
    fields: ["title", "keywords", "text"],
    storeFields: [],
    processTerm: makeProcessTerm(stopWords),
    searchOptions: SEARCH_OPTIONS
  };
}

export function createIndex(chunks: KnowledgeChunk[], stopWords: string[]): MiniSearch<IndexedChunk> {
  const index = new MiniSearch<IndexedChunk>(miniSearchOptions(stopWords));
  index.addAll(chunks.map(({ id, title, text, tags }) => ({ id, title, text, keywords: tags.join(" ") })));
  return index;
}
