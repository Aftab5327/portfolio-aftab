"use client";

import { motion } from "framer-motion";
import { Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap"
});

type Project = {
  title: string;
  category: string;
  description: string;
  techTags: string[];
  github: string;
};

const projects: Project[] = [
  {
    title: "E-Commerce Website",
    category: "Full Stack · MERN",
    description:
      "A full-featured e-commerce platform with product catalog, shopping cart, user authentication, and payment integration.",
    techTags: ["MongoDB", "Express", "React", "Node.js", "Redux"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "Real Time Cloud Based Weather Monitoring",
    category: "IoT · Full Stack",
    description:
      "IoT system that collects weather data from multiple sensors, processes it in real-time, and displays it on a live web dashboard.",
    techTags: ["Arduino", "ESP8266", "MQTT", "Node.js", "React"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "Smart Bookmark App",
    category: "Full Stack · SaaS",
    description:
      "Modern web app to save, organize, and access links intelligently with real-time sync, secure auth, and seamless cross-device experience.",
    techTags: ["Supabase", "React", "Authentication", "Cloud Storage"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "InfraSense 360",
    category: "IoT · Dashboard · Analytics",
    description:
      "Smart infrastructure monitoring system collecting real-time data from energy, water, carbon, and occupancy sensors with analytics dashboard.",
    techTags: ["MQTT", "REST APIs", "Next.js", "IoT Sensors", "Cloud"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "Product Catalog",
    category: "Full Stack · Web App",
    description:
      "Full-stack platform for businesses to manage and display products with CRUD operations, category filtering, and search functionality.",
    techTags: ["React", "Next.js", "Node.js", "MongoDB", "REST APIs"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "FastBox Delivery Optimization Simulator",
    category: "Python · Algorithms · Simulation",
    description:
      "Python-based logistics simulator that assigns packages to nearest agents using Euclidean distance, calculates efficiency, and generates performance reports.",
    techTags: ["Python", "Algorithms", "JSON", "CSV", "Simulation"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "Smart Cap for Visually Impaired",
    category: "AI · IoT · Assistive Tech",
    description:
      "Assistive device using computer vision and CNN models to detect obstacles and provide real-time audio feedback to visually impaired users.",
    techTags: ["Python", "TensorFlow", "CNN", "Arduino", "OpenCV"],
    github: "https://github.com/Aftab5327?tab=repositories"
  },
  {
    title: "LLM Monitoring System",
    category: "AI · Backend · Analytics",
    description:
      "Monitoring system to track and evaluate large language model performance with real-time insights, logs, and analytics for efficient model management.",
    techTags: ["Python", "Node.js", "MongoDB", "LLM", "Analytics"],
    github: "https://github.com/Aftab5327?tab=repositories"
  }
];

export default function ProjectsSection() {
  return (
    <section className="rounded-3xl glass px-6 py-[60px] sm:px-8 sm:py-[60px] lg:px-16 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Projects</p>
        <h1 className="fluid-subhead mt-3 font-semibold text-slate-900 dark:text-white">Things I Have Built</h1>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
            className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 border-t-2 border-t-transparent bg-[#131313] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:border-t-emerald-400"
          >
            <span className="absolute right-4 top-4 text-xs font-medium tracking-[0.16em] text-slate-500/70">
              {(index + 1).toString().padStart(2, "0")}
            </span>

            <span className="inline-flex w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              {project.category}
            </span>

            <h2 className={`${sora.className} mt-4 pr-10 text-xl font-bold leading-snug text-white`}>{project.title}</h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-300">{project.description}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {project.techTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-emerald-400/35 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-400/50 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors duration-200 hover:bg-emerald-500/10 sm:w-fit"
            >
              GitHub
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
