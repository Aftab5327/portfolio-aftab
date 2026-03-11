import { FaGithub, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mx-auto mt-10 w-[min(1100px,94%)] px-4 pb-6 sm:px-6">
      <div className="mt-8 border-t border-slate-300/70 pt-5 dark:border-white/15">
        <div className="flex flex-col items-center gap-3 md:hidden">
          <p className="block w-full whitespace-normal break-words text-center text-[10px] font-medium text-slate-700 dark:text-slate-300 sm:text-sm md:hidden">
            <b>Designed and Developed by Aftab Dhalait</b>
          </p>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 md:hidden">
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

        <div className="relative hidden items-center justify-between gap-3 md:flex">
          <p className="hidden min-w-0 max-w-[58%] truncate text-[10px] font-medium text-slate-700 dark:text-slate-300 sm:block sm:text-sm">
            <b>Designed and Developed by Aftab Dhalait</b>
          </p>

          <p className="block w-full text-center text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-2 sm:pointer-events-none sm:absolute sm:left-1/2 sm:mt-0 sm:w-auto sm:-translate-x-1/2 sm:whitespace-nowrap sm:text-sm">
            <b>Copyright (c) 2026</b>
          </p>

          <div className="order-first flex items-center gap-2 text-slate-700 dark:text-slate-300 sm:order-none">
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
