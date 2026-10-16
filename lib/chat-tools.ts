/**
 * Tool actions the assistant can offer. The model *proposes* tool calls; every
 * call is validated here against real data (existing slugs, known sections,
 * fixed enums) before it reaches the browser as a clickable chip. Nothing
 * navigates without the visitor clicking.
 */

import { safeActionHref } from "./safe-url";

export type ChatAction = {
  type: "open_project" | "show_section" | "get_resume" | "contact";
  label: string;
  href: string;
  external: boolean;
};

export type ToolContext = {
  firstName: string;
  email: string;
  socials: { github: string; linkedin: string };
  projects: { slug: string; title: string }[];
  sections: { id: string; label: string }[];
  resume: { pdf: string; web: string };
};

export type RawToolCall = { name: string; arguments: string };

export const MAX_ACTIONS = 2;
const RESUME_FORMATS = ["pdf", "web"] as const;
const CONTACT_CHANNELS = ["email", "linkedin", "github"] as const;

/** OpenAI-compatible tool definitions (Groq). Enums list only values that exist. */
export function toolDefinitions(ctx: ToolContext) {
  const fn = (name: string, description: string, property: string, values: readonly string[], about: string) => ({
    type: "function" as const,
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties: { [property]: { type: "string", enum: [...values], description: about } },
        required: [property],
        additionalProperties: false
      }
    }
  });

  return [
    fn("open_project", "Offer a button that opens a project's case-study page.", "slug", ctx.projects.map((p) => p.slug), "Project slug"),
    fn("show_section", "Offer a button that scrolls to a section of the home page.", "id", ctx.sections.map((s) => s.id), "Section id"),
    fn("get_resume", `Offer a button to ${ctx.firstName}'s resume.`, "format", RESUME_FORMATS, '"pdf" to download, "web" to view'),
    fn("contact", `Offer a button to contact ${ctx.firstName}.`, "channel", CONTACT_CHANNELS, "Contact channel")
  ];
}

/** Parses tool-call arguments: must be a small JSON object with exactly the expected key. */
function singleArg(raw: string, key: string): string | null {
  if (typeof raw !== "string" || raw.length > 300) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const keys = Object.keys(parsed);
  const value = (parsed as Record<string, unknown>)[key];
  return keys.length === 1 && keys[0] === key && typeof value === "string" ? value : null;
}

/** Returns a safe action for a valid call, or null (invalid calls are dropped). */
export function validateToolCall(call: RawToolCall, ctx: ToolContext): ChatAction | null {
  switch (call?.name) {
    case "open_project": {
      const slug = singleArg(call.arguments, "slug");
      const project = ctx.projects.find((p) => p.slug === slug);
      return project ? { type: "open_project", label: `Open ${project.title}`, href: `/projects/${project.slug}`, external: false } : null;
    }
    case "show_section": {
      const id = singleArg(call.arguments, "id");
      const section = ctx.sections.find((s) => s.id === id);
      return section ? { type: "show_section", label: `Go to ${section.label}`, href: `/#${section.id}`, external: false } : null;
    }
    case "get_resume": {
      const format = singleArg(call.arguments, "format");
      if (format === "pdf") return { type: "get_resume", label: "Download resume (PDF)", href: ctx.resume.pdf, external: false };
      if (format === "web") return { type: "get_resume", label: "View resume", href: ctx.resume.web, external: false };
      return null;
    }
    case "contact": {
      const channel = singleArg(call.arguments, "channel");
      if (channel === "email") return { type: "contact", label: `Email ${ctx.firstName}`, href: `mailto:${ctx.email}`, external: true };
      if (channel === "linkedin") return { type: "contact", label: "LinkedIn", href: ctx.socials.linkedin, external: true };
      if (channel === "github") return { type: "contact", label: "GitHub", href: ctx.socials.github, external: true };
      return null;
    }
    default:
      return null;
  }
}

/** Validates, de-duplicates (by link) and caps the model's tool calls. */
export function collectActions(calls: RawToolCall[], ctx: ToolContext, max = MAX_ACTIONS): ChatAction[] {
  const actions: ChatAction[] = [];
  for (const call of calls) {
    const validated = validateToolCall(call, ctx);
    // Hrefs come from stored config (projects, profile socials), so they pass the URL allow-list too.
    const href = validated ? safeActionHref(validated.href, ctx.email) : null;
    const action = validated && href ? { ...validated, href } : null;
    if (action && !actions.some((existing) => existing.href === action.href)) actions.push(action);
    if (actions.length >= max) break;
  }
  return actions;
}
