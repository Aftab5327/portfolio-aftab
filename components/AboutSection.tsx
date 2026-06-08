"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const activities = [
  { icon: "⚡", text: "Integrating Hardware & Software" },
  { icon: "🌐", text: "Exploring New Technologies" },
  { icon: "🧩", text: "Problem Solving & System Design" },
  { icon: "🎨", text: "Designing Frontend Interfaces" },
  { icon: "🔧", text: "Building Full-Stack Applications" },
  { icon: "📊", text: "Applying Data Science" },
  { icon: "🤖", text: "AI-Powered Applications" }
];

const timeline = [
  "B.E. Electronics & Telecommunication With Honors in Data Science",
  "PG Diploma in Advanced Computing - CDAC"
];

const stats = [
  { value: "2+", label: "Years of Experience" },
  { value: "10+", label: "Projects Built" },
  { value: "3", label: "Specializations (Web · IoT · AI)" },
  { value: "2+", label: "IoT Systems Deployed" }
];

export default function AboutSection() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16"
    >
      <p className="font-mono text-sm text-teal">// about</p>
      <h2 className="fluid-heading mt-3 max-w-3xl font-display font-bold tracking-tight text-txt">
        Full Stack Developer. IoT Engineer. Business-Driven Technologist.
      </h2>

      <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-txtdim">
        <span className="rounded-md border border-line bg-panel2 px-3 py-1">
          B.E. Electronics &amp; Telecommunication · Data Science Honors
        </span>
        <span className="rounded-md border border-line bg-panel2 px-3 py-1">CDAC Advanced Computing</span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <p className="max-w-2xl text-[15px] leading-[1.75] text-txtdim">
            I&apos;m Aftab Dhalait &mdash; a Software Developer who bridges hardware and software, web and IoT,
            engineering and business.
          </p>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.75] text-txtdim">
            B.E. + CDAC. I build full-stack systems that solve real-world problems with precision and purpose.
          </p>

          <div className="mt-6 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm leading-relaxed text-txt">
            <span className="font-mono font-semibold text-teal">{"// for recruiters:"}</span> Aftab bridges hardware
            &amp; software, web &amp; IoT. B.E. + CDAC. Open to Full Stack, IoT &amp; AI roles.
          </div>

          <div className="mt-6 rounded-xl border border-line bg-panel2 p-5">
            <h3 className="font-mono text-sm text-teal">{"<> activities I love"}</h3>
            <div className="mt-4 space-y-3">
              {activities.map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-txtdim">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-teal/10">
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <blockquote className="mt-6 border-l-2 border-teal pl-5 font-display text-lg italic leading-relaxed text-txt">
            &quot;Most developers live in one world - web or hardware. I chose to master both.&quot;
          </blockquote>
          <p className="mt-2 font-mono text-sm text-txtdim">— Aftab Dhalait</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="space-y-6"
        >
          <div className="rounded-xl border border-line bg-panel2 p-5">
            <h3 className="font-mono text-sm text-teal">{"// education timeline"}</h3>
            <div className="relative mt-5 space-y-5">
              <div className="absolute bottom-1 left-[5px] top-1 w-px bg-line" />
              {timeline.map((item) => (
                <div key={item} className="relative pl-7">
                  <span className="absolute left-0 top-1.5 inline-flex h-2.5 w-2.5 rounded-full border border-teal bg-teal/30" />
                  <p className="text-sm leading-relaxed text-txtdim">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel2 p-5">
            <h3 className="font-mono text-sm text-teal">{"{ } quick stats"}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-panel p-4">
                  <p className="font-display text-3xl font-bold leading-none text-teal">{item.value}</p>
                  <p className="mt-2 text-xs leading-relaxed text-txtdim">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="inline-flex min-h-12 items-center rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Hire Me
            </button>
            <Link
              href="/resume.pdf"
              className="inline-flex min-h-12 items-center rounded-xl border border-line bg-panel px-6 text-sm font-medium text-txt transition duration-200 hover:-translate-y-0.5 hover:border-teal hover:text-teal"
            >
              Download Resume
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
