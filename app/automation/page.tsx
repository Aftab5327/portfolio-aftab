import type { Metadata } from "next";
import DocPage, { readDoc } from "@/components/DocPage";
import { STATS_PATH } from "@/lib/config";

// Rendered at build time from docs/automation.md.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: readDoc("automation.md").title,
  description: "How this portfolio runs itself: GitHub sync, AI case-study drafts, screenshots, generated resume, live stats and the weekly build log.",
  alternates: { canonical: "/automation" }
};

export default function AutomationDocsPage() {
  return <DocPage file="automation.md" back={{ href: STATS_PATH, label: "back to stats" }} />;
}
