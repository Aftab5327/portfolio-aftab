/**
 * Unit checks for the assistant's tool-call validation (lib/chat-tools.ts).
 * No network, no Groq. Usage: npm run test:chat
 */
import assert from "node:assert/strict";
import { collectActions, toolDefinitions, validateToolCall, type ToolContext } from "../lib/chat-tools";

const ctx: ToolContext = {
  firstName: "Aftab",
  email: "aftab@example.com",
  socials: { github: "https://github.com/example", linkedin: "https://www.linkedin.com/in/example" },
  projects: [
    { slug: "infrasense-360", title: "InfraSense 360" },
    { slug: "product-catalog", title: "Product Catalog" }
  ],
  sections: [
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" }
  ],
  resume: { pdf: "/resume.pdf", web: "/resume" }
};

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const call = (name: string, args: unknown) => ({ name, arguments: typeof args === "string" ? args : JSON.stringify(args) });

console.log("\nChat tool validation\n");

check("valid calls become safe actions", () => {
  assert.deepEqual(validateToolCall(call("open_project", { slug: "infrasense-360" }), ctx), {
    type: "open_project",
    label: "Open InfraSense 360",
    href: "/projects/infrasense-360",
    external: false
  });
  assert.equal(validateToolCall(call("show_section", { id: "contact" }), ctx)?.href, "/#contact");
  assert.equal(validateToolCall(call("get_resume", { format: "pdf" }), ctx)?.href, "/resume.pdf");
  assert.equal(validateToolCall(call("get_resume", { format: "web" }), ctx)?.href, "/resume");
  assert.equal(validateToolCall(call("contact", { channel: "email" }), ctx)?.href, "mailto:aftab@example.com");
  assert.equal(validateToolCall(call("contact", { channel: "linkedin" }), ctx)?.external, true);
});

const invalid: [string, ReturnType<typeof call>][] = [
  ["unknown project slug", call("open_project", { slug: "does-not-exist" })],
  ["path traversal slug", call("open_project", { slug: "../../admin" })],
  ["slug with different case", call("open_project", { slug: "InfraSense-360" })],
  ["unknown section", call("show_section", { id: "admin" })],
  ["section given as URL", call("show_section", { id: "javascript:alert(1)" })],
  ["resume format outside enum", call("get_resume", { format: "docx" })],
  ["contact channel outside enum", call("contact", { channel: "phone" })],
  ["contact channel as URL", call("contact", { channel: "https://evil.example" })],
  ["unknown tool", call("delete_everything", { confirm: true })],
  ["extra argument", call("open_project", { slug: "infrasense-360", href: "https://evil.example" })],
  ["wrong argument name", call("open_project", { project: "infrasense-360" })],
  ["non-string argument", call("open_project", { slug: 42 })],
  ["array instead of object", call("open_project", '["infrasense-360"]')],
  ["malformed JSON", call("open_project", '{"slug": "infrasense-360"')],
  ["empty arguments", call("open_project", "")],
  ["prototype pollution attempt", call("open_project", '{"__proto__": {"slug": "infrasense-360"}}')],
  ["oversized arguments", call("open_project", { slug: "x".repeat(400) })]
];

check(`${invalid.length} invalid calls are dropped`, () => {
  for (const [label, item] of invalid) assert.equal(validateToolCall(item, ctx), null, `expected "${label}" to be rejected`);
});

check("non-object call input is rejected", () => {
  assert.equal(validateToolCall(undefined as unknown as ReturnType<typeof call>, ctx), null);
  assert.equal(validateToolCall({ name: "open_project", arguments: null as unknown as string }, ctx), null);
});

check("collectActions drops invalid calls, de-duplicates and caps at 2", () => {
  const actions = collectActions(
    [
      call("open_project", { slug: "nope" }),
      call("open_project", { slug: "infrasense-360" }),
      call("open_project", { slug: "infrasense-360" }),
      call("get_resume", { format: "pdf" }),
      call("contact", { channel: "email" })
    ],
    ctx
  );
  assert.deepEqual(
    actions.map((action) => action.href),
    ["/projects/infrasense-360", "/resume.pdf"]
  );
});

check("tool definitions only offer values that exist", () => {
  const defs = toolDefinitions(ctx);
  const enumOf = (name: string) => {
    const fn = defs.find((def) => def.function.name === name)!.function.parameters;
    return Object.values(fn.properties)[0].enum;
  };
  assert.deepEqual(enumOf("open_project"), ["infrasense-360", "product-catalog"]);
  assert.deepEqual(enumOf("show_section"), ["projects", "contact"]);
  assert.deepEqual(enumOf("get_resume"), ["pdf", "web"]);
  assert.deepEqual(enumOf("contact"), ["email", "linkedin", "github"]);
});

console.log(`\n  ${passed} checks passed\n`);
