import type { Metadata } from "next";
import Link from "next/link";
import ContributionHeatmap from "@/components/stats/ContributionHeatmap";
import ScoreRing from "@/components/stats/ScoreRing";
import Sparkline from "@/components/stats/Sparkline";
import knowledgeIndex from "@/data/knowledge-index.json";
import { getChatAnalytics } from "@/lib/analytics";
import { AUTOMATION_DOCS_PATH, BUILD_TIME, LOG_PATH } from "@/lib/config";
import { getGitHubStats, getProfile, getProjects } from "@/lib/data";
import { SCORE_KEYS, getLighthouseHistory, type ScoreKey } from "@/lib/lighthouse";
import { getLastSync } from "@/lib/pipeline";
import { isRedisConfigured } from "@/lib/redis";
import { getUptimeSummary } from "@/lib/uptime";

// Regenerated at most every 10 minutes; Redis reads are cached for the same window.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Engineering stats",
  description: "Live engineering dashboard: GitHub activity, uptime of deployed projects, Lighthouse scores, AI assistant usage and the automation pipeline.",
  alternates: { canonical: "/stats" }
};

const SCORE_LABELS: Record<ScoreKey, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  bestPractices: "Best practices",
  seo: "SEO"
};

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const formatTime = (iso: string) => `${dateTime.format(new Date(iso))} UTC`;
const number = new Intl.NumberFormat("en-GB");

function Card({ id, title, note, children, className = "" }: { id: string; title: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`rounded-2xl border border-line bg-panel2 p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-heading`} className="font-mono text-sm font-semibold text-teal">
          {`// ${title}`}
        </h2>
        {note ? <p className="font-mono text-[11px] text-txtdim">{note}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ value, label, compact = false }: { value: string | number; label: string; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className={compact ? "font-mono text-sm font-semibold leading-snug text-txt" : "font-display text-2xl font-bold leading-none text-txt"}>
        {value}
      </p>
      <p className="mt-2 font-mono text-[11px] text-txtdim">{label}</p>
    </div>
  );
}

/** Human labels for analytics topic ids ("project:infrasense-360" → "InfraSense 360"). */
function topicLabels(): Map<string, string> {
  const labels = new Map<string, string>();
  for (const project of getProjects()) labels.set(`project:${project.slug}`, project.title);
  for (const chunk of knowledgeIndex.chunks) if (!labels.has(chunk.id)) labels.set(chunk.id, chunk.title);
  return labels;
}

