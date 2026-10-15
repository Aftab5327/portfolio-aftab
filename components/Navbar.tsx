"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FiMenu, FiX, FiMail } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";
import CommandPalette from "@/components/CommandPalette";
import Link from "next/link";
import { STATS_PATH, sections } from "@/lib/config";
import type { Profile } from "@/lib/schema";

// Root-relative so the links also work from /projects/[slug].
const links = sections.map((section) => ({ ...section, href: `/#${section.id}` }));

export type NavProfile = Pick<Profile, "firstName" | "lastName" | "email" | "socials">;

export default function Navbar({ profile }: { profile: NavProfile }) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.2, 0.5, 0.8]
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [pathname]);

  // The home-page sections only exist on "/"; elsewhere no link is highlighted.
  const highlighted = pathname === "/" ? activeSection : "";

  const handleNavClick = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`sticky top-0 z-40 w-full transition-colors duration-300 print:hidden ${
        scrolled
          ? "border-b border-line backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-[min(1180px,92%)] items-center justify-between py-4">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation + hash scroll, kept identical to Next 14 */}
        <a
          href="/#home"
          onClick={handleNavClick}
          className="logo font-mono text-sm font-semibold tracking-tight text-txt transition-colors"
        >
          {"<A/>"} {profile.firstName} <span className="text-teal">{profile.lastName}</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={handleNavClick}
                className={`font-mono text-[13px] transition-colors duration-200 hover:text-teal ${
                  highlighted === link.id ? "text-teal" : "text-txtdim"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="hidden lg:block">
            <Link
              href={STATS_PATH}
              aria-current={pathname === STATS_PATH ? "page" : undefined}
              className={`font-mono text-[13px] transition-colors duration-200 hover:text-teal ${
                pathname === STATS_PATH ? "text-teal" : "text-txtdim"
              }`}
            >
              Stats
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={profile.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal xl:inline"
          >
            LinkedIn
          </a>
          <a
            href={profile.socials.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal xl:inline"
          >
            GitHub
          </a>
          <a
            href={`mailto:${profile.email}`}
            aria-label={`Email ${profile.firstName}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal text-bg transition-transform duration-200 hover:-translate-y-0.5"
          >
            <FiMail className="h-4 w-4" />
          </a>

          <CommandPalette profile={profile} />
          <ThemeToggle />

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-txt transition-colors hover:border-teal hover:text-teal md:hidden"
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-bg px-6 py-6 md:hidden">
          <div className="flex items-center justify-between">
            <span className="logo font-mono text-sm font-semibold text-txt">
              {"<A/>"} {profile.firstName} <span className="text-teal">{profile.lastName}</span>
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-txt"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-8 flex flex-1 flex-col justify-center gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={handleNavClick}
                  className={`flex min-h-12 w-full items-center rounded-xl border border-line px-5 font-mono text-lg transition-colors ${
                    highlighted === link.id ? "bg-panel text-teal" : "text-txtdim"
                  }`}
                >
                  <span className="mr-3 text-txtfaint">{`0${links.indexOf(link) + 1}`}</span>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href={STATS_PATH}
                onClick={handleNavClick}
                className="flex min-h-12 w-full items-center rounded-xl border border-line px-5 font-mono text-lg text-txtdim transition-colors"
              >
                <span className="mr-3 text-txtfaint">{`0${links.length + 1}`}</span>
                Stats
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-4 font-mono text-[13px] text-txtdim">
            <a href={profile.socials.github} target="_blank" rel="noreferrer" className="hover:text-teal">
              GitHub
            </a>
            <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-teal">
              LinkedIn
            </a>
            <a href={`mailto:${profile.email}`} className="hover:text-teal">
              Email
            </a>
          </div>
        </div>
      ) : null}
    </motion.header>
  );
}
