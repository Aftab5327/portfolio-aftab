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
        // Mermaid needs concrete colours, so read the active theme tokens from the page.
        const css = getComputedStyle(document.documentElement);
        const token = (name: string) => css.getPropertyValue(name).trim();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            darkMode: resolvedTheme !== "light",
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            background: token("--bg-2"),
            primaryColor: token("--panel-2"),
            primaryTextColor: token("--txt"),
            primaryBorderColor: token("--teal"),
            secondaryColor: token("--panel"),
            secondaryTextColor: token("--txt"),
            secondaryBorderColor: token("--line-strong"),
            tertiaryColor: token("--bg-2"),
            tertiaryTextColor: token("--txt"),
            tertiaryBorderColor: token("--line-strong"),
            lineColor: token("--txt-dim"),
            textColor: token("--txt"),
            clusterBkg: token("--bg-2"),
            clusterBorder: token("--line-strong"),
            edgeLabelBackground: token("--panel"),
            noteBkgColor: token("--panel-2"),
            noteTextColor: token("--txt"),
            noteBorderColor: token("--accent-2"),
            actorBkg: token("--panel-2"),
            actorBorder: token("--teal"),
            actorTextColor: token("--txt"),
            signalColor: token("--txt-dim"),
            signalTextColor: token("--txt")
          }
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
        className="my-5 overflow-x-auto rounded-xl border border-line bg-bg2 bg-grid p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
        // Mermaid output is sanitised (securityLevel: "strict" runs DOMPurify).
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <div className="my-5">
      <pre className="overflow-x-auto rounded-xl border border-line border-l-2 border-l-teal bg-bg2 p-4 font-mono text-[13px] leading-relaxed text-txtdim">
        <code>{chart}</code>
      </pre>
      {failed ? <p className="mt-2 font-mono text-[11px] text-txtdim">Diagram could not be rendered; showing source.</p> : null}
    </div>
  );
}
