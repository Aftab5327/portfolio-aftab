export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

const githubUsername = "Aftab5327";

export const site = {
  name: "Aftab Dhalait",
  firstName: "Aftab",
  lastName: "Dhalait",
  title: "Full Stack Developer",
  location: "Pune, India",
  email: "aftab.iot@gmail.com",
  phone: "+91 9370312566",
  githubUsername,
  socials: {
    github: `https://github.com/${githubUsername}`,
    linkedin: "https://www.linkedin.com/in/aftab-dhalait-33821226a/",
    twitter: ""
  },
  resume: "/resume.pdf"
};

/** Home-page sections, in page order. Used by the navbar and command palette. */
export const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "ai-chat", label: "AI Chat" },
  { id: "contact", label: "Contact" }
];
