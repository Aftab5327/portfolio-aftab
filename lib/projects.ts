export type Project = {
  title: string;
  summary: string;
  stack: string[];
  link: string;
};

export const projects: Project[] = [
  {
    title: "Real Estate Website",
    summary:
      "Client project: A full stack Real Estate platform built as a freelance assignment. Includes property listings, advanced search, and fully responsive UI.",
    stack: ["React.js", "Node.js", "PostgreSQL"],
    link: "https://nr-star-ae.vercel.app"
  },
  {
    title: "Creator Landing Page",
    summary:
      "Client project: A responsive landing page built for an AI automation YouTuber. Showcases creator info, highlights services, and promotes paid courses.",
    stack: ["Next.js", "Tailwind CSS", "Framer Motion"],
    link: "https://howtoai2.vercel.app"
  },
  {
    title: "CarePulse",
    summary:
      "Hackathon project: An all-in-one healthcare platform with separate patient and admin dashboards, booking workflows, and SOS emergency alerts.",
    stack: ["Next.js", "Node.js", "AppWrite"],
    link: "https://app-carepulse.vercel.app"
  },
  {
    title: "CaseCobra",
    summary:
      "Personal project: A full stack website for creating custom phone cases with authentication, Stripe payments, and admin dashboard capabilities.",
    stack: ["Next.js", "Tailwind CSS", "Stripe", "Three.js"],
    link: "https://casecobra-a.vercel.app"
  },
  {
    title: "MeetSpace",
    summary:
      "Personal project: A full-featured meetings and video calls platform with screen sharing, recording, and collaboration workflows.",
    stack: ["Next.js", "Node.js", "WebRTC"],
    link: "https://meetspace.vercel.app"
  },
  {
    title: "3D Portfolio Website",
    summary:
      "Personal project: 3D portfolio website with multiple 3D models optimized for larger-screen devices.",
    stack: ["React", "Three.js", "Framer Motion"],
    link: "https://aftab-port.netlify.app"
  },
  {
    title: "Brainware Landing Page",
    summary:
      "Personal project: Fully responsive landing page with modern UI/UX design using key Tailwind CSS and React.js concepts.",
    stack: ["React.js", "Tailwind CSS"],
    link: "https://brainware-aftab.vercel.app"
  }
];
