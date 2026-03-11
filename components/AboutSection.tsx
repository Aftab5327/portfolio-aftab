"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const activities = [
  { icon: "\u26A1", text: "Integrating Hardware & Software" },
  { icon: "\uD83C\uDF10", text: "Exploring New Technologies" },
  { icon: "\uD83E\uDDE9", text: "Problem Solving & System Design" },
  { icon: "\uD83C\uDFA8", text: "Designing Frontend Interfaces" },
  { icon: "\uD83D\uDD27", text: "Building Full-Stack Applications" },
  { icon: "\uD83D\uDCCA", text: "Applying Data Science" },
  { icon: "\uD83E\uDD16", text: "AI-Powered Applications" }
];

const timeline = [
  "B.E. Electronics & Telecommunication With Honors in Data Science",
  "PG Diploma in Advanced Computing - CDAC"
];

const stats = [
  { value: "2+", label: "Years of Experience" },
  { value: "10+", label: "Projects Built" },
  { value: "3", label: "Specializations (Web · IoT · AI)" },
  { value: "2+", label: "IoT Systems Deployed" }
];

export default function AboutSection() {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="rounded-3xl glass px-6 py-[60px] sm:px-8 sm:py-[60px] lg:px-16 lg:py-20"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">About Me</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-200 sm:text-sm">
        <span className="rounded-full border border-slate-300/80 bg-white/65 px-3 py-1 dark:border-white/25 dark:bg-white/5">
          B.E. Electronics & Telecommunication With Data Science Honors
        </span>
        <span className="text-slate-500 dark:text-slate-400">&middot;</span>
        <span className="rounded-full border border-slate-300/80 bg-white/65 px-3 py-1 dark:border-white/25 dark:bg-white/5">
          CDAC Advanced Computing
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <h1 className="fluid-subhead font-semibold leading-tight text-slate-900 dark:text-white">
            Full Stack Developer. IoT Engineer. Business-Driven Technologist.
          </h1>

          <p className="fluid-body mt-5 max-w-2xl leading-relaxed text-slate-700 dark:text-slate-200">
            I&apos;m Aftab Dhalait &mdash; a Software Developer who bridges hardware and software, web and IoT,
            engineering and business.
          </p>
          <p className="fluid-body mt-2 max-w-2xl leading-relaxed text-slate-700 dark:text-slate-200">
            B.E. + CDAC. I build full-stack systems that solve real-world problems with precision and purpose.
          </p>

          <div className="reveal-up mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">🎯 For Recruiters:</span> Aftab
            bridges hardware & software, web & IoT. B.E. + CDAC. Open to Full Stack, IoT & AI roles.
          </div>

          <div className="reveal-up mt-6 rounded-2xl border border-slate-300/70 bg-white/55 p-5 dark:border-white/20 dark:bg-white/5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
              Activities I Love
            </h2>
            <div className="mt-4 space-y-3">
              {activities.map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <blockquote className="reveal-up fluid-body mt-6 border-l-2 border-emerald-400/70 pl-4 italic leading-relaxed text-slate-700 dark:text-slate-200">
            &quot;Most developers live in one world - web or hardware. I chose to master both.&quot;
          </blockquote>
          <p className="fluid-body mt-2 font-medium text-slate-800 dark:text-slate-200">- Aftab Dhalait</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="space-y-6"
        >
          <div className="reveal-up rounded-2xl border border-slate-300/70 bg-white/55 p-5 dark:border-white/20 dark:bg-white/5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
              Education Timeline
            </h2>

            <div className="relative mt-5 space-y-5">
              <div className="absolute bottom-0 left-2 top-0 w-[2px] bg-emerald-400/70" />
              {timeline.map((item) => (
                <div key={item} className="relative pl-8">
                  <span className="absolute left-0 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400 bg-emerald-400/25" />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    <span className="mr-1">\uD83C\uDF93</span>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up rounded-2xl border border-slate-300/70 bg-white/55 p-5 dark:border-white/20 dark:bg-white/5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
              Quick Stats
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-300/70 bg-white/60 p-4 dark:border-white/20 dark:bg-white/5">
                  <p className="text-3xl font-semibold leading-none text-emerald-600 dark:text-emerald-300">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Hire Me
            </button>
            <Link
              href="/resume.pdf"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Download Resume
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
