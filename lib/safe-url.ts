/**
 * URL allow-list for every link or image that comes from stored or generated content
 * (build-log frontmatter, projects.json / PORTFOLIO.md, AI-drafted case studies, chat
 * citations and tool actions). Anything that isn't explicitly allowed is dropped (null),
 * never "cleaned": `javascript:`, `data:`, `vbscript:`, protocol-relative `//host`,
 * `/\host`, http:, credentials in the URL, control characters and whitespace tricks.
 *
 * Allowed by default:
 *  - same-site relative paths: "/projects/x", "/#about" (exactly one leading slash)
 *  - https:// URLs whose host is on the allow-list (github.com by default)
 */

/** Commit, repo and profile links. */
export const GITHUB_HOSTS = ["github.com"] as const;
/** Images hosted by GitHub (README/PORTFOLIO.md attachments, raw files). */
export const GITHUB_IMAGE_HOSTS = [
  "github.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com"
] as const;

export type UrlPolicy = {
  /** https hosts that are allowed (exact match, lower-case). Default: github.com. "any" = any https host. */
  hosts?: readonly string[] | "any";
  /** Allow same-site relative paths. Default: true. */
  relative?: boolean;
  /** Allow exactly `mailto:<this address>` (the site owner's address from config). */
  mailto?: string;
};

// C0/C1 controls, space, DEL and any other whitespace incl. line/paragraph separators (\s covers them);
// browsers strip tabs/newlines inside schemes, e.g. "java\tscript:".
const UNSAFE_CHARS = /[\x00-\x20\x7f-\x9f\s]/;
const MAX_LENGTH = 2048;

function safeRelative(value: string): string | null {
  // "/x" only: "//host" and "/\host" are protocol-relative in browsers.
  if (!/^\/(?![/\\])/.test(value) || value.includes("\\")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null; // malformed percent-encoding
  }
  // Encoded variants ("/%2F%2Fevil.com", "/%5Cevil.com") must not turn into "//host" either.
  if (/^\/[/\\]/.test(decoded) || decoded.includes("\\") || UNSAFE_CHARS.test(decoded)) return null;
  return value;
}

/** Returns the URL if it is allowed by the policy, otherwise null. */
export function safeUrl(input: unknown, policy: UrlPolicy = {}): string | null {
  if (typeof input !== "string") return null;
  const value = input;
  if (!value || value.length > MAX_LENGTH || UNSAFE_CHARS.test(value)) return null;

  if (value.startsWith("/")) return policy.relative === false ? null : safeRelative(value);

  if (policy.mailto && value === `mailto:${policy.mailto}` && /^[^\s@/?#:]+@[^\s@/?#:]+\.[a-z]{2,}$/i.test(policy.mailto)) {
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null; // not absolute and not "/...": e.g. "%6Aavascript:", "evil.com", "&#106;avascript:"
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const hosts = policy.hosts ?? GITHUB_HOSTS;
  if (hosts !== "any" && !hosts.includes(url.hostname)) return null;
  return url.href;
}

/** Image sources: same-site paths or GitHub-hosted images. */
export const safeImageSrc = (input: unknown) => safeUrl(input, { hosts: GITHUB_IMAGE_HOSTS });

/**
 * Project live-demo links: demos live on vercel.app and other hosts, so any https:// host is allowed.
 * Every other rule still applies (no credentials or ports, no control characters, no javascript:/data:/http:),
 * and a demo is always absolute, so relative paths are not accepted.
 */
export const safeLiveUrl = (input: unknown) => safeUrl(input, { hosts: "any", relative: false });

/** Relative, same-site links only (chat citations, internal navigation). */
export const safeInternalHref = (input: unknown) => safeUrl(input, { hosts: [] });

/**
 * Links and images inside rendered Markdown (case studies, build-log posts, docs): same-site
 * paths, in-page "#fragments" and https:// on any host. Everything else is dropped.
 */
export function safeMarkdownUrl(input: unknown): string {
  if (typeof input === "string" && /^#[\w-]{1,100}$/.test(input)) return input;
  return safeUrl(input, { hosts: "any" }) ?? "";
}

/**
 * Chat action chips: same-site paths, GitHub, the owner's LinkedIn, and mailto: for a plain address.
 * (The "contact" tool offers LinkedIn and email, so those two are allowed here and nowhere else.)
 */
export const ACTION_HOSTS = [...GITHUB_HOSTS, "linkedin.com", "www.linkedin.com"] as const;
export function safeActionHref(input: unknown, ownerEmail?: string): string | null {
  const mailto = typeof input === "string" && input.startsWith("mailto:") ? (ownerEmail ?? input.slice("mailto:".length)) : undefined;
  return safeUrl(input, { hosts: ACTION_HOSTS, mailto });
}

/** Builds "/<prefix>/<segment>" with the segment URL-encoded, so stored slugs can't change the path. */
export const internalPath = (prefix: string, segment: string) => `/${prefix}/${encodeURIComponent(segment)}`;
