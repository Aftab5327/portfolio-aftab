import { FaGithub, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mx-auto mt-10 w-[min(1100px,94%)] px-4 pb-6 sm:px-6">
      <div className="mt-8 border-t border-slate-300/70 pt-5 dark:border-white/15">
        <div className="relative flex items-center justify-between gap-3">
          <p className="min-w-0 max-w-[58%] truncate text-[10px] font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
            <b>Designed and Developed by Aftab Dhalait</b>
          </p>

          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
            <b>Copyright (c) 2026</b>
          </p>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <a
              href="https://github.com/Aftab5327"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/70 bg-white/60 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900 dark:border-white/20 dark:bg-white/5 dark:hover:text-white"
            >
              <FaGithub />
            </a>
            <a
              href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/70 bg-white/60 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900 dark:border-white/20 dark:bg-white/5 dark:hover:text-white"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
