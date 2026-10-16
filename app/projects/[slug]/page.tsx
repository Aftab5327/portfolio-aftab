import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiArrowUpRight, FiGithub, FiStar } from "react-icons/fi";
import Markdown from "@/components/Markdown";
import ProjectImage from "@/components/ProjectImage";
import { getProject, getProjects } from "@/lib/data";
import { internalPath, safeImageSrc, safeUrl } from "@/lib/safe-url";
import { SECTION_KEYS, type CaseStudySource } from "@/lib/schema";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

const CONTENT_LABELS: Record<CaseStudySource, string> = {
  "portfolio-md": "PORTFOLIO.md",
  "case-study": "AI draft (reviewed)",
  manual: "manual",
  metadata: "repo metadata"
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const project = getProject(params.slug);
  if (!project) return {};
  const ogImage = safeImageSrc(project.displayImage);

  return {
    title: project.title,
    description: project.tagline || undefined,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.tagline || undefined,
      type: "article",
      url: internalPath("projects", project.slug),
      ...(ogImage ? { images: [{ url: ogImage, width: 1600, height: 900 }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.tagline || undefined
    }
  };
}

export default async function ProjectPage(props: Params) {
  const params = await props.params;
  const project = getProject(params.slug);
  if (!project) notFound();

  const sections = SECTION_KEYS.filter((key) => project.sections[key].trim());
  // Stored links (projects.json / PORTFOLIO.md): only https://github.com/... or same-site paths become links.
  const liveUrl = safeUrl(project.liveUrl);
  const repoUrl = safeUrl(project.repoUrl);

  return (
    <article className="rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10 lg:px-14 lg:py-14">
      <Link
        href="/#projects"
        className="inline-flex items-center gap-2 font-mono text-sm text-txtdim transition-colors hover:text-teal"
      >
        <FiArrowLeft aria-hidden />
        cd ../projects
      </Link>

      <header className="mt-8">
        {project.category ? <p className="font-mono text-sm text-teal">{project.category}</p> : null}
        <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">{project.title}</h1>
        {project.tagline ? (
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-txtdim">{project.tagline}</p>
        ) : null}

        {repoUrl || liveUrl ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition hover:brightness-110"
              >
                Live demo
                <FiArrowUpRight aria-hidden />
              </a>
            ) : null}
            {repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-panel2 px-6 text-sm font-medium text-txt transition hover:border-teal hover:text-teal"
              >
                <FiGithub aria-hidden />
                Source code
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      <figure className="mt-10">
        <ProjectImage
          src={project.displayImage}
          title={project.title}
          category={project.category}
          sizes="(min-width: 1180px) 1040px, 88vw"
          priority
          className="rounded-2xl border border-line"
        />
        <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-txtdim">
          <span>Content: {CONTENT_LABELS[project.caseStudySource]}</span>
          {project.imageSource === "auto" && project.screenshotCapturedAt ? (
            <span>
              Screenshot captured{" "}
              <time dateTime={project.screenshotCapturedAt}>{dateFormat.format(new Date(project.screenshotCapturedAt))}</time>
            </span>
          ) : null}
        </figcaption>
      </figure>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {sections.map((key) => (
            <section key={key} id={key} className="scroll-mt-24">
              <h2 className="font-mono text-sm text-teal">{`// ${key}`}</h2>
              <div className="mt-3">
                <Markdown>{project.sections[key]}</Markdown>
              </div>
            </section>
          ))}

          {sections.length === 0 ? (
            <p className="rounded-xl border border-line bg-panel2 p-5 text-sm text-txtdim">
              A full write-up for this project is coming soon.
            </p>
          ) : null}
        </div>

        <aside className="h-fit space-y-6 rounded-xl border border-line bg-panel2 p-5">
          {project.stack.length ? (
            <div>
              <h2 className="font-mono text-sm text-teal">{"// stack"}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[11px] text-txtdim"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {project.languages.length ? (
            <div>
              <h2 className="font-mono text-sm text-teal">{"// languages"}</h2>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-bg2" aria-hidden>
                {project.languages.map((language, index) => (
                  <span
                    key={language.name}
                    className="h-full"
                    style={{
                      width: `${language.percent}%`,
                      backgroundColor: "var(--teal)",
                      opacity: Math.max(1 - index * 0.2, 0.25)
                    }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1 font-mono text-[11px] text-txtdim">
                {project.languages.slice(0, 5).map((language) => (
                  <li key={language.name} className="flex justify-between gap-3">
                    <span>{language.name}</span>
                    <span>{language.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {project.source === "github" ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-txtdim">
              <span className="inline-flex items-center gap-1" aria-label={`${project.stars} stars`}>
                <FiStar aria-hidden />
                {project.stars}
              </span>
              {project.pushedAt ? (
                <span>
                  Updated <time dateTime={project.pushedAt}>{dateFormat.format(new Date(project.pushedAt))}</time>
                </span>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
