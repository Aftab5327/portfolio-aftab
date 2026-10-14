"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Profile } from "@/lib/schema";

export default function SkillsSection({ skills }: { skills: Profile["skills"] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setBarsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="font-mono text-sm text-teal">{"// skills"}</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">What I Work With</h2>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((group, index) => (
          <motion.article
            key={group.category}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
            className="rounded-2xl border border-line bg-panel2 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-teal/50"
          >
            <h3 className="flex items-center gap-2 font-mono text-base font-semibold text-txt">
              <span className="text-teal">{group.glyph}</span>
              {group.category}
            </h3>

            <div className="mt-5 grid gap-3.5">
              {group.items.map((skill) => {
                const pct = skill.level;
                return (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[11px] text-txtdim">
                        {skill.name}
                      </span>
                      {pct ? <span className="font-mono text-[11px] text-teal">{pct}%</span> : null}
                    </div>
                    {pct ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg2">
                        <div
                          className="skill-bar-fill h-full rounded-full bg-gradient-to-r from-tealdim to-teal"
                          style={{ width: barsVisible ? `${pct}%` : "0%" }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
