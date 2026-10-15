"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Renders a mermaid diagram client-side. The mermaid library (~1 MB) is loaded
 * with a dynamic import, so it's only downloaded on pages that contain a diagram.
 * Until it renders (or if the diagram is invalid) the source is shown as code.
 */
export default function Mermaid({ chart }: { chart: string }) {
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "light" ? "neutral" : "dark",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace"
        });
        await mermaid.parse(chart);
        const { svg: rendered } = await mermaid.render(`mermaid-${baseId}-${Date.now()}`, chart);
        if (!cancelled) {
          setSvg(rendered);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baseId, chart, resolvedTheme]);

  if (svg && !failed) {
    return (
      <div
        role="img"
        aria-label="Architecture diagram"
        className="my-5 overflow-x-auto rounded-xl border border-line bg-panel2 p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
        // Mermaid output is sanitised (securityLevel: "strict" runs DOMPurify).
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <div className="my-5">
      <pre className="overflow-x-auto rounded-xl border border-line bg-panel2 p-4 font-mono text-[13px] leading-relaxed text-txtdim">
        <code>{chart}</code>
      </pre>
      {failed ? <p className="mt-2 font-mono text-[11px] text-txtdim">Diagram could not be rendered; showing source.</p> : null}
    </div>
  );
}
