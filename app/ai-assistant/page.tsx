import type { Metadata } from "next";
import DocPage, { readDoc } from "@/components/DocPage";

// Rendered at build time from docs/ai-assistant.md (the same file shown on GitHub).
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: readDoc("ai-assistant.md").title,
  description: "Architecture of the portfolio's AI assistant: retrieval-augmented generation, tool actions, guardrails and evaluation.",
  alternates: { canonical: "/ai-assistant" }
};

export default function AiAssistantDocsPage() {
  return <DocPage file="ai-assistant.md" back={{ href: "/#ai-chat", label: "back to the assistant" }} />;
}
