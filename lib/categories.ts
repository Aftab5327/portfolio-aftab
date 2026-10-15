/**
 * One colour per kind of technology, borrowed from an editor's syntax theme, so the same
 * category reads the same everywhere: project categories and stack tags, skill chips,
 * case studies, /stats languages and the command palette.
 *
 *   keyword  -> AI / ML               string   -> frontend & web
 *   function -> backend & APIs        number   -> IoT, embedded & hardware
 *   type     -> data & analytics      operator -> tooling, DevOps & cloud (the accent)
 */
export type SyntaxRole = "keyword" | "string" | "function" | "number" | "type" | "operator";

// First match wins, so the more specific families come first.
const RULES: [SyntaxRole, RegExp][] = [
  ["keyword", /\b(ai|ml|llm|tensorflow|opencv|cnn|machine learning|assistive)\b/i],
  ["number", /\b(iot|embedded|arduino|esp\d*|mqtt|sensors?|hardware|c\+\+|c)\b/i],
  ["operator", /\b(devops|tools|git(hub)?|docker|linux|postman|vercel|vs code|cloud|deploy\w*)\b/i],
  ["type", /\b(data\w*|mongodb|mysql|sql|supabase|analytics|algorithms?|simulation|json|csv|jupyter|dashboards?)\b/i],
  ["function", /\b(backend|node(\.js)?|express(\.js)?|apis?|rest|python|java|server|auth\w*)\b/i],
  ["string", /\b(frontend|react(\.js)?|next(\.js)?|javascript|typescript|html5?|css3?|tailwind|redux|full stack|web|mern|saas)\b/i]
];

export function syntaxRole(label: string): SyntaxRole {
  for (const [role, pattern] of RULES) if (pattern.test(label)) return role;
  return "operator";
}

/** "IoT · Full Stack" -> [{ text: "IoT", role: "number" }, { text: "Full Stack", role: "string" }] */
export function categorySegments(category: string): { text: string; role: SyntaxRole }[] {
  return category
    .split(/\s*·\s*/)
    .filter(Boolean)
    .map((text) => ({ text, role: syntaxRole(text) }));
}

/** CSS colour for SVG fills and inline styles (e.g. language bars). */
export const roleColor = (role: SyntaxRole) => (role === "operator" ? "var(--teal)" : `var(--syn-${role})`);
