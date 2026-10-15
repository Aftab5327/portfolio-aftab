import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import Markdown from "@/components/Markdown";

/** Reads docs/<file> at build time: its first "# " heading becomes the page title. */
export function readDoc(file: string): { title: string; body: string } {
  const source = readFileSync(path.join(process.cwd(), "docs", file), "utf8").replace(/^﻿/, "");
  const title = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? file;
  return { title, body: source.replace(/^#\s+.+\r?\n/, "") };
}

/** Renders a repo doc (docs/*.md) as a site page, mermaid diagrams included. */
export default function DocPage({ file, back }: { file: string; back: { href: string; label: string } }) {
  const { title, body } = readDoc(file);
  return (
    <article className="mx-auto max-w-3xl rounded-card border border-line bg-panel bg-grid px-6 py-10 shadow-soft sm:px-10 lg:py-14">
      <Link href={back.href} className="inline-flex items-center gap-2 font-mono text-sm text-txtdim transition-colors hover:text-teal">
        <FiArrowLeft aria-hidden />
        {back.label}
      </Link>
      <p className="mt-8 font-mono text-sm text-teal">{`// docs/${file}`}</p>
      <h1 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">{title}</h1>
      <div className="mt-6">
        <Markdown variant="document">{body}</Markdown>
      </div>
    </article>
  );
}
