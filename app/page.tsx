import HomeSection from "@/components/HomeSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import AIChatSection from "@/components/AIChatSection";
import ContactSection from "@/components/ContactSection";
import RevealObserver from "@/components/RevealObserver";

export default function HomePage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <RevealObserver />
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
