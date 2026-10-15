# Terminal theme redesign: review notes

Visual-only redesign ("engineering terminal"). No feature or content changes. The site should feel like
an IDE or monitoring console: near-black surfaces, one electric accent (cyan), an editor syntax palette
for categories, monospace metadata, and a faint grid. Glow appears only where it carries meaning.

Before/after screenshots are local and not in git: `before/`, `after/` and the side-by-side `pairs/`,
for 6 pages × dark/light × 375/1440 px.

## Visual changes

**Palette and surfaces**
- Every colour now comes from tokens in `app/globals.css`. Components contain no hex.
- Dark is the default theme:
  - Surfaces: bg `#0a0e14`, panel `#111823`, panel-raised `#16202d`, border `#1e2a3a`.
  - Text: `#e6edf3`, with muted `#9aa7b5`.
  - Accent: `#22d3ee`. It replaces the old teal everywhere.
- Light is a deliberate light IDE theme:
  - Surfaces: canvas `#f7f9fb`, white panels.
  - Text: dark ink.
  - Accent: `#0d6a83`. This is cyan `#0e7490`, darkened so it also passes 4.5:1 on its own tint.
- New tokens:
  - Colours: accent-2, warning, panel-raised, recessed bg-2, the syntax palette, and line-strong for control borders.
  - Background helpers: `--grid-line`, `--halo`.
  - Glow: `--glow` / `--glow-color`.
- The ambient teal radial glows behind the page are removed. They are replaced by a 1px grid at about 4% opacity (`bg-grid`) on the page, the hero and every section panel.
- The hero avatar backdrop is a neutral halo instead of a teal glow.
- The "traffic light" dots on IDE window bars now use the danger, warning and success tokens.

**Category colours (syntax palette).** Each label gets its colour from `lib/categories.ts`, so the same technology has the same colour everywhere.

| Role | Dark | Light | Used for |
|---|---|---|---|
| keyword | `#c792ea` | `#7637e1` | AI / ML (TensorFlow, OpenCV, CNN, LLM) |
| string | `#c3e88d` | `#396e0b` | Frontend & web (React, Next.js, Full Stack, SaaS) |
| function | `#82aaff` | `#1d4ed8` | Backend & APIs (Node.js, Express, Python, REST) |
| number | `#f78c6c` | `#ad3a0b` | IoT & embedded (Arduino, ESP32, MQTT, sensors) |
| type | `#ffcb6b` | `#825b00` | Data & analytics (MongoDB, MySQL, Supabase, Analytics) |
| accent | `#22d3ee` | `#0d6a83` | Tooling, DevOps & cloud (Git, Docker, Vercel, Cloud) |

Where the colours apply:
- Project cards: the category label is coloured per segment ("IoT · Full Stack") and stack tags are chips.
- Case-study header and sidebar.
- Skill chips and skill-group glyphs.
- GitHub repo language dots.
- /stats language bar and legend. These replace GitHub's linguist colours, and bar segments get 1px separators.
- Case-study language bar.
- Command-palette group labels: Navigate = function, Actions = keyword, Links = string.

**Tints now enabled.** These 37 opacity classes were no-ops under Tailwind 3 and now render, all pointing at the new accent:
- Hero "open to opportunities" badge, plus the CV button wash and its hover.
- "Get in touch" underline.
- Scrolled navbar background (`bg-bg/80` behind the blur).
- Chat: your message bubbles, action chips, the stop button hover.
- Contact: card icons and social icons.
- About: the recruiter note, the activities icons, the timeline dots.
- Build-log week badge and admin "new" badge.
- Markdown link underline.
- Placeholder-card corner glow.
- Hover borders on project, skill, repo and build-log cards.
- `focus:ring-teal/40` on inputs.
- Spinner track.

**Glow is used only in four places:**
- Focus rings: an accent outline plus a soft glow on every focusable element, with input rings in the accent.
- Primary buttons on hover (`glow-hover`): View my CV, Live demo, Send, Send message, Download PDF, and the mail buttons.
- The active nav item, as a subtle text glow (section links, Stats, mobile menu).
- Live "Up" dots on /stats: a steady glow plus a pulse that stops under `prefers-reduced-motion`.

