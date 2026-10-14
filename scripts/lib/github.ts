/** Minimal GitHub REST client shared by the sync and draft scripts. */

export type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string | null;
  fork: boolean;
  archived: boolean;
  default_branch: string;
};

export const PORTFOLIO_TOPIC = "portfolio";
export const PORTFOLIO_FILE = "PORTFOLIO.md";

const token = process.env.GITHUB_TOKEN?.trim();
let rateLimitRemaining = "?";

export const isAuthenticated = () => Boolean(token);
export const getRateLimitRemaining = () => rateLimitRemaining;

export const encodePath = (filePath: string) => filePath.split("/").map(encodeURIComponent).join("/");

export async function github(pathname: string, accept = "application/vnd.github+json"): Promise<Response> {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-sync",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  rateLimitRemaining = response.headers.get("x-ratelimit-remaining") ?? rateLimitRemaining;

  if ((response.status === 403 || response.status === 429) && response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset")) * 1000;
    const when = Number.isFinite(reset) ? new Date(reset).toISOString() : "later";
    throw new Error(`GitHub API rate limit exceeded (resets ${when}). Set GITHUB_TOKEN to raise the limit.`);
  }

  return response;
}

export async function githubJson<T>(pathname: string): Promise<T> {
  const response = await github(pathname);
  if (!response.ok) {
    const body = (await response.text()).slice(0, 200);
    throw new Error(`GET ${pathname} failed: ${response.status} ${body}`);
  }
  return (await response.json()) as T;
}

export async function listPublicRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await githubJson<GitHubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`
    );
    repos.push(...batch);
    if (batch.length < 100) return repos;
  }
}

/** Public, non-fork, non-archived repos carrying the `portfolio` topic. */
export const isPortfolioRepo = (repo: GitHubRepo) =>
  !repo.fork && !repo.archived && Boolean(repo.topics?.includes(PORTFOLIO_TOPIC));

/** Raw file from the default branch, or null if it doesn't exist. */
export async function fetchRepoFile(repo: GitHubRepo, filePath: string): Promise<Response | null> {
  const response = await github(
    `/repos/${repo.full_name}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(repo.default_branch)}`,
    "application/vnd.github.raw"
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`fetching ${filePath} failed: ${response.status}`);
  return response;
}

export async function fetchRepoText(repo: GitHubRepo, filePath: string): Promise<string | null> {
  const response = await fetchRepoFile(repo, filePath);
  return response ? response.text() : null;
}

export type LanguageShare = { name: string; percent: number };

export async function fetchLanguages(repo: GitHubRepo): Promise<LanguageShare[]> {
  const bytes = await githubJson<Record<string, number>>(`/repos/${repo.full_name}/languages`);
  const total = Object.values(bytes).reduce((sum, value) => sum + value, 0);
  if (total === 0) return [];

  return Object.entries(bytes)
    .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB))
    .map(([name, value]) => ({ name, percent: Math.round((value / total) * 1000) / 10 }))
    .filter((language) => language.percent >= 0.1);
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const humanize = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
