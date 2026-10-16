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
          // A concrete system stack: the SVG is shown as an <img>, which can't use the page's web fonts,
          // so measuring and drawing must use the same font.
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
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
    // The diagram source can come from stored/AI-drafted content, so its SVG is never injected into the
    // DOM: as an <img> it can't run scripts or event handlers whatever it contains.
    const maxWidth = Number(/max-width:\s*([\d.]+)px/.exec(svg)?.[1]) || undefined;
    return (
      <div className="my-5 overflow-x-auto rounded-xl border border-line bg-panel2 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL, not an optimisable asset */}
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          alt="Architecture diagram"
          className="mx-auto h-auto w-full"
          style={{ maxWidth }}
        />
      </div>
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
