export interface Project {
  /** URL segment for /projects/[slug]. Lowercase, hyphenated, unique. */
  slug: string;
  title: string;
  /** Short label shown above the title on cards, e.g. "IoT · Full Stack". */
  category: string;
  /** One- or two-sentence summary shown on cards and as the page description. */
  tagline: string;
  problem: string;
  solution: string;
  result: string;
  stack: string[];
  features: string[];
  challenges: string[];
  /** Leave "" to hide the button. */
  repoUrl: string;
  /** Leave "" to hide the button. */
  liveUrl: string;
  /** Path under public/, e.g. "/projects/infrasense-360.png". Leave "" for no image. */
  image: string;
  /** Featured projects are listed first. */
  featured: boolean;
}

// Empty strings/arrays are hidden on the case-study page, so unfinished
// projects still render cleanly. Fill in each TODO when you're ready.
export const projects: Project[] = [
  {
    slug: "e-commerce-website",
    title: "E-Commerce Website",
    category: "Full Stack · MERN",
    tagline:
      "A full-featured e-commerce platform with product catalog, shopping cart, user authentication, and payment integration.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["MongoDB", "Express", "React", "Node.js", "Redux"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO: link to the specific repo
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "cloud-weather-monitoring",
    title: "Real Time Cloud Based Weather Monitoring",
    category: "IoT · Full Stack",
    tagline:
      "IoT system that collects weather data from multiple sensors, processes it in real-time, and displays it on a live web dashboard.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["Arduino", "ESP8266", "MQTT", "Node.js", "React"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "smart-bookmark-app",
    title: "Smart Bookmark App",
    category: "Full Stack · SaaS",
    tagline:
      "Modern web app to save, organize, and access links intelligently with real-time sync, secure auth, and seamless cross-device experience.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["Supabase", "React", "Authentication", "Cloud Storage"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "infrasense-360",
    title: "InfraSense 360",
    category: "IoT · Dashboard · Analytics",
    tagline:
      "Smart infrastructure monitoring system collecting real-time data from energy, water, carbon, and occupancy sensors with analytics dashboard.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["MQTT", "REST APIs", "Next.js", "IoT Sensors", "Cloud"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "product-catalog",
    title: "Product Catalog",
    category: "Full Stack · Web App",
    tagline:
      "Full-stack platform for businesses to manage and display products with CRUD operations, category filtering, and search functionality.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["React", "Next.js", "Node.js", "MongoDB", "REST APIs"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "fastbox-delivery-optimizer",
    title: "FastBox Delivery Optimization Simulator",
    category: "Python · Algorithms · Simulation",
    tagline:
      "Python-based logistics simulator that assigns packages to nearest agents using Euclidean distance, calculates efficiency, and generates performance reports.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["Python", "Algorithms", "JSON", "CSV", "Simulation"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "smart-cap-visually-impaired",
    title: "Smart Cap for Visually Impaired",
    category: "AI · IoT · Assistive Tech",
    tagline:
      "Assistive device using computer vision and CNN models to detect obstacles and provide real-time audio feedback to visually impaired users.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["Python", "TensorFlow", "CNN", "Arduino", "OpenCV"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  },
  {
    slug: "llm-monitoring-system",
    title: "LLM Monitoring System",
    category: "AI · Backend · Analytics",
    tagline:
      "Monitoring system to track and evaluate large language model performance with real-time insights, logs, and analytics for efficient model management.",
    problem: "", // TODO
    solution: "", // TODO
    result: "", // TODO
    stack: ["Python", "Node.js", "MongoDB", "LLM", "Analytics"],
    features: [], // TODO
    challenges: [], // TODO
    repoUrl: "", // TODO
    liveUrl: "", // TODO
    image: "", // TODO
    featured: false
  }
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Featured first, otherwise original order. */
export function getSortedProjects(): Project[] {
  return [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));
}
