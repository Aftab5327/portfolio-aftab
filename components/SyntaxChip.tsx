import { categorySegments, syntaxRole, type SyntaxRole } from "@/lib/categories";

// Literal class strings so Tailwind's scanner generates them.
export const ROLE_TEXT: Record<SyntaxRole, string> = {
  keyword: "text-syn-keyword",
  string: "text-syn-string",
  function: "text-syn-function",
  number: "text-syn-number",
  type: "text-syn-type",
  operator: "text-teal"
};

const ROLE_CHIP: Record<SyntaxRole, string> = {
  keyword: "border-syn-keyword/30 bg-syn-keyword/10 text-syn-keyword",
  string: "border-syn-string/30 bg-syn-string/10 text-syn-string",
  function: "border-syn-function/30 bg-syn-function/10 text-syn-function",
  number: "border-syn-number/30 bg-syn-number/10 text-syn-number",
  type: "border-syn-type/30 bg-syn-type/10 text-syn-type",
  operator: "border-teal/30 bg-teal/10 text-teal"
};

/** A stack/skill tag coloured by its category. */
export function SyntaxChip({ label, as: Tag = "span" }: { label: string; as?: "span" | "li" }) {
  return (
    <Tag className={`rounded-md border px-2.5 py-1 font-mono text-[11px] ${ROLE_CHIP[syntaxRole(label)]}`}>{label}</Tag>
  );
}

/** A project category ("IoT · Full Stack") with each part in its own syntax colour. */
export function CategoryLabel({ category, className = "" }: { category: string; className?: string }) {
  const segments = categorySegments(category);
  return (
    <span className={`font-mono ${className}`}>
      {segments.map((segment, index) => (
        <span key={segment.text}>
          {index ? <span className="text-txtfaint"> · </span> : null}
          <span className={ROLE_TEXT[segment.role]}>{segment.text}</span>
        </span>
      ))}
    </span>
  );
}
