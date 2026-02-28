"use client";

import { motion } from "framer-motion";
import { experience, experiencePoints, skills, stats } from "@/lib/portfolio";

export default function Attributes() {
  return (
    <section className="mx-auto mt-16 w-[min(1100px,94%)] space-y-6 md:mt-24">
      <motion.div
        id="about"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="rounded-2xl glass p-7 md:p-10"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">About</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">About Me</h2>
        <p className="mt-4 max-w-3xl text-slate-700 dark:text-slate-200">
          Full-stack web developer focused on building performant, scalable, and visually engaging products.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-slate-700 dark:text-slate-200 md:grid-cols-2">
          {experiencePoints.map((point) => (
            <li key={point} className="rounded-xl border border-slate-300/70 bg-white/55 p-4 dark:border-white/20 dark:bg-white/5">
              {point}
            </li>
          ))}
        </ul>
      </motion.div>

      <div id="skills" className="grid gap-6 lg:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl glass p-7 md:p-8"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Skills</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Technical Skills</h3>
          <ul className="mt-5 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-slate-300/80 bg-white/65 px-3 py-1 text-xs text-slate-700 dark:border-white/25 dark:bg-white/5 dark:text-slate-100"
              >
                {skill}
              </li>
            ))}
          </ul>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="rounded-2xl glass p-7 md:p-8"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Stats</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Career Snapshot</h3>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-300/70 bg-white/55 p-4 dark:border-white/20 dark:bg-white/5">
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <motion.div
        id="experience"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="rounded-2xl glass p-7 md:p-10"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Experience</p>
        <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Work Experience</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {experience.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-300/70 bg-white/55 p-5 dark:border-white/20 dark:bg-white/5">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item.summary}</p>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
