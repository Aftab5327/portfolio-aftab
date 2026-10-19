import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiCpu, FiGitCommit } from "react-icons/fi";
import Markdown from "@/components/Markdown";
import { getBuildLogPost, getBuildLogPosts, plainText } from "@/lib/build-log";
import { internalPath, safeUrl } from "@/lib/safe-url";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDay = (day: string) => dateFormat.format(new Date(`${day}T00:00:00Z`));

export function generateStaticParams() {
  return getBuildLogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getBuildLogPost(params.slug);
  if (!post) return {};
  const description = plainText(post.body).replace(/\n/g, " ").slice(0, 160);
  return {
    title: `${post.title} · Build log`,
    description,
    alternates: { canonical: internalPath("log", post.slug) },
    openGraph: { title: post.title, description, type: "article", url: internalPath("log", post.slug), publishedTime: post.date }
  };
}

export default async function BuildLogPostPage(props: Params) {
  const params = await props.params;
  const post = getBuildLogPost(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10 lg:py-14">
      <Link href="/log" className="inline-flex items-center gap-2 font-mono text-sm text-txtdim transition-colors hover:text-teal">
        <FiArrowLeft aria-hidden />
        cd ../log
      </Link>

      <header className="mt-8">
        <p className="font-mono text-sm text-teal">
          <time dateTime={post.weekStart}>{formatDay(post.weekStart)}</time> – <time dateTime={post.weekEnd}>{formatDay(post.weekEnd)}</time>
        </p>
        <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-txtdim">
          {post.aiGenerated ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-teal">
              <FiCpu aria-hidden />
              AI summary of real commits
            </span>
          ) : null}
          <span>
            {post.commitCount} commits · {post.repos.join(", ")}
          </span>
        </div>
      </header>

      <div className="mt-8">
        <Markdown variant="document">{post.body}</Markdown>
      </div>

      {post.commits.length ? (
        <section className="mt-10 border-t border-line pt-6" aria-labelledby="commits-heading">
          <h2 id="commits-heading" className="font-mono text-sm text-teal">
            {"// source commits"}
          </h2>
          <ul className="mt-4 space-y-2">
            {post.commits.map((commit) => {
              // Re-checked at render time too: only https://github.com/... becomes a link.
              const href = safeUrl(commit.url, { relative: false });
              const label = `${commit.repo}@${commit.sha.slice(0, 7)}`;
              return (
                <li key={commit.sha} className="flex gap-3 text-sm text-txtdim">
                  <FiGitCommit aria-hidden className="mt-1 shrink-0 text-teal" />
                  <span>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-teal underline-offset-2 hover:underline">
                        {label}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-teal">{label}</span>
                    )}{" "}
                    {commit.message}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
