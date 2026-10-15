/**
 * Weekly build-log posts: content/build-log/<yyyy>-w<ww>.md, written by
 * scripts/build-log.ts (AI summary of real commits) and committed. Read at
 * build time by /log, /log/[slug], /log/rss.xml and the knowledge index.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const BUILD_LOG_DIR = path.join(process.cwd(), "content", "build-log");
export const POST_SLUG = /^\d{4}-w\d{2}$/;

/** YAML may turn unquoted dates into Date objects; normalise to "yyyy-mm-dd". */
const dateString = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);

export const buildLogFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    /** Publication date (the Monday the post was generated for). */
    date: dateString,
    weekStart: dateString,
    weekEnd: dateString,
    repos: z.array(z.string().min(1)).min(1),
    commitCount: z.number().int().positive(),
    aiGenerated: z.boolean(),
    model: z.string().optional(),
    commits: z.array(
      z
        .object({
          repo: z.string().min(1),
          sha: z.string().regex(/^[0-9a-f]{7,40}$/),
          url: z.string().url(),
          message: z.string().min(1),
          date: z.string()
        })
        .strict()
    )
  })
  .strict();

export type BuildLogPost = z.infer<typeof buildLogFrontmatterSchema> & { slug: string; body: string };

/** All posts, newest first. Invalid files fail the build with a readable error. */
export function getBuildLogPosts(dir = BUILD_LOG_DIR): BuildLogPost[] {
  // Posts are only read at build time (every consumer is prerendered), so Turbopack
  // needn't trace these `dir`-relative reads into the server bundle.
  const root = path.join(/*turbopackIgnore: true*/ dir);
  let files: string[];
  try {
    files = readdirSync(root).filter((file) => file.endsWith(".md") && POST_SLUG.test(file.slice(0, -3)));
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const raw = readFileSync(path.join(/*turbopackIgnore: true*/ root, file), "utf8").replace(/^﻿/, "");
      const parsed = matter(raw, {});
      const result = buildLogFrontmatterSchema.safeParse(parsed.data);
      if (!result.success) {
        const issues = result.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
        throw new Error(`Invalid build-log frontmatter in content/build-log/${file}:\n${issues}`);
      }
      return { ...result.data, slug: file.slice(0, -3), body: parsed.content.trim() };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

export function getBuildLogPost(slug: string): BuildLogPost | undefined {
  return getBuildLogPosts().find((post) => post.slug === slug);
}

/** "### repo" headings and "- bullet" lines → plain text (for RSS descriptions and the knowledge index). */
export const plainText = (markdown: string) =>
  markdown
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").replace(/^[-*]\s+/, "• ").trim())
    .filter(Boolean)
    .join("\n");
