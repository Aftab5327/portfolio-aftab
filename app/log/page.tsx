import type { Metadata } from "next";
import Link from "next/link";
import { FiRss } from "react-icons/fi";
import { getBuildLogPosts } from "@/lib/build-log";
import { AUTOMATION_DOCS_PATH } from "@/lib/config";
import { getProfile } from "@/lib/data";
import { internalPath } from "@/lib/safe-url";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Build log",
  description: "A weekly log of what I've been building: AI summaries of real commits across my portfolio projects.",
  alternates: { canonical: "/log", types: { "application/rss+xml": "/log/rss.xml" } }
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDay = (day: string) => dateFormat.format(new Date(`${day}T00:00:00Z`));

export default function BuildLogPage() {
  const posts = getBuildLogPosts();
  const { firstName } = getProfile();

  return (
    <section className="mx-auto max-w-3xl rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10 lg:py-14">
      <p className="font-mono text-sm text-teal">{"// build-log"}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="fluid-heading font-display font-bold tracking-tight text-txt">Build log</h1>
        <a href="/log/rss.xml" className="inline-flex items-center gap-2 font-mono text-sm text-txtdim transition-colors hover:text-teal">
          <FiRss aria-hidden />
          RSS
        </a>
      </div>
      <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-txtdim">
        What {firstName} worked on each week, written automatically every Monday from real commit messages across his
        portfolio projects. <Link href={AUTOMATION_DOCS_PATH} className="text-teal underline-offset-2 hover:underline">How it works</Link>
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-line bg-panel2 p-5 text-sm text-txtdim">
          No posts yet. The first one is generated automatically the Monday after a week with at least 3 meaningful commits.
        </p>
      ) : (
        <ol className="mt-10 space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={internalPath("log", post.slug)}
                className="block rounded-xl border border-line bg-panel2 p-5 transition-all duration-200 hover:-translate-y-0.5"
              >
                <p className="font-mono text-[11px] text-txtdim">
                  <time dateTime={post.weekStart}>{formatDay(post.weekStart)}</time> – <time dateTime={post.weekEnd}>{formatDay(post.weekEnd)}</time> ·{" "}
                  {post.commitCount} commits · {post.repos.join(", ")}
                </p>
                <h2 className="mt-2 font-display text-lg font-bold text-txt">{post.title}</h2>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
