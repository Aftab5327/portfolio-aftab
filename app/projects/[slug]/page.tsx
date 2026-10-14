import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiArrowUpRight, FiGithub } from "react-icons/fi";
import { getProject, projects } from "@/lib/projects";

type Params = { params: { slug: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const project = getProject(params.slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.tagline,
      type: "article",
      url: `/projects/${project.slug}`,
      ...(project.image ? { images: [{ url: project.image }] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.tagline
    }
  };
}

export default function ProjectPage({ params }: Params) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const narrative = [
    { label: "problem", body: project.problem },
    { label: "solution", body: project.solution },
    { label: "result", body: project.result }
  ].filter((item) => item.body);

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
        <p className="font-mono text-sm text-teal">{project.category}</p>
        <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">{project.title}</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-txtdim">{project.tagline}</p>

        {project.repoUrl || project.liveUrl ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition hover:brightness-110"
              >
                Live demo
                <FiArrowUpRight aria-hidden />
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
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

      {project.image ? (
        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-panel2">
          <Image
            src={project.image}
            alt={`${project.title} screenshot`}
            width={1600}
            height={900}
            sizes="(min-width: 1180px) 1080px, 92vw"
            className="h-auto w-full"
            priority
          />
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {narrative.map((item) => (
            <section key={item.label}>
              <h2 className="font-mono text-sm text-teal">{`// ${item.label}`}</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.75] text-txtdim">{item.body}</p>
            </section>
          ))}

          <ListSection label="features" items={project.features} />
          <ListSection label="challenges" items={project.challenges} />

          {narrative.length === 0 && project.features.length === 0 && project.challenges.length === 0 ? (
            <p className="rounded-xl border border-line bg-panel2 p-5 text-sm text-txtdim">
              A full write-up for this project is coming soon.
            </p>
          ) : null}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-panel2 p-5">
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
        </aside>
      </div>
    </article>
  );
}

function ListSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-sm text-teal">{`// ${label}`}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-[1.75] text-txtdim">
            <span aria-hidden className="text-teal">
              ▹
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