The glow transition is disabled under reduced motion. Glow removed elsewhere:
- The project-card hover glow (`shadow-glow`). The card hover is now the accent border.
- The pulsing ring on the hero's "Hello, I'm" dot. The dot is now steady.
- The "brightness" hover on filled buttons.

**Monospace for metadata.** Section labels, dates, tags and badges were already monospace. These are new:
- /stats numbers (metrics and Lighthouse score rings).
- The About "quick stats" numbers.

**Details**
- Text selection, the text caret and scrollbars (Firefox `scrollbar-color` plus WebKit) use the accent and line-strong colours.
- Code blocks use a recessed bg-2 surface with an accent left rule. Inline code uses the syntax "string" colour. Table headers use bg-2.
- Mermaid diagrams use the `base` theme fed from the live tokens. Nodes are panel-raised with an accent border, clusters are recessed, and edges are muted. They re-render when the theme changes.
- Interactive control borders use line-strong (≥3:1) instead of the decorative 1.2:1 line:
  - Icon buttons: theme toggle, menu, footer socials.
  - Secondary buttons, inputs and selects.
  - The palette trigger and chat suggestions.
  - Clickable cards: project, repo and build-log cards.
- `<meta name="theme-color">` is now `#0a0e14` (dark) and `#f7f9fb` (light), from `lib/theme.ts`.
- Project placeholder card: recessed surface, grid, accent `</>`, syntax-coloured category.
- There is no generated OG image in the repo (pages use the screenshot or nothing), so there were no OG colours to update.

**Unchanged**
- The resume PDF (`lib/resume-pdf.tsx`) is black-on-white.
- `/resume` print, and print in general. The new tokens print as ink, and the grid and glow are switched off in `@media print`.

## Contrast

Ratios are for each text colour against every surface it can appear on. Accent, status and syntax colours
are also checked on their own 10% tint (chips, badges, bubbles). The table is generated from the tokens;
`*` means the worst of the four surfaces.

**Dark (default)**

| Foreground | Hex | bg #0a0e14 | bg-2 #0d1219 | panel #111823 | panel-raised #16202d | own 10% tint* | Min | Need |
|---|---|---:|---:|---:|---:|---:|---:|---|
| text | `#e6edf3` | 16.37 | 15.90 | 15.08 | 13.90 | – | **13.90** | 4.5 |
| text-muted | `#9aa7b5` | 7.89 | 7.67 | 7.27 | 6.70 | – | **6.70** | 4.5 |
| text-faint | `#7c8894` | 5.35 | 5.19 | 4.93 | 4.54 | – | **4.54** | 4.5 |
| accent | `#22d3ee` | 10.70 | 10.40 | 9.86 | 9.09 | 7.42 | **7.42** | 4.5 |
| accent-2 | `#a78bfa` | 7.11 | 6.90 | 6.55 | 6.04 | 5.13 | **5.13** | 4.5 |
| success | `#4ade80` | 11.10 | 10.78 | 10.22 | 9.43 | 7.67 | **7.67** | 4.5 |
| warning | `#fbbf24` | 11.59 | 11.26 | 10.67 | 9.84 | 8.01 | **8.01** | 4.5 |
| danger | `#f87171` | 6.99 | 6.79 | 6.44 | 5.94 | 5.18 | **5.18** | 4.5 |
| keyword | `#c792ea` | 8.04 | 7.81 | 7.40 | 6.83 | 5.78 | **5.78** | 4.5 |
| string | `#c3e88d` | 14.04 | 13.64 | 12.94 | 11.93 | 9.34 | **9.34** | 4.5 |
| function | `#82aaff` | 8.42 | 8.18 | 7.76 | 7.15 | 5.96 | **5.96** | 4.5 |
| number | `#f78c6c` | 8.22 | 7.98 | 7.57 | 6.98 | 5.93 | **5.93** | 4.5 |
| type | `#ffcb6b` | 12.90 | 12.53 | 11.88 | 10.95 | 8.76 | **8.76** | 4.5 |
| line-strong (controls) | `#5e6b7a` | 3.55 | 3.45 | 3.27 | 3.02 | – | **3.02** | 3 (UI) |
| line (decorative) | `#1e2a3a` | 1.33 | 1.30 | 1.23 | 1.13 | – | **1.13** | decorative, exempt |
| button text on accent | `#0a0e14` on `#22d3ee` |  |  |  |  | – | **10.70** | 4.5 |

