"use client";

import { motion } from "framer-motion";
import Typewriter from "./Typewriter";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative mx-auto mt-12 w-[min(1100px,94%)] overflow-hidden rounded-3xl glass p-8 md:mt-16 md:p-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:28px_28px] opacity-25" />
      <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl"
      >
        <p className="mb-4 inline-flex rounded-full border border-slate-300/70 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-700 dark:border-white/30 dark:bg-white/5 dark:text-slate-200">
          Aftab Dhalait
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-6xl">
          Full Stack Software Developer & IoT Specialist
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200 md:text-xl">
          Full Stack Developer, IoT Specialist, and AI Enthusiast building intelligent web applications and smart connected systems that transform data into automation and innovation. I am a{" "}
          <Typewriter words={["Full Stack Developer", "MERN Stack Developer", "React/Next.js Developer"]} />
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="rounded-xl border border-slate-300/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-white dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Contact Me
          </a>
        </div>
      </motion.div>
    </section>
  );
}
