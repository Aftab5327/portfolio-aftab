/**
 * Builds the assistant's knowledge chunks from the same data the site renders:
 * content/profile.json, data/projects.json (every case-study section plus GitHub
 * metadata) and the generated resume. One chunk per profile section, per
 * experience entry, per skill group and per project case-study section.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBuildLogPosts, plainText } from "../../lib/build-log";
import { RESUME_JSON_PATH, RESUME_PAGE_PATH, RESUME_PATH } from "../../lib/config";
import { getProfile, getProjects } from "../../lib/data";
import { createIndex, type KnowledgeChunk, type KnowledgeIndexFile } from "../../lib/knowledge";
import { buildResume } from "../../lib/resume";
import { SECTION_KEYS, type SectionKey } from "../../lib/schema";

export const KNOWLEDGE_INDEX_PATH = path.join(process.cwd(), "data", "knowledge-index.json");

/** Keeps the prompt small: a chunk is at most this many characters. */
const MAX_CHUNK_CHARS = 1_500;

const SECTION_TITLES: Record<SectionKey, string> = {
  problem: "Problem",
  solution: "Solution",
  result: "Result",
  features: "Features",
  challenges: "Challenges",
  architecture: "Architecture"
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Lowercase keyword tags from free text ("IoT · Full Stack" → ["iot", "full", "stack"]). */
const words = (...values: string[]) =>
  values
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9+#.]+/))
    .map((word) => word.replace(/^\.+|\.+$/g, ""))
    .filter((word) => word.length > 1);

const uniq = (values: string[]) => [...new Set(values)];

const clip = (text: string) =>
  text.length <= MAX_CHUNK_CHARS ? text : `${text.slice(0, MAX_CHUNK_CHARS).trimEnd()} …`;

const lines = (...values: (string | false | undefined | null)[]) => values.filter(Boolean).join("\n");

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export function buildChunks(): { chunks: KnowledgeChunk[]; stopWords: string[] } {
  const profile = getProfile();
  const projects = getProjects();
  const resume = buildResume();
  const chunks: KnowledgeChunk[] = [];
  const add = (chunk: KnowledgeChunk) => chunks.push({ ...chunk, text: clip(chunk.text.trim()), tags: uniq(chunk.tags) });

  // ── Profile ──
  add({
    id: "profile:about",
    type: "profile",
    title: `About ${profile.name}`,
    url: "/#about",
    tags: ["about", "bio", "background", "summary", "introduction", "profile", ...words(...profile.roles)],
    text: lines(
      `${profile.name} — ${profile.title}.`,
      `Roles: ${profile.roles.join(", ")}.`,
      profile.headline,
      profile.summary.join(" "),
      profile.heroIntro,
      profile.recruiterNote && `For recruiters: ${profile.recruiterNote}`,
      profile.quote && `In his words: "${profile.quote}"`
    )
  });

  add({
    id: "profile:contact",
    type: "profile",
    title: `Contact ${profile.firstName} & availability`,
    url: "/#contact",
    tags: ["contact", "email", "reach", "hire", "hiring", "availability", "available", "open", "location", "based", "linkedin", "github", "phone", "work", "roles", "opportunities"],
    text: lines(
      `Email: ${profile.email}`,
      profile.phone && `Phone: ${profile.phone}`,
      `Location: ${profile.location}`,
      `LinkedIn: ${profile.socials.linkedin}`,
      `GitHub: ${profile.socials.github}`,
      profile.socials.twitter && `X (Twitter): ${profile.socials.twitter}`,
      profile.recruiterNote && `Availability: ${profile.recruiterNote}`,
      `The contact form is on the home page (/#contact).`
    )
  });

  if (profile.stats.length) {
    add({
      id: "profile:stats",
      type: "profile",
      title: "Experience at a glance",
      url: "/#about",
      tags: ["stats", "years", "experience", "how many", "count", "numbers"],
      text: profile.stats.map((stat) => `${stat.label}: ${stat.value}`).join("\n")
    });
  }

  if (profile.interests.length) {
    add({
      id: "profile:interests",
      type: "profile",
      title: "What he enjoys working on",
      url: "/#about",
      tags: ["interests", "enjoy", "love", "passion", "hobbies"],
      text: profile.interests.map((item) => `- ${item.text}`).join("\n")
    });
  }

  if (profile.education.length) {
    add({
      id: "profile:education",
      type: "education",
      title: "Education",
      url: "/#about",
      tags: ["education", "degree", "study", "studied", "university", "college", "qualification", "diploma", "graduate"],
      text: profile.education
        .map((item) => [item.degree, item.detail, item.institution && `(${item.institution})`, item.year].filter(Boolean).join(" "))
        .join("\n")
    });
  }

  // ── Skills: one chunk per group ──
  for (const group of profile.skills) {
    add({
      id: `skills:${slugify(group.category)}`,
      type: "skills",
      title: `${group.category} skills`,
      url: "/#skills",
      tags: ["skills", "tech", "technologies", "expertise", "know", ...words(group.category), ...group.items.flatMap((item) => words(item.name))],
      text: `${group.category}: ${group.items.map((item) => (item.level ? `${item.name} (${item.level}%)` : item.name)).join(", ")}`
    });
  }

  // ── Experience: one chunk per entry ──
  profile.experience.forEach((item, index) => {
    add({
      id: `experience:${index + 1}-${slugify(item.company)}`,
      type: "experience",
      title: `${item.role} at ${item.company}`,
      url: "/#about",
      tags: ["experience", "work", "job", "role", "worked", "employment", "internship", ...words(item.company, item.role)],
      text: lines(
        `${item.role} at ${item.company}${item.location ? `, ${item.location}` : ""} (${item.start} – ${item.end}).`,
        item.summary,
        ...item.highlights.map((highlight) => `- ${highlight}`)
      )
    });
  });

  if (profile.certifications.length) {
    add({
      id: "profile:certifications",
      type: "certifications",
      title: "Certifications",
      url: RESUME_PAGE_PATH,
      tags: ["certifications", "certificates", "certified", "courses", "credentials"],
      text: profile.certifications.map((cert) => `- ${cert.name}, ${cert.issuer}${cert.year ? ` (${cert.year})` : ""}`).join("\n")
    });
  }

  // ── Resume ──
  add({
    id: "resume",
    type: "resume",
    title: "Resume / CV",
    url: RESUME_PAGE_PATH,
    tags: ["resume", "cv", "pdf", "download", "curriculum", "vitae", "json"],
    text: lines(
      `${profile.firstName}'s resume is generated from this portfolio and always up to date.`,
      `PDF: ${RESUME_PATH} · Web version: ${RESUME_PAGE_PATH} · JSON Resume: ${RESUME_JSON_PATH}`,
      `Sections: ${["Summary", resume.experience.length && "Experience", "Projects", "Skills", "Education", resume.certifications.length && "Certifications"].filter(Boolean).join(", ")}.`,
      `Projects on the resume: ${resume.projects.map((project) => project.title).join(", ")}.`
    )
  });

  // ── Projects: an overview chunk plus one per written case-study section ──
  for (const project of projects) {
    const base = `/projects/${project.slug}`;
    const projectTags = ["project", "built", "portfolio", ...words(project.title, project.category), ...project.stack.flatMap((item) => words(item)), ...project.topics];

    add({
      id: `project:${project.slug}:overview`,
      type: "project",
      projectSlug: project.slug,
      title: project.title,
      url: base,
      tags: projectTags,
      text: lines(
        `${project.title}${project.category ? ` (${project.category})` : ""}${project.featured ? ", a featured project" : ""}.`,
        project.tagline,
        project.resumeBullet && `Impact: ${project.resumeBullet}`,
        project.stack.length > 0 && `Tech stack: ${project.stack.join(", ")}.`,
        project.languages.length > 0 && `Languages: ${project.languages.map((language) => `${language.name} ${language.percent}%`).join(", ")}.`,
        project.source === "github" && `GitHub stars: ${project.stars}.`,
        project.pushedAt && `Last updated: ${formatDate(project.pushedAt)}.`,
        project.liveUrl && `Live demo: ${project.liveUrl}`,
        project.repoUrl && `Source code: ${project.repoUrl}`,
        `Case study: ${base}`
      )
    });

    for (const key of SECTION_KEYS) {
      const body = project.sections[key].trim();
      if (!body) continue;
      add({
        id: `project:${project.slug}:${key}`,
        type: "project",
        projectSlug: project.slug,
        title: `${project.title} — ${SECTION_TITLES[key]}`,
        url: `${base}#${key}`,
        tags: [...projectTags, key],
        text: body
      });
    }
  }

  // ── Build log: one chunk per weekly post (answers "what has he been working on?") ──
  for (const post of getBuildLogPosts()) {
    add({
      id: `log:${post.slug}`,
      type: "log",
      title: `Build log: ${post.title}`,
      url: `/log/${post.slug}`,
      tags: ["log", "build", "working", "recent", "recently", "lately", "latest", "update", "progress", "week", "commits", ...post.repos.flatMap((repo) => words(repo))],
      text: lines(
        `Week of ${post.weekStart} to ${post.weekEnd}: ${post.commitCount} commits across ${post.repos.join(", ")}.`,
        plainText(post.body)
      )
    });
  }

  // The owner's name appears in nearly every chunk, so it carries no signal.
  const stopWords = uniq(words(profile.name, profile.firstName, profile.lastName));
  return { chunks, stopWords };
}

export function buildKnowledgeFile(): KnowledgeIndexFile {
  const { chunks, stopWords } = buildChunks();
  return { version: 1, stopWords, chunks, index: JSON.stringify(createIndex(chunks, stopWords)) };
}

/** Writes data/knowledge-index.json (only if it changed) and returns a short summary. */
export async function writeKnowledgeIndex(): Promise<{ changed: boolean; chunks: number; bytes: number; byType: Record<string, number> }> {
  const file = buildKnowledgeFile();
  const json = `${JSON.stringify(file, null, 2)}\n`;
  const previous = await readFile(KNOWLEDGE_INDEX_PATH, "utf8").catch(() => "");
  const changed = json !== previous.replace(/\r\n/g, "\n");

  if (changed) {
    await mkdir(path.dirname(KNOWLEDGE_INDEX_PATH), { recursive: true });
    await writeFile(KNOWLEDGE_INDEX_PATH, json, "utf8");
  }

  const byType: Record<string, number> = {};
  for (const chunk of file.chunks) byType[chunk.type] = (byType[chunk.type] ?? 0) + 1;
  return { changed, chunks: file.chunks.length, bytes: Buffer.byteLength(json), byType };
}
