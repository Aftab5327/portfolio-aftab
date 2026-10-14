"use client";

import { motion } from "framer-motion";
import { RESUME_PATH } from "@/lib/config";
import type { Profile } from "@/lib/schema";

export type AboutProfile = Pick<
  Profile,
  | "name"
  | "headline"
  | "summary"
  | "recruiterNote"
  | "interests"
  | "quote"
  | "education"
  | "experience"
  | "certifications"
  | "stats"
>;

const educationLine = (item: AboutProfile["education"][number]) =>
  [item.degree, item.detail].filter(Boolean).join(" ") + (item.institution ? ` - ${item.institution}` : "");

export default function AboutSection({ profile }: { profile: AboutProfile }) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16"
    >
      <p className="font-mono text-sm text-teal">{"// about"}</p>
      <h2 className="fluid-heading mt-3 max-w-3xl font-display font-bold tracking-tight text-txt">{profile.headline}</h2>

      {profile.education.length ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-txtdim">
          {profile.education.map((item) => (
            <span key={item.short} className="rounded-md border border-line bg-panel2 px-3 py-1">
              {item.short}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          {profile.summary.map((paragraph, index) => (
            <p key={paragraph} className={`${index ? "mt-3 " : ""}max-w-2xl text-[15px] leading-[1.75] text-txtdim`}>
              {paragraph}
            </p>
          ))}

          {profile.recruiterNote ? (
            <div className="mt-6 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm leading-relaxed text-txt">
              <span className="font-mono font-semibold text-teal">{"// for recruiters:"}</span> {profile.recruiterNote}
            </div>
          ) : null}

          {profile.interests.length ? (
            <div className="mt-6 rounded-xl border border-line bg-panel2 p-5">
              <h3 className="font-mono text-sm text-teal">{"<> activities I love"}</h3>
              <div className="mt-4 space-y-3">
                {profile.interests.map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-txtdim">
                    <span
                      aria-hidden
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-teal/10"
                    >
                      {item.icon}
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {profile.quote ? (
            <>
              <blockquote className="mt-6 border-l-2 border-teal pl-5 font-display text-lg italic leading-relaxed text-txt">
                &quot;{profile.quote}&quot;
              </blockquote>
              <p className="mt-2 font-mono text-sm text-txtdim">— {profile.name}</p>
            </>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="space-y-6"
        >
          {profile.experience.length ? (
            <div className="rounded-xl border border-line bg-panel2 p-5">
              <h3 className="font-mono text-sm text-teal">{"// experience"}</h3>
              <ol className="relative mt-5 space-y-6 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line before:content-['']">
                {profile.experience.map((item) => (
                  <li key={`${item.company}-${item.role}-${item.start}`} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 inline-flex h-2.5 w-2.5 rounded-full border border-teal bg-teal/30" />
                    <p className="text-sm font-semibold text-txt">
                      {item.role} <span className="font-normal text-txtdim">@ {item.company}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-txtdim">
                      {item.start} – {item.end}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    {item.summary ? <p className="mt-2 text-sm leading-relaxed text-txtdim">{item.summary}</p> : null}
                    {item.highlights.length ? (
                      <ul className="mt-2 space-y-1">
                        {item.highlights.map((highlight) => (
                          <li key={highlight} className="flex gap-2 text-sm leading-relaxed text-txtdim">
                            <span aria-hidden className="text-teal">
                              ▹
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {profile.education.length ? (
            <div className="rounded-xl border border-line bg-panel2 p-5">
              <h3 className="font-mono text-sm text-teal">{"// education timeline"}</h3>
              <div className="relative mt-5 space-y-5">
                <div className="absolute bottom-1 left-[5px] top-1 w-px bg-line" />
                {profile.education.map((item) => (
                  <div key={item.short} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 inline-flex h-2.5 w-2.5 rounded-full border border-teal bg-teal/30" />
                    <p className="text-sm leading-relaxed text-txtdim">{educationLine(item)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {profile.certifications.length ? (
            <div className="rounded-xl border border-line bg-panel2 p-5">
              <h3 className="font-mono text-sm text-teal">{"// certifications"}</h3>
              <ul className="mt-4 space-y-3">
                {profile.certifications.map((cert) => (
                  <li key={`${cert.issuer}-${cert.name}`} className="text-sm leading-relaxed text-txtdim">
                    {cert.url ? (
                      <a href={cert.url} target="_blank" rel="noreferrer" className="text-txt hover:text-teal">
                        {cert.name}
                      </a>
                    ) : (
                      <span className="text-txt">{cert.name}</span>
                    )}
                    <span className="font-mono text-[11px]">
                      {" "}
                      · {cert.issuer}
                      {cert.year ? ` · ${cert.year}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {profile.stats.length ? (
            <div className="rounded-xl border border-line bg-panel2 p-5">
              <h3 className="font-mono text-sm text-teal">{"{ } quick stats"}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {profile.stats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-line bg-panel p-4">
                    <p className="font-display text-3xl font-bold leading-none text-teal">{item.value}</p>
                    <p className="mt-2 text-xs leading-relaxed text-txtdim">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="inline-flex min-h-12 items-center rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Hire Me
            </button>
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 items-center rounded-xl border border-line bg-panel px-6 text-sm font-medium text-txt transition duration-200 hover:-translate-y-0.5 hover:border-teal hover:text-teal"
            >
              Download Resume
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
