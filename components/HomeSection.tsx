"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiMail } from "react-icons/fi";

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

const NAV = ["Home", "Projects", "Skills", "About", "Contact"];

const TECH_BADGES = [
  { name: "react", label: "React", className: "left-[-6%] top-[14%]", delay: "0s", duration: "5.5s" },
  { name: "nodejs", label: "Node.js", className: "right-[-7%] top-[8%]", delay: "0.8s", duration: "6.2s" },
  { name: "python", label: "Python", className: "right-[-10%] top-[52%]", delay: "1.4s", duration: "5.8s" },
  { name: "mongodb", label: "MongoDB", className: "right-[6%] bottom-[-6%]", delay: "0.4s", duration: "6.6s" },
  { name: "arduino", label: "Arduino", className: "left-[-2%] bottom-[6%]", delay: "1.1s", duration: "5.2s" }
];

const CODE_RAIN = `const dev = {
  name: "Aftab Dhalait",
  stack: ["React", "Next.js", "Node"],
  iot: ["Arduino", "ESP32", "MQTT"],
  build(idea) {
    return ship(idea, { tested: true });
  }
};

async function deploy(app) {
  await app.test();
  return app.ship();
}

export default function Portfolio() {
  const [ready, setReady] = useState(true);
  useEffect(() => connect("cloud"), []);
  return <Stack layers={["ui", "api", "iot"]} />;
}

while (curious) {
  learn(); build(); refactor();
}`;

export default function HomeSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentRole = useMemo(() => ROLES[roleIndex], [roleIndex]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedText.length < currentRole.length) {
      timer = setTimeout(() => setTypedText(currentRole.slice(0, typedText.length + 1)), TYPE_SPEED);
      return () => clearTimeout(timer);
    }

    if (!isDeleting && typedText === currentRole) {
      timer = setTimeout(() => setIsDeleting(true), WORD_PAUSE);
      return () => clearTimeout(timer);
    }

    if (isDeleting && typedText.length > 0) {
      timer = setTimeout(() => setTypedText(currentRole.slice(0, typedText.length - 1)), DELETE_SPEED);
      return () => clearTimeout(timer);
    }

    timer = setTimeout(() => {
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, NEXT_WORD_DELAY);

    return () => clearTimeout(timer);
  }, [currentRole, isDeleting, roleIndex, typedText]);

  return (
    <div className="relative pt-2">
      {/* faint monospace code-rain backdrop, masked to fade left → right */}
      <pre
        aria-hidden
        className="code-rain absolute -left-4 top-10 hidden text-[12px] leading-5 opacity-60 lg:block"
      >
        {CODE_RAIN}
      </pre>

      <section className="relative z-10 overflow-hidden rounded-card border border-line bg-panel shadow-card">
        {/* ── Card top bar (browser / IDE chrome) ── */}
        <div className="flex items-center justify-between gap-4 border-b border-line bg-panel2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-sm font-semibold text-txt">
              <span className="text-teal">&lt;A/&gt;</span> Aftab Dhalait
            </span>
          </div>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Hero navigation">
            {NAV.map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => scrollToSection(item.toLowerCase())}
                className={`font-mono text-[13px] transition-colors hover:text-teal ${
                  i === 0 ? "text-teal" : "text-txtdim"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
              target="_blank"
              rel="noreferrer"
              className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal sm:inline"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/Aftab5327"
              target="_blank"
              rel="noreferrer"
              className="hidden font-mono text-[13px] text-txtdim transition-colors hover:text-teal sm:inline"
            >
              GitHub
            </a>
            <a
              href="mailto:aftab.iot@gmail.com"
              aria-label="Email Aftab"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-teal text-bg transition-transform hover:-translate-y-0.5"
            >
              <FiMail className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* ── Card body: two columns ── */}
        <div className="relative grid grid-cols-1 gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-6 lg:py-16">
          {/* scattered decorative tags */}
          <span className="pointer-events-none absolute right-6 top-4 hidden font-mono text-xs text-txtfaint lg:block">
            &lt;/html&gt;
          </span>
          <span className="pointer-events-none absolute bottom-4 left-8 hidden font-mono text-xs text-txtfaint lg:block">
            &lt;body&gt;
          </span>

          {/* LEFT */}
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-sm text-txtdim">
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-green" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green" />
                </span>
                Hello, I&apos;m
              </span>
              <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-[11px] text-teal">
                // open to opportunities
              </span>
            </div>

            <h1 className="fluid-display mt-5 font-display font-extrabold tracking-tight text-txt">
              I&apos;m <span className="text-teal">Aftab</span>,
              <br />
              Full Stack Developer
            </h1>

            <p className="mt-4 min-h-[1.6rem] font-mono text-sm text-txtdim sm:text-base">
              {typedText}
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-teal align-middle" />
              <span className="ml-2 text-txtfaint">&lt;/h1&gt;</span>
            </p>

            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-txtdim">
              From crafting pixel-perfect interfaces to engineering embedded systems &mdash; I build software that lives
              in browsers, servers, and the real world. React frontends, scalable backend APIs, and IoT devices talking
              to the cloud, connected with precision and purpose.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/resume.pdf"
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-teal bg-teal/5 px-6 text-sm font-semibold text-teal transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal/15"
              >
                View my CV
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("contact")}
                className="text-sm font-medium text-txt underline decoration-teal/60 decoration-2 underline-offset-4 transition-colors hover:text-teal"
              >
                Get in touch
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative z-10 mx-auto flex w-full max-w-[360px] items-center justify-center">
            <div className="relative aspect-square w-full">
              {/* dark disc backdrop */}
              <div className="absolute inset-[8%] rounded-full bg-panel2 ring-1 ring-line" />
              <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,0.18),transparent_60%)]" />

              {/* 3D avatar cut-out — sits larger than the disc and spills over the top */}
              <Image
                className="avatar"
                src="/aftab.png"
                alt="Aftab Dhalait"
                width={300}
                height={300}
                priority
              />

              {/* floating tech badges */}
              {TECH_BADGES.map((badge) => (
                <div
                  key={badge.name}
                  className={`absolute ${badge.className} animate-float`}
                  style={{ animationDelay: badge.delay, animationDuration: badge.duration }}
                  title={badge.label}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-panel shadow-soft sm:h-14 sm:w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${badge.name}/${badge.name}-original.svg`}
                      alt={badge.label}
                      loading="lazy"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
