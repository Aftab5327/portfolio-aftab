/**
 * The single entry point for site content. Server components (and API routes)
 * import from here; client components receive the data they need as props, so
 * zod and the JSON files never ship to the browser.
 *
 * Data is validated on first use. During `next build` every page calls these
 * functions while prerendering, so invalid JSON fails the build with a readable
 * error instead of shipping a broken page.
 */
import profileJson from "@/content/profile.json";
import projectsJson from "@/data/projects.json";
import screenshotsJson from "@/data/screenshots.json";
import githubStatsJson from "@/data/github-stats.json";
import {
  formatZodError,
  githubStatsFileSchema,
  profileSchema,
  type GitHubStats,
  projectsFileSchema,
  screenshotsFileSchema,
  type Profile,
  type Project
} from "@/lib/schema";
import { primaryResume, type ResumeFile } from "@/lib/resume-file";

/** A project with its display image resolved (see resolveImage). */
export type ResolvedProject = Project & {
  /** Image to show; "" means render the generated placeholder card. */
  displayImage: string;
  imageSource: "explicit" | "auto" | "placeholder";
  /** ISO time the auto screenshot was captured (only when imageSource is "auto"). */
  screenshotCapturedAt: string;
};

let profileCache: Profile | undefined;
let projectsCache: ResolvedProject[] | undefined;

export function getProfile(): Profile {
  if (!profileCache) {
    const result = profileSchema.safeParse(profileJson);
    if (!result.success) throw new Error(formatZodError(result.error, "content/profile.json"));
    profileCache = result.data;
  }
  return profileCache;
}

/** The PDF that "View my CV" / "Download resume" links open (see lib/resume-file.ts). */
export function getPrimaryResume(): ResumeFile {
  const profile = getProfile();
  return primaryResume(profile.resume, profile.firstName);
}

/**
 * Explicit image wins, then the auto screenshot, then the placeholder card.
 * `autoScreenshot: true` in the project's frontmatter prefers the screenshot.
 */
function resolveImage(project: Project, screenshots: ReturnType<typeof screenshotsFileSchema.parse>) {
  const shot = screenshots[project.slug];
  const auto = shot?.path ? { displayImage: shot.path, imageSource: "auto" as const, screenshotCapturedAt: shot.capturedAt } : null;
  const explicit = project.image
    ? { displayImage: project.image, imageSource: "explicit" as const, screenshotCapturedAt: "" }
    : null;

  return (project.autoScreenshot ? auto ?? explicit : explicit ?? auto) ?? {
    displayImage: "",
    imageSource: "placeholder" as const,
    screenshotCapturedAt: ""
  };
}

/** Already sorted by the sync script: featured, then order, then most recently pushed. */
export function getProjects(): ResolvedProject[] {
  if (!projectsCache) {
    const projects = projectsFileSchema.safeParse(projectsJson);
    if (!projects.success) {
      throw new Error(`${formatZodError(projects.error, "data/projects.json")}\nRe-run \`npm run sync\` to regenerate it.`);
    }
    const screenshots = screenshotsFileSchema.safeParse(screenshotsJson);
    if (!screenshots.success) {
      throw new Error(`${formatZodError(screenshots.error, "data/screenshots.json")}\nRe-run \`npm run screenshots\` to regenerate it.`);
    }

    projectsCache = projects.data.projects.map((project) => ({ ...project, ...resolveImage(project, screenshots.data) }));
  }
  return projectsCache;
}

export function getProject(slug: string): ResolvedProject | undefined {
  return getProjects().find((project) => project.slug === slug);
}

/** Committed GitHub stats (data/github-stats.json), or null before the first sync. */
export function getGitHubStats(): GitHubStats | null {
  const result = githubStatsFileSchema.safeParse(githubStatsJson);
  if (!result.success) throw new Error(formatZodError(result.error, "data/github-stats.json"));
  return result.data.stats;
}
