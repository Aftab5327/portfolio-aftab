"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/projects";

export default function Projects() {
  return (
    <section id="projects" className="mx-auto mt-16 w-[min(1100px,94%)] md:mt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mb-8"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Selected Work</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">Recent Projects</h2>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: index * 0.12 }}
            className="group relative overflow-hidden rounded-2xl glass p-6 shadow-soft"
          >
            <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-300/15 blur-2xl transition group-hover:scale-125" />
            <h3 className="relative text-xl font-semibold text-slate-900 dark:text-white">{project.title}</h3>
            <p className="relative mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{project.summary}</p>
            <ul className="relative mt-5 flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-slate-300/80 bg-white/65 px-3 py-1 text-xs text-slate-700 dark:border-white/25 dark:bg-white/5 dark:text-slate-100"
                >
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={project.link}
              className="relative mt-6 inline-flex text-sm font-medium text-accent transition hover:brightness-125"
            >
              Explore project {"->"}
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
