import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { getProfile } from "@/lib/data";

const iconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-txtdim transition-all duration-300 hover:-translate-y-0.5 hover:border-teal hover:text-teal";

export default function Footer() {
  const site = getProfile();

  return (
    <footer className="mx-auto w-[min(1180px,92%)] pb-10 print:hidden">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs text-txtdim">
          <span className="text-teal">{"</>"}</span> Designed &amp; Developed by {site.name}
        </p>

        <p className="order-last font-mono text-xs text-txtfaint sm:order-0">{"// copyright (c) 2026"}</p>

        <div className="flex items-center gap-2">
          <a href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub" className={iconClass}>
            <FaGithub />
          </a>
          <a href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className={iconClass}>
            <FaLinkedinIn />
          </a>
          {site.socials.twitter ? (
            <a href={site.socials.twitter} target="_blank" rel="noreferrer" aria-label="X (Twitter)" className={iconClass}>
              <FaXTwitter />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
