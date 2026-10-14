import HomeSection from "@/components/HomeSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import AIChatSection from "@/components/AIChatSection";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <div className="space-y-10 md:space-y-14">
      <section id="home">
        <HomeSection />
      </section>
      <section id="about">
        <AboutSection />
      </section>
      <section id="skills">
        <SkillsSection />
      </section>
      <section id="projects">
        <ProjectsSection />
      </section>
      <section id="ai-chat">
        <AIChatSection />
      </section>
      <section id="contact">
        <ContactSection />
      </section>
    </div>
  );
}
