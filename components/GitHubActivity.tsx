import { FiGitBranch, FiStar } from "react-icons/fi";
import { site } from "@/lib/site";

type Repo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  fork: boolean;
};

// A few common GitHub linguist colours; anything else falls back to teal.
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  C: "#555555",
  Java: "#b07219",
  "Jupyter Notebook": "#da5b0b"
};

async function getRecentRepos(): Promise<Repo[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const response = await fetch(
      `https://api.github.com/users/${site.githubUsername}/repos?sort=updated&per_page=30&type=owner`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return (data as Repo[]).filter((repo) => !repo.fork).slice(0, 6);
  } catch {
    return [];
  }
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function GitHubActivity() {
  const repos = await getRecentRepos();
  if (repos.length === 0) return null;

  return (
    <div id="github" className="scroll-mt-24">
      <section className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-teal">{"// github"}</p>
            <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Recent Repositories</h2>
          </div>
          <a
            href={site.socials.github}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-sm text-txtdim transition-colors hover:text-teal"
          >
            @{site.githubUsername} ↗
          </a>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <li key={repo.id}>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col rounded-xl border border-line bg-panel2 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-teal/60"
              >
                <span className="flex items-center gap-2 font-mono text-sm font-semibold text-txt">
                  <FiGitBranch aria-hidden className="shrink-0 text-teal" />
                  <span className="truncate">{repo.name}</span>
                </span>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-txtdim">
                  {repo.description || "No description provided."}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-5 font-mono text-[11px] text-txtdim">
                  {repo.language ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: LANGUAGE_COLORS[repo.language] ?? "var(--teal)" }}
                      />
                      {repo.language}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1" aria-label={`${repo.stargazers_count} stars`}>
                    <FiStar aria-hidden />
                    {repo.stargazers_count}
                  </span>
                  <span>
                    Updated <time dateTime={repo.updated_at}>{dateFormat.format(new Date(repo.updated_at))}</time>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
