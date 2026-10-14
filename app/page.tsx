import HomeSection from "@/components/HomeSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import GitHubActivity from "@/components/GitHubActivity";
import AIChatSection from "@/components/AIChatSection";
import ContactSection from "@/components/ContactSection";
import { AI_DOCS_PATH } from "@/lib/config";
import { getProfile, getProjects } from "@/lib/data";

export default function HomePage() {
  const profile = getProfile();
  const projects = getProjects();

  // Suggested chat questions built from the data (projects are already featured-first).
  const skillGroup = profile.skills.find((group) => /ai|ml|iot/i.test(group.category)) ?? profile.skills[0];
  const chatSuggestions = [
    projects[0] && `What is ${projects[0].title}?`,
    projects[1] && `What stack does ${projects[1].title} use?`,
    skillGroup && `What ${skillGroup.category} skills does ${profile.firstName} have?`,
    `How can I get ${profile.firstName}'s resume?`
  ].filter((item): item is string => Boolean(item));

  // Client components get only the fields they render, keeping the RSC payload small.
  const projectCards = projects.map(({ slug, title, category, tagline, stack, displayImage }) => ({
    slug,
    title,
    category,
    tagline,
    stack,
    displayImage
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
            stats: profile.stats
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
        <AIChatSection firstName={profile.firstName} suggestions={chatSuggestions} docsHref={AI_DOCS_PATH} />
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
