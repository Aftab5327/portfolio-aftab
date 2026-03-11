"use client";

import { useEffect, useMemo, useState } from "react";

const ROLES = [
  "Full Stack Developer",
  "IoT Engineer",
  "AI Builder",
  "MERN Stack Developer"
];

const TYPE_SPEED = 70;
const DELETE_SPEED = 38;
const WORD_PAUSE = 1300;
const NEXT_WORD_DELAY = 260;

export default function HomeSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentRole = useMemo(() => ROLES[roleIndex], [roleIndex]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedText.length < currentRole.length) {
      timer = setTimeout(() => {
        setTypedText(currentRole.slice(0, typedText.length + 1));
      }, TYPE_SPEED);
      return () => clearTimeout(timer);
    }

    if (!isDeleting && typedText === currentRole) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, WORD_PAUSE);
      return () => clearTimeout(timer);
    }

    if (isDeleting && typedText.length > 0) {
      timer = setTimeout(() => {
        setTypedText(currentRole.slice(0, typedText.length - 1));
      }, DELETE_SPEED);
      return () => clearTimeout(timer);
    }

    timer = setTimeout(() => {
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, NEXT_WORD_DELAY);

    return () => clearTimeout(timer);
  }, [currentRole, isDeleting, roleIndex, typedText]);

  return (
    <section className="relative overflow-hidden rounded-3xl glass px-6 py-[60px] sm:px-8 sm:py-[60px] lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:28px_28px] opacity-20" />
      <div className="pointer-events-none absolute -right-20 top-6 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
          Software Developer
        </p>

        <p className="fluid-body mt-6 text-slate-700 dark:text-slate-200">Hello, I&apos;m</p>

        <h1 className="fluid-heading mt-2 font-semibold tracking-tight text-slate-900 dark:text-white">
          Aftab Dhalait
        </h1>

        <p className="fluid-body mt-4 min-h-[1.75rem] text-slate-700 dark:text-slate-200">
          <span className="inline-flex items-center font-semibold text-accent">
            {typedText}
            <span className="ml-1 h-5 w-[2px] animate-pulse bg-accent" />
          </span>
        </p>

        <blockquote className="mt-4 mb-4 max-w-[600px] border-l-2 border-slate-300/80 pl-4 text-[1rem] leading-[1.7] text-slate-600 dark:border-white/30 dark:text-slate-300 md:text-[1.1rem]">
          From crafting pixel-perfect interfaces to engineering embedded systems &mdash; I build software that lives
          in browsers, servers, and the real world. Whether it&apos;s a React frontend, a scalable backend API, or an
          IoT device talking to the cloud, I connect every layer of the stack with precision and purpose.
        </blockquote>

        <div className="mt-6 inline-flex min-h-11 items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300">
          <span>{"\uD83D\uDFE2 Open to Opportunities"}</span>
        </div>

        <p className="fluid-body mt-8 leading-relaxed text-slate-700 dark:text-slate-200">
          I build across full-stack applications, AI systems, and connected IoT products with a focus on practical
          outcomes.
        </p>

        <div className="reveal-up mt-10 flex">
          <button
            type="button"
            onClick={() => scrollToSection("projects")}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:w-auto"
          >
            View My Work
          </button>
        </div>
      </div>
    </section>
  );
}
