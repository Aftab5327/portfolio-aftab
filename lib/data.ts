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
import { formatZodError, profileSchema, projectsFileSchema, type Profile, type Project } from "@/lib/schema";

let profileCache: Profile | undefined;
let projectsCache: Project[] | undefined;

export function getProfile(): Profile {
  if (!profileCache) {
    const result = profileSchema.safeParse(profileJson);
    if (!result.success) throw new Error(formatZodError(result.error, "content/profile.json"));
    profileCache = result.data;
  }
  return profileCache;
}

/** Already sorted by the sync script: featured, then order, then most recently pushed. */
export function getProjects(): Project[] {
  if (!projectsCache) {
    const result = projectsFileSchema.safeParse(projectsJson);
    if (!result.success) {
      throw new Error(`${formatZodError(result.error, "data/projects.json")}\nRe-run \`npm run sync\` to regenerate it.`);
    }
    projectsCache = result.data.projects;
  }
  return projectsCache;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((project) => project.slug === slug);
}
