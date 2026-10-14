/** Site-level settings that aren't profile content. Safe to import from client components. */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Home-page sections, in page order. Used by the navbar and command palette. */
export const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "ai-chat", label: "AI Chat" },
  { id: "contact", label: "Contact" }
];
