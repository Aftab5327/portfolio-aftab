"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import ProjectImage from "@/components/ProjectImage";
import type { ResolvedProject } from "@/lib/data";

export type ProjectCard = Pick<ResolvedProject, "slug" | "title" | "category" | "tagline" | "stack" | "displayImage">;

export default function ProjectsSection({ projects }: { projects: ProjectCard[] }) {
  return (
    <section className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="font-mono text-sm text-teal">{"// projects"}</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Things I Have Built</h2>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.slug}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
            className="group overflow-hidden rounded-xl border border-line bg-panel2 transition-all duration-200 hover:-translate-y-1.5 hover:border-teal/60 hover:shadow-glow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal"
          >
            <Link href={`/projects/${project.slug}`} className="flex h-full flex-col focus-visible:outline-none">
              {/* IDE window top bar */}
              <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-2.5">
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-txtfaint">{(index + 1).toString().padStart(2, "0")}</span>
              </div>

              <ProjectImage
                src={project.displayImage}
                title={project.title}
                category={project.category}
                sizes="(min-width: 1180px) 340px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
                className="border-b border-line"
              />

              <div className="flex flex-1 flex-col p-5">
                <span className="font-mono text-[11px] text-teal">{project.category}</span>

                <h3 className="mt-3 font-display text-xl font-bold leading-snug text-txt">{project.title}</h3>

                <p className="mt-3 text-sm leading-relaxed text-txtdim">{project.tagline}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.stack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[11px] text-txtdim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span className="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 font-mono text-sm text-teal transition-colors group-hover:text-txt">
                  Read case study
                  <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
