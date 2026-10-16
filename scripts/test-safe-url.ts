/**
 * Proves that stored/AI-generated URLs can't become script links: malicious inputs are dropped by
 * lib/safe-url.ts, by the build-log frontmatter schema, by chat actions, and in rendered Markdown.
 *
 * Usage: npm run test:safe-url
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "../components/Markdown";
import { buildLogFrontmatterSchema } from "../lib/build-log";
import { collectActions, type ToolContext } from "../lib/chat-tools";
import { internalPath, safeActionHref, safeImageSrc, safeInternalHref, safeLiveUrl, safeMarkdownUrl, safeUrl } from "../lib/safe-url";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const MALICIOUS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  " javascript:alert(1)",
  "\tjavascript:alert(1)",
  "java\tscript:alert(1)",
  "java\nscript:alert(1)",
  "javascript\u0000:alert(1)",
  "\u0001javascript:alert(1)",
  "javascript:%61lert(1)",
  "%6Aavascript:alert(1)",
  "&#106;avascript:alert(1)",
  "&#x6A;avascript:alert(1)",
  "jav&#x09;ascript:alert(1)",
  "javascript&colon;alert(1)",
  "vbscript:msgbox(1)",
  "data:text/html,<script>alert(1)</script>",
  "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  "DATA:image/svg+xml,<svg onload=alert(1)>",
  "//evil.com",
  "//evil.com/x",
  "/\\evil.com",
  "\\\\evil.com",
  "/%2F%2Fevil.com",
  "/%5Cevil.com",
  "/%2f%2fevil.com",
  "/%E0%A4%A",
  "http://github.com/Aftab5327",
  "https://evil.com/github.com",
  "https://github.com.evil.com/x",
  "https://evilgithub.com/x",
  "https://github.com@evil.com/x",
  "https://user:pass@github.com/x",
  "https://github.com:8443/x",
  `https://github.com/x${String.fromCharCode(0x2028)}`, // line separator
  "file:///etc/passwd",
  "ftp://github.com/x",
  "mailto:someone@evil.com?body=<script>",
  "evil.com",
  "",
  "   "
];

console.log("\nsafe-url: malicious inputs are dropped\n");

check("safeUrl drops every malicious input (default policy)", () => {
  for (const input of MALICIOUS) assert.equal(safeUrl(input), null, `should drop ${JSON.stringify(input)}`);
});

check("safeImageSrc drops every malicious input", () => {
  for (const input of MALICIOUS) assert.equal(safeImageSrc(input), null, `should drop ${JSON.stringify(input)}`);
});

check("safeInternalHref drops every malicious input and any absolute URL", () => {
  for (const input of [...MALICIOUS, "https://github.com/Aftab5327"]) assert.equal(safeInternalHref(input), null, `should drop ${JSON.stringify(input)}`);
});

check("safeActionHref drops every malicious input (owner email set)", () => {
  for (const input of MALICIOUS) assert.equal(safeActionHref(input, "aftab.iot@gmail.com"), null, `should drop ${JSON.stringify(input)}`);
});

check("safeMarkdownUrl turns every malicious scheme / protocol-relative input into an empty href", () => {
  const schemeOrHostTricks = MALICIOUS.filter((input) => !input.startsWith("https://") || /@|:\d|\s/.test(input));
  for (const input of schemeOrHostTricks) assert.equal(safeMarkdownUrl(input), "", `should drop ${JSON.stringify(input)}`);
});

check("safeLiveUrl allows demos on any https host", () => {
  assert.equal(safeLiveUrl("https://pulsegrid-xi.vercel.app"), "https://pulsegrid-xi.vercel.app/");
  assert.equal(safeLiveUrl("https://pulsegrid-xi.vercel.app/dashboard?tab=live"), "https://pulsegrid-xi.vercel.app/dashboard?tab=live");
  assert.equal(safeLiveUrl("https://aftab5327.github.io/demo/"), "https://aftab5327.github.io/demo/");
});

check("safeLiveUrl still drops every malicious input (only plain other-host https URLs are now valid)", () => {
  const otherHostOnly = new Set(["https://evil.com/github.com", "https://github.com.evil.com/x", "https://evilgithub.com/x"]);
  for (const input of MALICIOUS.filter((value) => !otherHostOnly.has(value))) {
    assert.equal(safeLiveUrl(input), null, `should drop ${JSON.stringify(input)}`);
  }
  for (const input of [
    "http://pulsegrid-xi.vercel.app",
    "https://user:pass@pulsegrid-xi.vercel.app",
    "https://pulsegrid-xi.vercel.app@evil.com",
    "https://pulsegrid-xi.vercel.app:8443/",
    "/projects/pulsegrid",
    "//pulsegrid-xi.vercel.app",
    " https://pulsegrid-xi.vercel.app",
    "https://pulsegrid-xi.vercel.app/\tx"
  ]) {
    assert.equal(safeLiveUrl(input), null, `should drop ${JSON.stringify(input)}`);
  }
});

check("repo links stay GitHub-only", () => {
  assert.equal(safeUrl("https://pulsegrid-xi.vercel.app"), null);
  assert.equal(safeUrl("https://github.com/Aftab5327/pulsegrid"), "https://github.com/Aftab5327/pulsegrid");
});

check("non-string values are dropped", () => {
  for (const input of [undefined, null, 42, {}, ["https://github.com"], new URL("https://github.com")]) assert.equal(safeUrl(input), null);
});

check("legitimate links still pass", () => {
  assert.equal(safeUrl("https://github.com/Aftab5327/portfolio-aftab/commit/abc1234"), "https://github.com/Aftab5327/portfolio-aftab/commit/abc1234");
  assert.equal(safeUrl("https://GitHub.com/Aftab5327"), "https://github.com/Aftab5327");
  assert.equal(safeUrl("/projects/smart-bookmark-app"), "/projects/smart-bookmark-app");
  assert.equal(safeUrl("/#about"), "/#about");
  assert.equal(safeInternalHref("/projects/infrasense-360#challenges"), "/projects/infrasense-360#challenges");
  assert.equal(safeImageSrc("/screenshots/smart-bookmark-app.png"), "/screenshots/smart-bookmark-app.png");
  assert.equal(safeImageSrc("https://raw.githubusercontent.com/Aftab5327/x/main/shot.png"), "https://raw.githubusercontent.com/Aftab5327/x/main/shot.png");
  assert.equal(safeActionHref("mailto:aftab.iot@gmail.com", "aftab.iot@gmail.com"), "mailto:aftab.iot@gmail.com");
  assert.equal(safeActionHref("https://www.linkedin.com/in/aftab"), "https://www.linkedin.com/in/aftab");
  assert.equal(safeMarkdownUrl("https://lucaong.github.io/minisearch/"), "https://lucaong.github.io/minisearch/");
  assert.equal(safeMarkdownUrl("#challenges"), "#challenges");
});

check("safeActionHref only allows mailto: for the owner's address when one is given", () => {
  assert.equal(safeActionHref("mailto:attacker@evil.com", "aftab.iot@gmail.com"), null);
});

check("internalPath encodes stored slugs so they can't change the path", () => {
  assert.equal(internalPath("log", "2026-w41"), "/log/2026-w41");
  assert.equal(internalPath("log", "javascript:alert(1)"), "/log/javascript%3Aalert(1)");
  assert.equal(internalPath("log", "../../evil"), "/log/..%2F..%2Fevil");
  assert.equal(internalPath("projects", "//evil.com"), "/projects/%2F%2Fevil.com");
  assert.ok(safeInternalHref(internalPath("log", "//evil.com")) !== null, "encoded slug stays a same-site path");
});

console.log("\nbuild-log frontmatter: malicious commit URLs are rejected\n");

const validPost = {
  title: "Week of shipping",
  date: "2026-10-12",
  weekStart: "2026-10-05",
  weekEnd: "2026-10-11",
  repos: ["portfolio-aftab"],
  commitCount: 1,
  aiGenerated: true,
  model: "llama-3.1-8b-instant",
  commits: [{ repo: "portfolio-aftab", sha: "abc1234", url: "https://github.com/Aftab5327/portfolio-aftab/commit/abc1234", message: "feat: x", date: "2026-10-06" }]
};

check("a valid post parses", () => {
  assert.equal(buildLogFrontmatterSchema.safeParse(validPost).success, true);
});

check("every malicious commit URL fails validation (z.string().url() alone accepted javascript:)", () => {
  for (const url of MALICIOUS) {
    const result = buildLogFrontmatterSchema.safeParse({ ...validPost, commits: [{ ...validPost.commits[0], url }] });
    assert.equal(result.success, false, `should reject ${JSON.stringify(url)}`);
  }
});

check("repository names with markup are rejected", () => {
  assert.equal(buildLogFrontmatterSchema.safeParse({ ...validPost, repos: ["<img src=x onerror=alert(1)>"] }).success, false);
});

console.log("\nchat actions: poisoned config never reaches a chip\n");

const ctx: ToolContext = {
  firstName: "Aftab",
  email: "aftab.iot@gmail.com",
  socials: { github: "javascript:alert(1)", linkedin: "data:text/html,<script>alert(1)</script>" },
  projects: [{ slug: "smart-bookmark-app", title: "Smart Bookmark App" }],
  sections: [{ id: "about", label: "About" }],
  resume: { pdf: "/resume.pdf", web: "/resume" }
};

check("contact chips with malicious social URLs are dropped; valid ones survive", () => {
  const actions = collectActions(
    [
      { name: "contact", arguments: '{"channel":"github"}' },
      { name: "contact", arguments: '{"channel":"linkedin"}' },
      { name: "open_project", arguments: '{"slug":"smart-bookmark-app"}' }
    ],
    ctx,
    5
  );
  assert.deepEqual(actions.map((a) => a.href), ["/projects/smart-bookmark-app"]);
});

console.log("\nrendered Markdown: no script URL reaches the HTML\n");

check("links and images with malicious URLs render without href/src", () => {
  const source = [
    ...MALICIOUS.filter((input) => !/[\s()\x00-\x1f]/.test(input) && input).map((input, i) => `[link ${i}](${input}) ![img ${i}](${input})`),
    "[raw](<javascript:alert(1)>)",
    "<a href=\"javascript:alert(1)\">raw html</a> <img src=x onerror=alert(1)> <script>alert(1)</script>",
    "[ok](https://github.com/Aftab5327) [internal](/resume)"
  ].join("\n\n");
  const html = renderToStaticMarkup(createElement(Markdown, null, source));
  assert.ok(!/javascript:|vbscript:|data:|href="\/\/|src="\/\/|onerror|<script/i.test(html), `unsafe output:\n${html}`);
  assert.ok(!/href=""/.test(html) && !/src=""/.test(html), "dropped URLs must not leave empty href/src");
  assert.ok(html.includes('href="https://github.com/Aftab5327"') && html.includes('href="/resume"'), "legitimate links must survive");
});

console.log(`\n${passed} checks passed\n`);
