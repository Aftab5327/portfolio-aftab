import { z } from "zod";

/**
 * Shared zod schemas for content/profile.json, content/manual-projects.json and
 * the generated data/projects.json. Used by lib/data.ts (build time) and
 * scripts/sync-projects.ts (sync time), so both validate the same shape.
 *
 * Kept free of Node/Next imports so the sync script can import it directly.
 */

const nonEmpty = z.string().trim().min(1);
/** "" (not set) or an absolute http(s) URL. */
const optionalUrl = z.union([z.literal(""), z.string().url().regex(/^https?:\/\//, "must start with http(s)://")]);
/** "" (no image), a site-relative path ("/projects/x.png") or an absolute http(s) URL. */
const imageRef = z.union([z.literal(""), z.string().regex(/^\//, "must start with /"), z.string().url().regex(/^https?:\/\//)]);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase-kebab-case");

// ── Profile ──────────────────────────────────────────────────────────────────

const educationSchema = z
  .object({
    degree: nonEmpty,
    detail: z.string(),
    institution: z.string(),
    /** Compact label used for the chips under the About heading. */
    short: nonEmpty,
    /** Graduation year or range shown on the resume, e.g. "2023" or "2019 – 2023". */
    year: z.string().optional(),
    /** e.g. "GPA 8.56/10 (First Class with Distinction)" (JSON Resume `score`). */
    grade: z.string().optional(),
    /** Main subjects/tools covered (JSON Resume `courses`). */
    courses: z.array(nonEmpty).optional()
  })
  .strict();

/**
 * Resume settings. "View my CV"/"Download resume" links point at the uploaded PDF in public/ when
 * `source` is "uploaded"; the generated /resume.pdf and /resume page are built from the profile either way.
 */
const resumeSettingsSchema = z
  .object({
    source: z.enum(["uploaded", "generated"]).default("generated"),
    /** Site path of the uploaded PDF in public/, required when source is "uploaded". */
    uploadedPath: z
      .string()
      .regex(/^\/[A-Za-z0-9._-]+\.pdf$/, "must be a /file.pdf path in public/")
      .optional(),
    /** Print the phone number on the PDF/JSON resume. */
    showPhone: z.boolean().default(false),
    /** How many projects (featured first) the resume lists. */
    projectLimit: z.number().int().min(1).max(8).default(4),
    /** Extra resume sections, e.g. { "title": "Achievements", "items": ["..."] }. */
    extraSections: z.array(z.object({ title: nonEmpty, items: z.array(nonEmpty).min(1) }).strict()).default([])
  })
  .strict()
  .refine((settings) => settings.source !== "uploaded" || Boolean(settings.uploadedPath), {
    message: 'resume.uploadedPath is required when resume.source is "uploaded"',
    path: ["uploadedPath"]
  })
  .default({});

const experienceSchema = z
  .object({
    role: nonEmpty,
    company: nonEmpty,
    location: z.string(),
    start: nonEmpty,
    /** e.g. "Present" */
    end: nonEmpty,
    summary: z.string(),
    highlights: z.array(nonEmpty)
  })
  .strict();

const certificationSchema = z
  .object({
    name: nonEmpty,
    issuer: nonEmpty,
    year: z.string(),
    url: optionalUrl,
    /** "in-progress" is shown as "In progress" instead of a date. */
    status: z.enum(["earned", "in-progress"]).default("earned")
  })
  .strict();

const skillGroupSchema = z
  .object({
    category: nonEmpty,
    glyph: z.string(),
    items: z
      .array(
        z
          .object({
            name: nonEmpty,
            /** Optional 0–100 proficiency, shown as a bar when present. */
            level: z.number().int().min(0).max(100).optional()
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const profileSchema = z
  .object({
    name: nonEmpty,
    firstName: nonEmpty,
    lastName: nonEmpty,
    /** Primary job title, used in the hero heading. */
    title: nonEmpty,
    /** Rotating titles for the hero typewriter. */
    roles: z.array(nonEmpty).min(1),
    headline: nonEmpty,
    summary: z.array(nonEmpty).min(1),
    heroIntro: nonEmpty,
    recruiterNote: z.string(),
    quote: z.string(),
    location: nonEmpty,
    email: z.string().email(),
    phone: z.string(),
    avatar: z.string().regex(/^\/|^https?:\/\//, "must be a /path or http(s) URL"),
    resume: resumeSettingsSchema,
    githubUsername: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/, "invalid GitHub username"),
    socials: z
      .object({
        github: z.string().url(),
        linkedin: z.string().url(),
        twitter: optionalUrl
      })
      .strict(),
    seo: z
      .object({
        description: nonEmpty.max(300),
        keywords: z.array(nonEmpty)
      })
      .strict(),
    stats: z.array(z.object({ value: nonEmpty, label: nonEmpty }).strict()),
    interests: z.array(z.object({ icon: z.string(), text: nonEmpty }).strict()),
    education: z.array(educationSchema),
    experience: z.array(experienceSchema),
    skills: z.array(skillGroupSchema).min(1),
    certifications: z.array(certificationSchema)
  })
  .strict();

// ── Projects ─────────────────────────────────────────────────────────────────

export const SECTION_KEYS = ["problem", "solution", "result", "features", "challenges", "architecture"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Markdown bodies of the case-study sections. "" = section not written yet. */
const sectionsSchema = z
  .object({
    problem: z.string(),
    solution: z.string(),
    result: z.string(),
    features: z.string(),
    challenges: z.string(),
    architecture: z.string()
  })
  .strict();

/** Fields shared by hand-written (manual) and synced projects. */
const projectContentShape = {
  slug,
  title: nonEmpty,
  tagline: z.string(),
  category: z.string(),
  stack: z.array(nonEmpty),
  featured: z.boolean(),
  /** Lower comes first among projects with the same `featured` value. null = unordered. */
  order: z.number().nullable(),
  sections: sectionsSchema,
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  image: imageRef
};

export const manualProjectSchema = z
  .object({
    ...projectContentShape,
    /** Capture a screenshot of liveUrl even if `image` is set (the screenshot then wins). */
    autoScreenshot: z.boolean().optional(),
    /** One short impact line shown under the project on the resume. */
    resumeBullet: z.string().optional()
  })
  .strict();

/**
 * Where a project's case-study content came from, highest priority first:
 * the repo's PORTFOLIO.md, an approved content/case-studies/<slug>.md,
 * the content/manual-projects.json entry, or bare repo metadata.
 */
export const CASE_STUDY_SOURCES = ["portfolio-md", "case-study", "manual", "metadata"] as const;
export type CaseStudySource = (typeof CASE_STUDY_SOURCES)[number];

export const projectSchema = z
  .object({
    ...projectContentShape,
    autoScreenshot: z.boolean(),
    /** One short impact line for the resume ("" = none). */
    resumeBullet: z.string(),
    caseStudySource: z.enum(CASE_STUDY_SOURCES),
    stars: z.number().int().nonnegative(),
    /** Primary language reported by GitHub. */
    language: z.string(),
    /** Language breakdown by bytes, largest first. */
    languages: z.array(z.object({ name: nonEmpty, percent: z.number().min(0).max(100) }).strict()),
    topics: z.array(z.string()),
    /** ISO timestamp of the last push, "" for manual entries. */
    pushedAt: z.string(),
    source: z.enum(["github", "manual"])
  })
  .strict();

function uniqueSlugs<T extends { slug: string }>(projects: T[], ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  projects.forEach((project, index) => {
    if (seen.has(project.slug)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projects", index, "slug"], message: `duplicate slug "${project.slug}"` });
    }
    seen.add(project.slug);
  });
}

export const manualProjectsFileSchema = z
  .object({ $comment: z.string().optional(), projects: z.array(manualProjectSchema) })
  .strict()
  .superRefine((file, ctx) => uniqueSlugs(file.projects, ctx));

export const projectsFileSchema = z
  .object({ $comment: z.string().optional(), projects: z.array(projectSchema) })
  .strict()
  .superRefine((file, ctx) => uniqueSlugs(file.projects, ctx));

/** Frontmatter of a PORTFOLIO.md file. Everything is optional; unknown keys are reported as warnings. */
export const portfolioFrontmatterSchema = z.object({
  title: nonEmpty.optional(),
  tagline: z.string().optional(),
  category: z.string().optional(),
  stack: z.array(z.coerce.string()).optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  liveUrl: optionalUrl.optional(),
  image: z.string().optional(),
  autoScreenshot: z.boolean().optional(),
  resumeBullet: z.string().optional()
});

/** data/screenshots.json, written by scripts/screenshot-projects.ts. Keyed by project slug. */
export const screenshotEntrySchema = z
  .object({
    /** Site path of the WebP ("/projects/auto/<slug>.webp"), "" if never captured. */
    path: z.union([z.literal(""), z.string().regex(/^\/projects\/auto\/[a-z0-9-]+\.webp$/)]),
    /** ISO time the stored image was captured, "" if never captured. */
    capturedAt: z.string(),
    status: z.enum(["ok", "failed"]),
    /** Last failure message, when status is "failed". */
    error: z.string().optional()
  })
  .strict();

export const screenshotsFileSchema = z.record(slug, screenshotEntrySchema);

export type ScreenshotEntry = z.infer<typeof screenshotEntrySchema>;

/** data/github-stats.json, written by scripts/github-stats.ts during the portfolio sync. */
export const githubStatsSchema = z
  .object({
    username: nonEmpty,
    calendar: z
      .object({
        from: z.string(),
        to: z.string(),
        total: z.number().int().nonnegative(),
        /** Weeks (Sunday first), each with up to 7 days. */
        weeks: z.array(z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() }).strict()))
      })
      .strict(),
    /** "2026-10" */
    month: z.string().regex(/^\d{4}-\d{2}$/),
    commitsThisMonth: z.number().int().nonnegative(),
    publicRepos: z.number().int().nonnegative(),
    /** Stars across non-fork public repos. */
    stars: z.number().int().nonnegative(),
    /** Top languages by bytes across non-fork public repos, largest first. */
    languages: z.array(
      z.object({ name: nonEmpty, color: z.string(), bytes: z.number().int().nonnegative(), percent: z.number().min(0).max(100) }).strict()
    )
  })
  .strict();

export const githubStatsFileSchema = z
  .object({ $comment: z.string().optional(), stats: githubStatsSchema.nullable() })
  .strict();

export type GitHubStats = z.infer<typeof githubStatsSchema>;

export const FRONTMATTER_KEYS = Object.keys(portfolioFrontmatterSchema.shape);

export type Profile = z.infer<typeof profileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ManualProject = z.infer<typeof manualProjectSchema>;
export type ProjectSections = z.infer<typeof sectionsSchema>;
export type PortfolioFrontmatter = z.infer<typeof portfolioFrontmatterSchema>;

/** Readable multi-line error for build logs and the sync script. */
export function formatZodError(error: z.ZodError, file: string): string {
  const lines = error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  return `Invalid data in ${file}:\n${lines.join("\n")}`;
}
