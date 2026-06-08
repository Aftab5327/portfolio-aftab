"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX, FiMail } from "react-icons/fi";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "Skills", href: "#skills", id: "skills" },
  { label: "Projects", href: "#projects", id: "projects" },
  { label: "AI Chat", href: "#ai-chat", id: "ai-chat" },
  { label: "Contact", href: "#contact", id: "contact" }
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleNavClick = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-[min(1180px,92%)] items-center justify-between py-4">
        <a
          href="#home"
          onClick={handleNavClick}
          className="logo font-mono text-sm font-semibold tracking-tight text-txt transition-colors"
        >
          {"<A/>"} Aftab <span className="text-teal">Dhalait</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={handleNavClick}
                className={`font-mono text-[13px] transition-colors duration-200 hover:text-teal ${
                  activeSection === link.id ? "text-teal" : "text-txtdim"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal lg:inline"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/Aftab5327"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal lg:inline"
          >
            GitHub
          </a>
          <a
            href="mailto:aftab.iot@gmail.com"
            aria-label="Email Aftab"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal text-bg transition-transform duration-200 hover:-translate-y-0.5"
          >
            <FiMail className="h-4 w-4" />
          </a>

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
              {"<A/>"} Aftab <span className="text-teal">Dhalait</span>
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
                    activeSection === link.id ? "bg-panel text-teal" : "text-txtdim"
                  }`}
                >
                  <span className="mr-3 text-txtfaint">{`0${links.indexOf(link) + 1}`}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4 font-mono text-[13px] text-txtdim">
            <a href="https://github.com/Aftab5327" target="_blank" rel="noreferrer" className="hover:text-teal">
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal"
            >
              LinkedIn
            </a>
            <a href="mailto:aftab.iot@gmail.com" className="hover:text-teal">
              Email
            </a>
          </div>
        </div>
      ) : null}
    </motion.header>
  );
}
