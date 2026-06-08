import { FaGithub, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mx-auto w-[min(1180px,92%)] pb-10">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs text-txtdim">
          <span className="text-teal">{"</>"}</span> Designed &amp; Developed by Aftab Dhalait
        </p>

        <p className="order-last font-mono text-xs text-txtfaint sm:order-none">{"// copyright (c) 2026"}</p>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Aftab5327"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-txtdim transition-all duration-300 hover:-translate-y-0.5 hover:border-teal hover:text-teal"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-txtdim transition-all duration-300 hover:-translate-y-0.5 hover:border-teal hover:text-teal"
          >
            <FaLinkedinIn />
          </a>
        </div>
      </div>
    </footer>
  );
}
