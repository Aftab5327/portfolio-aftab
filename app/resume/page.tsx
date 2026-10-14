import type { Metadata } from "next";
import { FiDownload, FiPrinter } from "react-icons/fi";
import { RESUME_JSON_PATH, RESUME_PATH } from "@/lib/config";
import { buildResume, educationLine, experienceMeta, formatDate } from "@/lib/resume";
import PrintButton from "@/components/PrintButton";

const resume = buildResume();

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${resume.name}, ${resume.title}. ${resume.summary.slice(0, 120)}`,
  alternates: { canonical: "/resume" },
  openGraph: { title: `${resume.name} – Resume`, url: "/resume", type: "profile" }
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid-page print:mt-5">
      <h2 className="border-b border-line pb-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-teal print:text-xs">
        {title}
      </h2>
      <div className="mt-3 print:mt-2">{children}</div>
    </section>
  );
}

const bulletList = "mt-1.5 list-disc space-y-1 pl-5 marker:text-teal";

export default function ResumePage() {
  const { contact } = resume;

  return (
    <article className="mx-auto max-w-3xl rounded-card border border-line bg-panel px-6 py-10 text-[15px] leading-relaxed text-txtdim shadow-soft sm:px-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[10.5pt] print:shadow-none">
      <div className="mb-8 flex flex-wrap gap-3 print:hidden">
        <a
          href={RESUME_PATH}
          download={resume.meta.fileName}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-bg transition hover:brightness-110"
        >
          <FiDownload aria-hidden />
          Download PDF
        </a>
        <a
          href={RESUME_JSON_PATH}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-panel2 px-5 text-sm font-medium text-txt transition hover:border-teal hover:text-teal"
        >
          {"{ }"} View JSON
        </a>
        <PrintButton className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-panel2 px-5 text-sm font-medium text-txt transition hover:border-teal hover:text-teal">
          <FiPrinter aria-hidden />
          Print
        </PrintButton>
      </div>

      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-txt print:text-[20pt]">{resume.name}</h1>
        <p className="mt-1 font-semibold text-teal">{resume.title}</p>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <a href={`mailto:${contact.email}`} className="text-teal hover:underline">
            {contact.email}
          </a>
          {contact.phone ? <span>{contact.phone}</span> : null}
          <span>{contact.location}</span>
          {contact.links.map((item) => (
            <a key={item.url} href={item.url} className="text-teal hover:underline" target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ))}
        </p>
      </header>

      {resume.summary ? (
        <Section title="Summary">
          <p>{resume.summary}</p>
        </Section>
      ) : null}

      {resume.experience.length ? (
        <Section title="Experience">
          <div className="space-y-4">
            {resume.experience.map((item) => (
              <div key={`${item.company}-${item.role}-${item.start}`} className="break-inside-avoid">
                <h3 className="font-semibold text-txt">
                  {item.role} — {item.company}
                </h3>
                <p className="font-mono text-xs">{experienceMeta(item)}</p>
                {item.summary ? <p className="mt-1">{item.summary}</p> : null}
                {item.highlights.length ? (
                  <ul className={bulletList}>
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {resume.projects.length ? (
        <Section title="Projects">
          <div className="space-y-3">
            {resume.projects.map((project) => (
              <div key={project.title} className="break-inside-avoid">
                <p>
                  <span className="font-semibold text-txt">{project.title}</span>
                  {project.tagline ? ` — ${project.tagline}` : ""}
                </p>
                {project.bullet ? (
                  <ul className={bulletList}>
                    <li>{project.bullet}</li>
                  </ul>
                ) : null}
                <p className="mt-0.5 text-sm">
                  {project.stack.length ? <span>Stack: {project.stack.join(", ")}</span> : null}
                  {project.stack.length && project.link.url ? <span aria-hidden>{"  |  "}</span> : null}
                  {project.link.url ? (
                    <a href={project.link.url} className="text-teal hover:underline" target="_blank" rel="noreferrer">
                      {project.link.label}
                    </a>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {resume.skills.length ? (
        <Section title="Skills">
          <ul className="space-y-1">
            {resume.skills.map((group) => (
              <li key={group.category}>
                <span className="font-semibold text-txt">{group.category}:</span> {group.items.join(", ")}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.education.length ? (
        <Section title="Education">
          <ul className="space-y-1">
            {resume.education.map((item) => (
              <li key={educationLine(item)}>{educationLine(item)}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.certifications.length ? (
        <Section title="Certifications">
          <ul className="space-y-1">
            {resume.certifications.map((cert) => (
              <li key={`${cert.issuer}-${cert.name}`}>
                {cert.url ? (
                  <a href={cert.url} className="text-teal hover:underline" target="_blank" rel="noreferrer">
                    {cert.name}
                  </a>
                ) : (
                  <span className="text-txt">{cert.name}</span>
                )}
                {` — ${cert.issuer}${cert.year ? `, ${cert.year}` : ""}`}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resume.extraSections.map((section) => (
        <Section key={section.title} title={section.title}>
          <ul className={bulletList}>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ))}

      <p className="mt-10 border-t border-line pt-4 font-mono text-[11px] print:mt-6">
        Generated from this portfolio on {formatDate(resume.meta.generatedAt)}
        {resume.meta.siteUrl ? ` · ${resume.meta.siteUrl}` : ""}
      </p>
    </article>
  );
}