**Light**

| Foreground | Hex | bg #f7f9fb | bg-2 #eef2f6 | panel #ffffff | panel-raised #f3f6f9 | own 10% tint* | Min | Need |
|---|---|---:|---:|---:|---:|---:|---:|---|
| text | `#0f172a` | 16.92 | 15.87 | 17.85 | 16.46 | – | **15.87** | 4.5 |
| text-muted | `#475467` | 7.28 | 6.83 | 7.69 | 7.09 | – | **6.83** | 4.5 |
| text-faint | `#646f7f` | 4.83 | 4.53 | 5.09 | 4.70 | – | **4.53** | 4.5 |
| accent | `#0d6a83` | 5.84 | 5.48 | 6.16 | 5.68 | 4.76 | **4.76** | 4.5 |
| accent-2 | `#6d28d9` | 6.73 | 6.32 | 7.10 | 6.55 | 5.39 | **5.39** | 4.5 |
| success | `#127136` | 5.78 | 5.42 | 6.10 | 5.63 | 4.72 | **4.72** | 4.5 |
| warning | `#8f5206` | 5.89 | 5.53 | 6.22 | 5.73 | 4.82 | **4.82** | 4.5 |
| danger | `#b91c1c` | 6.13 | 5.75 | 6.47 | 5.97 | 4.89 | **4.89** | 4.5 |
| keyword | `#7637e1` | 5.85 | 5.48 | 6.17 | 5.69 | 4.73 | **4.73** | 4.5 |
| string | `#396e0b` | 5.84 | 5.48 | 6.16 | 5.68 | 4.79 | **4.79** | 4.5 |
| function | `#1d4ed8` | 6.35 | 5.96 | 6.70 | 6.18 | 5.15 | **5.15** | 4.5 |
| number | `#ad3a0b` | 5.88 | 5.51 | 6.20 | 5.72 | 4.77 | **4.77** | 4.5 |
| type | `#825b00` | 5.77 | 5.42 | 6.09 | 5.62 | 4.73 | **4.73** | 4.5 |
| line-strong (controls) | `#818c9b` | 3.23 | 3.03 | 3.41 | 3.14 | – | **3.03** | 3 (UI) |
| line (decorative) | `#d9e0e8` | 1.26 | 1.18 | 1.33 | 1.23 | – | **1.18** | decorative, exempt |
| button text on accent | `#f7f9fb` on `#0d6a83` |  |  |  |  | – | **5.84** | 4.5 |

**Rendered audit.** Playwright walked every visible text element and every interactive control border on
`/`, a case study, `/resume`, `/stats`, `/log` and `/ai-assistant`, in dark and light at 375 and 1440 px.
Each was compared against the background actually composited beneath it, including tints and
semi-transparent layers: 2,486 text checks and 172 control-border checks.

**Result:** 0 failures. Text is ≥4.5:1 everywhere (≥3:1 only where large-text rules allow it), and every
control boundary is ≥3:1. Decorative dividers (`line`) and the aria-hidden hero code-rain are exempt as
non-informative.

## Lighthouse (local, same machine, before vs after)

Same invocation as `scripts/lighthouse.sh`: lighthouse@12, mobile preset, 3 runs per page, median. Both
builds were served with `next start` on this machine, back to back. Absolute performance on a local
sandbox runs lower than on Vercel, so compare the two columns rather than the budget. The PR's
preview gate measures the real numbers.

| Page | Perf before → after | A11y before → after | Best practices | SEO |
|---|---|---|---|---|
| `/` | 65 → 63 (runs 59, 65 → 65, 62, 63) | 100 → 100 | 96 → 96 | 100 → 100 |
| `/projects/e-commerce-website` | 73 → 86 | 100 → 100 | 96 → 96 | 100 → 100 |
| `/resume` | 85 → 87 | 100 → 100 | 96 → 96 | 100 → 100 |

There are no new dependencies and no new fonts. The only added client code is the category
classifier (`lib/categories.ts`, about 1 KB). Glow and grid are pure CSS.
