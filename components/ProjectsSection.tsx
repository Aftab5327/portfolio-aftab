"use client";

import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";

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
    <section className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="font-mono text-sm text-teal">// projects</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Things I Have Built</h2>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
            className="group flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-line bg-panel2 transition-all duration-200 hover:-translate-y-1.5 hover:border-teal/60 hover:shadow-glow"
          >
            {/* IDE window top bar */}
            <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-xs text-txtfaint">{(index + 1).toString().padStart(2, "0")}</span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <span className="font-mono text-[11px] text-teal">{project.category}</span>

              <h3 className="mt-3 font-display text-xl font-bold leading-snug text-txt">{project.title}</h3>

              <p className="mt-3 text-sm leading-relaxed text-txtdim">{project.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.techTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[11px] text-txtdim"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 font-mono text-sm text-teal transition-colors hover:text-txt"
              >
                View on GitHub
                <FiArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
