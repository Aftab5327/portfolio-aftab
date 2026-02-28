"use client";

import { motion } from "framer-motion";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap"
});

const skillGroups = [
  {
    title: "Frontend Development",
    skills: ["React.js", "Next.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS"]
  },
  {
    title: "Backend Development",
    skills: ["Node.js", "Express.js", "Python", "REST APIs"]
  },
  {
    title: "Database",
    skills: ["MongoDB", "MySQL"]
  },
  {
    title: "IoT & Embedded Systems",
    skills: ["Arduino", "ESP32", "MQTT Protocol", "Embedded C", "Sensor Integration"]
  },
  {
    title: "Tools & DevOps",
    skills: ["Git & GitHub", "Docker", "Linux", "Postman", "VS Code", "Vercel"]
  }
];

export default function SkillsSection() {
  return (
    <section className="rounded-3xl glass px-6 py-[60px] sm:px-8 sm:py-[60px] lg:px-16 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Skills & Expertise</p>
        <h1 className="fluid-subhead mt-3 font-semibold text-slate-900 dark:text-white">What I Work With</h1>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, index) => (
          <motion.article
            key={group.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
            className="rounded-2xl border border-white/10 border-l-4 border-l-emerald-400 bg-[#131313] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-1"
          >
            <h2 className={`${jetbrainsMono.className} text-base font-semibold text-emerald-300`}>{group.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
