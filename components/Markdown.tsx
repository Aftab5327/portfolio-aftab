import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Mermaid from "@/components/Mermaid";

/**
 * Safe Markdown for case-study sections: GFM (tables, task lists, strikethrough),
 * no raw HTML (skipHtml), and react-markdown's default URL sanitising, so
 * `javascript:` links are dropped. ```mermaid code blocks become diagrams.
 */

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const textOf = (node: HastNode): string =>
  node.type === "text" ? node.value ?? "" : (node.children ?? []).map(textOf).join("");

const isExternal = (href?: string) => Boolean(href && /^https?:\/\//i.test(href));

const components: Components = {
  h1: ({ children }) => <h3 className="mt-6 font-display text-xl font-bold text-txt">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-6 font-display text-xl font-bold text-txt">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-6 font-display text-lg font-bold text-txt">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-5 font-semibold text-txt">{children}</h4>,
  p: ({ children }) => <p className="mt-3 text-[15px] leading-[1.75] text-txtdim first:mt-0">{children}</p>,
  ul: ({ children, className }) => (
    <ul className={`mt-3 space-y-2 text-[15px] leading-[1.75] text-txtdim ${className?.includes("contains-task-list") ? "" : "list-disc pl-5 marker:text-teal"}`}>
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-[1.75] text-txtdim marker:text-teal">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      {...(isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {})}
      className="text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-txt">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-4 border-l-2 border-teal pl-4 italic text-txtdim">{children}</blockquote>,
  hr: () => <hr className="my-6 border-line" />,
  img: ({ src, alt }) => (
    // External/remote images of unknown size, so a plain <img> rather than next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} loading="lazy" className="my-4 h-auto max-w-full rounded-xl border border-line" />
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-sm text-txtdim">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line bg-panel2 px-3 py-2 font-mono text-xs text-txt">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top">{children}</td>,
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-md border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[13px] text-txt">{children}</code>
    ),
  pre: ({ node, children }) => {
    const code = node?.children?.[0] as unknown as HastNode | undefined;
    const classes = code?.properties?.className;
    if (code?.tagName === "code" && Array.isArray(classes) && classes.includes("language-mermaid")) {
      return <Mermaid chart={textOf(code).trim()} />;
    }
    return (
      <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel2 p-4 font-mono text-[13px] leading-relaxed text-txt">
        {children}
      </pre>
    );
  }
};

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
      {children}
    </ReactMarkdown>
  );
}
