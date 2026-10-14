import HomeSection from "@/components/HomeSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import GitHubActivity from "@/components/GitHubActivity";
import AIChatSection from "@/components/AIChatSection";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <div className="space-y-10 md:space-y-14">
      <div id="home" className="scroll-mt-24">
        <HomeSection />
      </div>
      <div id="about" className="scroll-mt-24">
        <AboutSection />
      </div>
      <div id="skills" className="scroll-mt-24">
        <SkillsSection />
      </div>
      <div id="projects" className="scroll-mt-24">
        <ProjectsSection />
      </div>
      {/* Renders its own wrapper (id="github") and nothing at all if the GitHub API fails. */}
      <GitHubActivity />
      <div id="ai-chat" className="scroll-mt-24">
        <AIChatSection />
      </div>
      <div id="contact" className="scroll-mt-24">
        <ContactSection />
      </div>
    </div>
  );
}