export default async function StatsPage() {
  const [uptime, lighthouse, chat, lastSync] = await Promise.all([getUptimeSummary(), getLighthouseHistory(), getChatAnalytics(7), getLastSync()]);
  const github = getGitHubStats();
  const projects = getProjects();
  const { firstName } = getProfile();
  const labels = topicLabels();
  const latest = lighthouse?.[0];
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  return (
    <div className="space-y-8">
      <header className="rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10 lg:px-14">
        <p className="font-mono text-sm text-teal">{"// stats"}</p>
        <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Engineering dashboard</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-txtdim">
          Live numbers from the systems behind this portfolio: {firstName}&apos;s GitHub activity, uptime of deployed projects,
          Lighthouse audits after every deploy, and how the AI assistant is used (topics only, never messages). Updated every 10
          minutes.{" "}
          <Link href={AUTOMATION_DOCS_PATH} className="text-teal underline-offset-2 hover:underline">
            How this works →
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {github ? (
          <Card id="github" title="github" note={`@${github.username}`} className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric value={number.format(github.calendar.total)} label="contributions, last 12 months" />
              <Metric value={number.format(github.commitsThisMonth)} label={`commits in ${github.month}`} />
              <Metric value={number.format(github.publicRepos)} label="public repositories" />
              <Metric value={number.format(github.stars)} label="stars on own repos" />
            </div>
            <div className="mt-6">
              <ContributionHeatmap calendar={github.calendar} />
            </div>
            {github.languages.length ? (
              <div className="mt-6">
                <h3 className="font-mono text-xs text-txtdim">Top languages (bytes across non-fork repos)</h3>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-bg2" aria-hidden>
                  {github.languages.map((language) => (
                    <span key={language.name} style={{ width: `${language.percent}%`, backgroundColor: language.color }} />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-txtdim">
                  {github.languages.map((language) => (
                    <li key={language.name} className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: language.color }} />
                      {language.name} {language.percent}%
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : null}

        {uptime ? (
          <Card id="uptime" title="uptime" note="checked every 30 min · last 7 days" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="font-mono text-[11px] text-txtdim">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-4 font-normal">Site</th>
                    <th scope="col" className="py-2 pr-4 font-normal">Status</th>
                    <th scope="col" className="py-2 pr-4 font-normal">7-day uptime</th>
                    <th scope="col" className="py-2 pr-4 font-normal">Avg latency</th>
                    <th scope="col" className="py-2 font-normal">Last checked</th>
                  </tr>
                </thead>
                <tbody>
                  {uptime.sites.map((site) => (
                    <tr key={site.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        {site.url ? (
                          <a href={site.url} target="_blank" rel="noreferrer" className="text-txt hover:text-teal">
                            {site.name}
                          </a>
                        ) : (
                          <span className="text-txt">{site.name}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center gap-2 font-mono text-xs ${site.up ? "text-green" : "text-danger"}`}>
                          <span aria-hidden className={`h-2 w-2 rounded-full ${site.up ? "bg-green" : "bg-danger"}`} />
                          {site.up ? "Up" : "Down"} ({site.lastStatus || site.lastError || "no response"})
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-txt">
                        {site.uptimePercent}% <span className="text-txtdim">of {site.samples} checks</span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-txt">{site.avgLatencyMs ? `${site.avgLatencyMs} ms` : "—"}</td>
                      <td className="py-2.5 font-mono text-xs text-txtdim">
                        <time dateTime={site.lastChecked}>{formatTime(site.lastChecked)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {latest ? (
          <Card id="lighthouse" title="lighthouse" note={`mobile · median of runs · ${formatTime(latest.t)}${latest.commit ? ` · ${latest.commit}` : ""}`}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {SCORE_KEYS.map((key) => (
                <ScoreRing key={key} score={latest.average[key]} label={SCORE_LABELS[key]} />
              ))}
            </div>
            {lighthouse && lighthouse.length > 1 ? (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Sparkline values={[...lighthouse].reverse().map((run) => run.average.performance)} label="Performance score over the last deploys" />
                <p className="font-mono text-[11px] text-txtdim">Performance over the last {lighthouse.length} deploys</p>
              </div>
            ) : null}
            <ul className="mt-5 space-y-1 font-mono text-[11px] text-txtdim">
              {latest.pages.map((page) => (
                <li key={page.path}>
                  <span className="text-txt">{page.path}</span> · {SCORE_KEYS.map((key) => `${SCORE_LABELS[key]} ${page.scores[key]}`).join(" · ")}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {chat ? (
          <Card id="assistant" title="ai assistant" note="last 7 days · topics only">
            <Metric value={number.format(chat.totalQuestions)} label="questions asked this week" />
            {chat.topTopics.length ? (
              <div className="mt-5">
                <h3 className="font-mono text-xs text-txtdim">Top topics</h3>
                <ol className="mt-3 space-y-2.5">
                  {chat.topTopics.map((topic) => {
                    const max = chat.topTopics[0].count;
                    return (
                      <li key={topic.topic} className="text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-txt">{labels.get(topic.topic) ?? topic.topic}</span>
                          <span className="font-mono text-xs text-txtdim">{topic.count}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg2" aria-hidden>
                          <div className="h-full rounded-full bg-teal" style={{ width: `${(topic.count / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <p className="mt-4 text-sm text-txtdim">No questions yet this week.</p>
            )}
          </Card>
        ) : null}

        <Card id="pipeline" title="pipeline" className={latest && chat ? "lg:col-span-2" : ""}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric value={projects.length} label="projects published" />
            <Metric value={knowledgeIndex.chunks.length} label="knowledge chunks (AI)" />
            <Metric compact value={lastSync ? formatTime(lastSync.t) : "—"} label="last GitHub sync" />
            <Metric compact value={BUILD_TIME ? formatTime(BUILD_TIME) : "—"} label={`last build${commit ? ` (${commit})` : ""}`} />
          </div>
          <p className="mt-4 font-mono text-[11px] text-txtdim">
            Synced from GitHub every 6 h · screenshots weekly · build log every Monday (
            <Link href={LOG_PATH} className="text-teal underline-offset-2 hover:underline">
              read it
            </Link>
            ){isRedisConfigured() ? "" : " · live metrics appear once Redis is configured"}
          </p>
        </Card>
      </div>
    </div>
  );
}
