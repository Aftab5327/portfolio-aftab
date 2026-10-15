/** Site-level settings that aren't profile content. Safe to import from client components. */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Generated resume routes (see app/resume.pdf, app/resume, app/resume.json). */
export const RESUME_PATH = "/resume.pdf";
export const RESUME_PAGE_PATH = "/resume";
export const RESUME_JSON_PATH = "/resume.json";

/** Page rendering docs/ai-assistant.md ("How this assistant works"). */
export const AI_DOCS_PATH = "/ai-assistant";
/** Page rendering docs/automation.md ("How this works" on /stats). */
export const AUTOMATION_DOCS_PATH = "/automation";
export const STATS_PATH = "/stats";
export const LOG_PATH = "/log";

/** This site's own GitHub repo name (under profile.githubUsername); included in the weekly build log. */
export const SOURCE_REPO_NAME = "portfolio-aftab";

/** Set at build time (next.config.mjs). */
export const BUILD_TIME = process.env.BUILD_TIME ?? "";

/** Groq model used by the chat assistant and the case-study draft script. */
export const GROQ_MODEL = "llama-3.1-8b-instant";

/** Home-page sections, in page order. Used by the navbar and command palette. */
export const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "ai-chat", label: "AI Chat" },
  { id: "contact", label: "Contact" }
];
