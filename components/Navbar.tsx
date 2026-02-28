"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "Skills", href: "#skills", id: "skills" },
  { label: "Projects", href: "#projects", id: "projects" },
  { label: "Contact", href: "#contact", id: "contact" }
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sectionIds = links.map((link) => link.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

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

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="sticky top-4 z-40 mx-auto w-[min(1100px,94%)] rounded-2xl glass"
    >
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <a
          href="#home"
          onClick={handleNavClick}
          className="inline-flex min-h-11 items-center text-sm font-semibold tracking-[0.2em] text-slate-900 transition-colors dark:text-white"
        >
          AD
        </a>

        <div className="flex items-center gap-3 md:gap-6">
          <ul className="hidden items-center gap-3 text-sm md:gap-6 sm:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={handleNavClick}
                  className={`inline-flex min-h-11 items-center px-1 transition-colors duration-300 hover:text-[#4ade80] ${
                    activeSection === link.id ? "font-semibold text-[#4ade80]" : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/70 text-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100 sm:hidden"
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>

          <ThemeToggle />
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-[#0d0d0d] px-6 py-10 sm:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-[0.2em] text-white">AD</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-10 flex flex-1 flex-col justify-center gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={handleNavClick}
                  className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-lg transition-colors ${
                    activeSection === link.id ? "font-semibold text-[#4ade80]" : "text-slate-200"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </motion.header>
  );
}
