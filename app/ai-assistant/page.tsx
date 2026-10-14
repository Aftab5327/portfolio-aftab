import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import Markdown from "@/components/Markdown";

// Rendered at build time from docs/ai-assistant.md (the same file shown on GitHub).
export const dynamic = "force-static";

const source = readFileSync(path.join(process.cwd(), "docs", "ai-assistant.md"), "utf8");
const title = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? "How the AI assistant works";
const body = source.replace(/^#\s+.+\r?\n/, "");

export const metadata: Metadata = {
  title,
  description: "Architecture of the portfolio's AI assistant: retrieval-augmented generation, tool actions, guardrails and evaluation.",
  alternates: { canonical: "/ai-assistant" }
};

export default function AiAssistantDocsPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10 lg:py-14">
      <Link href="/#ai-chat" className="inline-flex items-center gap-2 font-mono text-sm text-txtdim transition-colors hover:text-teal">
        <FiArrowLeft aria-hidden />
        back to the assistant
      </Link>
      <p className="mt-8 font-mono text-sm text-teal">{"// docs/ai-assistant.md"}</p>
      <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">{title}</h1>
      <div className="mt-6">
        <Markdown variant="document">{body}</Markdown>
      </div>
    </article>
  );
}
