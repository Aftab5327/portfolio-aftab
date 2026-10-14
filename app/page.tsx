import HomeSection from "@/components/HomeSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import GitHubActivity from "@/components/GitHubActivity";
import AIChatSection from "@/components/AIChatSection";
import ContactSection from "@/components/ContactSection";
import { getProfile, getProjects } from "@/lib/data";

export default function HomePage() {
  const profile = getProfile();
  // Client components get only the fields they render, keeping the RSC payload small.
  const projectCards = getProjects().map(({ slug, title, category, tagline, stack }) => ({
    slug,
    title,
    category,
    tagline,
    stack
  }));

  return (
    <div className="space-y-10 md:space-y-14">
      <div id="home" className="scroll-mt-24">
        <HomeSection
          profile={{
            name: profile.name,
            firstName: profile.firstName,
            title: profile.title,
            roles: profile.roles,
            heroIntro: profile.heroIntro,
            email: profile.email,
            socials: profile.socials,
            resume: profile.resume,
            avatar: profile.avatar
          }}
        />
      </div>
      <div id="about" className="scroll-mt-24">
        <AboutSection
          profile={{
            name: profile.name,
            headline: profile.headline,
            summary: profile.summary,
            recruiterNote: profile.recruiterNote,
            interests: profile.interests,
            quote: profile.quote,
            education: profile.education,
            experience: profile.experience,
            certifications: profile.certifications,
            stats: profile.stats,
            resume: profile.resume
          }}
        />
      </div>
      <div id="skills" className="scroll-mt-24">
        <SkillsSection skills={profile.skills} />
      </div>
      <div id="projects" className="scroll-mt-24">
        <ProjectsSection projects={projectCards} />
      </div>
      {/* Renders its own wrapper (id="github") and nothing at all if the GitHub API fails. */}
      <GitHubActivity />
      <div id="ai-chat" className="scroll-mt-24">
        <AIChatSection firstName={profile.firstName} />
      </div>
      <div id="contact" className="scroll-mt-24">
        <ContactSection
          profile={{
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            socials: profile.socials
          }}
        />
      </div>
    </div>
  );
}
