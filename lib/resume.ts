/**
 * Resume data assembled from the same sources as the website (lib/data.ts), so
 * the PDF (/resume.pdf), web (/resume) and JSON Resume (/resume.json) versions
 * always match the site. Empty sections come back as empty arrays/strings and
 * every renderer omits them.
 */
import { RESUME_PAGE_PATH, siteUrl } from "@/lib/config";
import { getProfile, getProjects } from "@/lib/data";

export type ResumeLink = { label: string; url: string };

export type Resume = {
  name: string;
  title: string;
  contact: {
    email: string;
    /** "" unless profile.resume.showPhone is true. */
    phone: string;
    location: string;
    links: ResumeLink[];
  };
  summary: string;
  experience: {
    role: string;
    company: string;
    location: string;
    start: string;
    end: string;
    summary: string;
    highlights: string[];
  }[];
  projects: {
    title: string;
    tagline: string;
    bullet: string;
    stack: string[];
    link: ResumeLink;
  }[];
  skills: { category: string; items: string[] }[];
  education: { degree: string; detail: string; institution: string; year: string }[];
  certifications: { name: string; issuer: string; year: string; url: string }[];
  extraSections: { title: string; items: string[] }[];
  meta: {
    /** ISO time the resume was generated (build time for the static routes). */
    generatedAt: string;
    /** Public site URL, "" when only a localhost fallback is configured. */
    siteUrl: string;
    pageUrl: string;
    fileName: string;
  };
};

/** True when NEXT_PUBLIC_SITE_URL points somewhere a recruiter can actually open. */
const publicSiteUrl = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(siteUrl) ? "" : siteUrl;

/** "https://github.com/Aftab5327/" → "github.com/Aftab5327" (full URL stays visible for ATS parsers). */
export const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");

const link = (url: string): ResumeLink => ({ label: displayUrl(url), url });

export function buildResume(): Resume {
  const profile = getProfile();
  const settings = profile.resume;

  const links = [
    publicSiteUrl,
    profile.socials.linkedin,
    profile.socials.github,
    profile.socials.twitter
  ]
    .filter(Boolean)
    .map(link);

  // Projects are already sorted featured → order → most recent push.
  const projects = getProjects()
    .slice(0, settings.projectLimit)
    .map((project) => {
      const caseStudyUrl = publicSiteUrl ? `${publicSiteUrl}/projects/${project.slug}` : "";
      return {
        title: project.title,
        tagline: project.tagline,
        bullet: project.resumeBullet,
        stack: project.stack,
        link: link(project.liveUrl || project.repoUrl || caseStudyUrl)
      };
    })
    .map((project) => (project.link.url ? project : { ...project, link: { label: "", url: "" } }));

  return {
    name: profile.name,
    title: profile.title,
    contact: {
      email: profile.email,
      phone: settings.showPhone ? profile.phone : "",
      location: profile.location,
      links
    },
    summary: profile.summary.join(" "),
    experience: profile.experience.map((item) => ({ ...item })),
    projects,
    skills: profile.skills.map((group) => ({ category: group.category, items: group.items.map((item) => item.name) })),
    education: profile.education.map((item) => ({
      degree: item.degree,
      detail: item.detail,
      institution: item.institution,
      year: item.year ?? ""
    })),
    certifications: profile.certifications.map((cert) => ({ ...cert })),
    extraSections: settings.extraSections,
    meta: {
      generatedAt: new Date().toISOString(),
      siteUrl: publicSiteUrl,
      pageUrl: publicSiteUrl ? `${publicSiteUrl}${RESUME_PAGE_PATH}` : "",
      fileName: `${profile.firstName}-Resume.pdf`
    }
  };
}

/** "B.E. Electronics & Telecommunication with Honors in Data Science, CDAC · 2023" */
export const educationLine = (item: Resume["education"][number]) =>
  [[item.degree, item.detail].filter(Boolean).join(" "), item.institution, item.year].filter(Boolean).join(", ");

/** "Pune · Jan 2024 – Present" */
export const experienceMeta = (item: Resume["experience"][number]) =>
  [item.location, `${item.start} – ${item.end}`].filter(Boolean).join(" · ");

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
