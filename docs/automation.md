# Portfolio automation

The site's content comes from data files. Components never hard-code profile or
project content.

| File | Edited by | Contains |
|---|---|---|
| `content/profile.json` | You | Name, title, summary, socials, education, experience, skills, certifications, stats |
| `content/manual-projects.json` | You | Projects without a `PORTFOLIO.md` or case study yet |
| `content/case-studies/<slug>.md` | You (approved AI drafts) | Case studies for repos that don't have their own `PORTFOLIO.md` |
| `content/drafts/<slug>.md` | AI (`npm run draft`) | Unreviewed drafts. **Never published.** |
| `content/draft-skip.txt` | You | Slugs the draft script should never draft |
| `data/projects.json` | **Generated** (`npm run sync`) | Every project shown on the site |
| `data/screenshots.json` + `public/projects/auto/` | **Generated** (`npm run screenshots`) | Automatic screenshots of live sites |
| `data/github-stats.json` | **Generated** (`npm run github-stats`, during the sync) | Contribution calendar, commits this month, languages, repos, stars |
| `data/knowledge-index.json` | **Generated** (`npm run knowledge`) | The AI assistant's search index |
| `content/build-log/<yyyy>-w<ww>.md` | AI (`npm run build-log`), weekly | Build-log posts summarising real commits |
| Upstash Redis (not in the repo) | Workflows + the site | Live metrics: uptime, Lighthouse, chat analytics, last sync, rate limits |

All JSON is validated with zod (`lib/schema.ts`). Invalid data **fails `next build`**
with a message naming the field.

**Golden rule:** live metrics (uptime, Lighthouse, chat analytics, sync heartbeat) are
stored **only in Redis, never committed**. Every commit to `main` triggers a deploy,
and every production deploy triggers Lighthouse. Committing Lighthouse scores would
loop forever.

## Pipeline

```
project repos (topic "portfolio") ─┐
content/case-studies/*.md ─────────┼─► npm run sync ─► data/projects.json ─┐
content/manual-projects.json ──────┘   (every 6 h)                         │
                                                                           ├─► next build ─► Vercel
project liveUrls ─► npm run screenshots ─► data/screenshots.json ──────────┘
                    (weekly)                public/projects/auto/*.webp

after each sync: npm run draft ─► content/drafts/*.md ─► PR for you to review
                 (Groq)           npm run approve <slug> ─► content/case-studies/
```

| Workflow | When | What it does |
|---|---|---|
| **Sync portfolio** (`sync-portfolio.yml`) | Every 6 h, manual, `repository_dispatch: portfolio-sync` | `npm run sync`; commits `data/` and `public/projects/` to `main` |
| **Draft case studies** (`draft-case-studies.yml`) | After each successful sync, manual | `npm run draft`; opens or updates a PR with new drafts |
| **Refresh screenshots** (`screenshots.yml`) | Sundays, manual | `npm run screenshots`; commits `public/projects/auto/` and `data/screenshots.json` |
| **Build log** (`build-log.yml`) | Mondays 03:30 UTC (09:00 IST), manual | `npm run build-log`; commits the new post + knowledge index |
| **Uptime** (`uptime.yml`) | Every 30 min, manual | `npm run uptime`; writes to Redis, **no commit** |
| **Lighthouse** (`lighthouse.yml`) | After each successful deploy, manual | Production: Lighthouse ×3 per page → Redis, **no commit**. Preview: budget gate + PR comment |
| **CI** (`ci.yml`) | Push / PR to `main` | Lint, retrieval eval, chat-tool tests, type check, build, resume check |
| **CodeQL** (`codeql.yml`) | Push / PR to `main`, weekly | Static security analysis |
| **Secret scan** (`gitleaks.yml`) | Every push and PR, manual | Fails on any committed secret |
| **Dependabot auto-merge** (`dependabot-automerge.yml`) | Dependabot PRs | Auto-merges patch/minor updates once CI passes |

Sync, screenshots and build log share a concurrency group, so they never push to
`main` at the same time. Each push to `main` triggers the normal Vercel deployment.

## Where a case study comes from

For each project, the **first available** source provides the case-study content:

1. `PORTFOLIO.md` in the project repo → shown as *Content: PORTFOLIO.md*
2. `content/case-studies/<slug>.md` → *Content: AI draft (reviewed)*
3. The `content/manual-projects.json` entry → *Content: manual*
4. Repo metadata only (name, description, language, topics, website) → *Content: repo metadata*

The source is recorded as `caseStudySource` in `data/projects.json` and shown on the
case-study page. Frontmatter fields missing from the chosen source fall back through
the lower layers. For example, a case study without a `tagline` uses the manual entry's
tagline, and then the repo description. The six Markdown sections always come from
a single source.

GitHub metadata (repo link, stars, languages, last push) is added for every project
whose repo has the `portfolio` topic, whatever the content source.

A project exists if its repo has the `portfolio` topic **or** it has a manual entry.
A case-study file with neither is ignored, with a warning.

## Add a project

**Option A: write it yourself.** Copy [`templates/PORTFOLIO.md`](../templates/PORTFOLIO.md)
to the repo root, fill it in, and add the `portfolio` topic to the repo (⚙ next to
**About** on the repo page).

**Option B: let AI draft it.** Just add the `portfolio` topic. After the next sync, the
**Draft case studies** workflow opens a PR titled *AI case-study drafts: …*. Then:

1. Check out the PR branch and open `content/drafts/<slug>.md`.
2. Check every statement against the repo. The model was told to use only facts from
   the README, file tree, dependency files and commit messages, and to write `TODO:`
   for anything unknown (metrics, users, outcomes). Drafts that contain numbers not
   found in that context are rejected automatically, but still verify everything.
3. Replace every `TODO:` line. Optionally set `featured`, `order`, `liveUrl`, `image`.
4. Run `npm run approve <slug>`. It refuses while any `TODO:` remains
   (`npm run approve <slug> -- --force` overrides), strips the AI header, and moves
   the file to `content/case-studies/`.
5. Commit and merge the PR. The next sync publishes it.

Don't want a draft for a repo? Add its slug to `content/draft-skip.txt`.

The slug (URL `/projects/<slug>`) is the **repo name in lowercase**, e.g.
`FastBox-Delivery-Simulation` → `fastbox-delivery-simulation`.

### PORTFOLIO.md / case-study format

Frontmatter (all optional):

| Field | Type | Fallback |
|---|---|---|
| `title` | string | Manual entry → repo name, title-cased |
| `tagline` | string | Manual entry → repo description |
| `category` | string | Manual entry → primary language |
| `stack` | list | Manual entry → primary language + topics |
| `featured` | `true` / `false` | Manual entry → `false` |
| `order` | number (lower = first) | Manual entry → none |
| `liveUrl` | https URL | Manual entry → repo "Website" field |
| `image` | repo-relative path, `/projects/…` site path, or https URL | Manual entry → auto screenshot → placeholder |
| `autoScreenshot` | `true` / `false` | `false`; `true` captures `liveUrl` and prefers the screenshot over `image` |

Body sections: `## Problem`, `## Solution`, `## Result`, `## Features`,
`## Challenges`, `## Architecture`. Missing ones are hidden. Markdown is GitHub-flavoured,
raw HTML is stripped, and ` ```mermaid ` blocks render as diagrams. Relative links and
images are rewritten to the file on GitHub. Repo-relative `image` files (`.png`, `.jpg`,
`.jpeg`, `.webp`, `.gif`, `.avif`, max 5 MB) are downloaded to `public/projects/<slug>.<ext>`.

## Project images

Each project card and case-study page shows, in order of preference:

1. **Explicit `image`** from the chosen source (unless `autoScreenshot: true`)
2. **Automatic screenshot** of `liveUrl`, from `public/projects/auto/<slug>.webp`
3. **Placeholder card**: the project title on the themed grid background

`npm run screenshots` captures every project that has a `liveUrl` and either no explicit
`image` or `autoScreenshot: true`:

- Chromium at 1600×900, waits for `load` plus a short settle delay (30 s timeout). No
  logins, and no cookie banners dismissed.
- Saved as WebP (quality 80).
- **No churn:** an existing screenshot is replaced only if more than 2% of pixels
  changed (pixelmatch, colour tolerance 0.2). Otherwise the file and its `capturedAt`
  stay the same.
- A failed capture keeps the previous screenshot and records `"status": "failed"` with
  the error in `data/screenshots.json`.
- Projects that no longer qualify have their screenshot removed.

Locally you need Chromium once: `npx playwright install chromium`.
Options: `npm run screenshots -- <slug>` (only that project), `-- --force` (replace even
if nearly identical).

## Resume

The resume is generated from the same data as the website, so it always matches it.
`public/resume.pdf` no longer exists.

| URL | What | Built by |
|---|---|---|
| `/resume.pdf` | ATS-friendly PDF: A4, single column, real selectable text, standard headings, clickable links, Inter font (bundled in `assets/fonts/`) | `app/resume.pdf/route.ts` + `lib/resume-pdf.tsx` |
| `/resume` | Web version styled like the site, with print CSS (Ctrl+P gives a clean page) and Download PDF / View JSON / Print buttons | `app/resume/page.tsx` |
| `/resume.json` | [JSON Resume](https://jsonresume.org/schema) (`basics`, `work`, `education`, `skills`, `projects`, `certificates`) | `app/resume.json/route.ts` |

All three are `force-static`: generated **at build time on every deploy** from
`lib/resume.ts → buildResume()`, which reads `getProfile()` + `getProjects()`.

**What goes in**, in this order. Empty sections are left out entirely:

| Section | Source |
|---|---|
| Header | `name`, `title`, `email`, `location`, `phone` (only if `resume.showPhone`), site URL, `socials` |
| Summary | `summary` paragraphs |
| Experience | `experience[]` (role, company, location, start, end, summary, highlights) |
| Projects | First `resume.projectLimit` projects (default 4), sorted like the site: featured → `order` → latest push. Title, tagline, `resumeBullet`, stack, and link (live demo → repo → case-study page) |
| Skills | `skills[]` groups |
| Education | `education[]` (degree, detail, institution, `year`) |
| Certifications | `certifications[]` |
| Extra sections | `resume.extraSections[]`, e.g. `{ "title": "Achievements", "items": ["…"] }` |

Resume settings in `content/profile.json`:

```json
"resume": {
  "showPhone": false,
  "projectLimit": 4,
  "extraSections": []
}
```

Per project, add a one-line impact statement with `resumeBullet` in `PORTFOLIO.md`
frontmatter, a case study, or `content/manual-projects.json`.

Dates: write experience `start`/`end` as `2024-01` or `Jan 2024` (and `Present`) so they
convert cleanly to ISO dates in `/resume.json`.

**Set `NEXT_PUBLIC_SITE_URL` in Vercel.** Without it the resume leaves out the portfolio
link, the footer URL and the case-study links (it never prints `localhost`).

**CI guard:** after `npm run build`, CI runs `npm run check:resume`, which fails if
`/resume.pdf` wasn't generated, isn't a valid PDF, is 300 KB or more, or is longer than
2 pages. If it fails on length, lower `resume.projectLimit` or tighten the summary.

## Live stats (`/stats`)

A server-rendered dashboard, regenerated at most every **10 minutes**
(`revalidate = 600`). Redis reads go through Next's data cache for the same window,
so visitors never hit Redis directly. Each section is **hidden when its data is
missing**: with no Redis configured you only see the pipeline card.

| Section | Source | Written by |
|---|---|---|
| GitHub: heatmap, commits this month, languages, repos, stars | `data/github-stats.json` | `npm run github-stats` in the Sync workflow (GitHub GraphQL, built-in token) |
| Uptime: per-site status, 7-day uptime %, average latency, last check | Redis `uptime:*` | `uptime.yml` every 30 min |
| Lighthouse: performance / accessibility / best practices / SEO + trend | Redis `lighthouse:runs` (last 20) | `lighthouse.yml` after each production deploy |
| AI assistant: questions this week, top 5 topics | Redis `chat:q:<day>`, `chat:topics:<day>` (90-day expiry) | `/api/chat` |
| Pipeline: projects, knowledge chunks, last sync, last build | `data/`, Redis `pipeline:lastSync`, build time | Sync script + build |

All charts are built as plain SVG (no chart library), and every number is also shown
as text or in an `aria-label`.

### Uptime

`scripts/check-uptime.ts` sends a `GET` (10 s timeout, following redirects) to the
portfolio (`SITE_URL`) and to every project with a `liveUrl`, then records the status
code and latency. Each site keeps a capped list of about 7 days of samples. 2xx/3xx
counts as up.

### Lighthouse

On every successful **Production** deployment (Vercel reports deployments to GitHub),
the workflow audits `/`, the first project's case study and `/resume` on the public
domain (`SITE_URL`). It runs the mobile preset 3 times per page and stores the
**median** of each category per page plus the average. Reports with a runtime error
are skipped.

### Chat analytics and rate limit

- Per question, only the **topics** of the retrieved knowledge chunks are counted
  (e.g. `project:infrasense-360`). The message text is never stored, nor is any IP
  address or identifier.
- The chat is limited to **10 requests/minute per visitor** (sliding window) plus
  **300/day in total** (protecting the Groq bill), using `@upstash/ratelimit`, shared
  across all serverless instances.
- Visitors are identified by `SHA-256(RATE_LIMIT_SALT + IP)`. The Redis limiter only
  turns on when `RATE_LIMIT_SALT` is set, because an unsalted IPv4 hash is trivially
  reversible. Without Redis or the salt, or if Redis is unreachable, the in-memory
  per-instance limiter is used instead.

## Build log (`/log`)

Every Monday at 09:00 IST, `scripts/build-log.ts`:

1. collects the previous Monday–Sunday's commits from this repo and every
   `portfolio`-tagged repo;
2. drops bot commits, merges, and `chore(data)`, `chore(media)`, `docs(build-log)` and
   `docs(case-studies)` commits;
3. **skips the week** if fewer than 3 meaningful commits remain;
4. asks Groq for a title plus 3–6 bullets grouped by repo, using **only commit
   messages and repo names**. The output is validated: known repo headings only, 3–6
   bullets, no links, and **no number that doesn't appear in the commits**. It retries
   once, then fails;
5. writes `content/build-log/<yyyy>-w<ww>.md` with frontmatter (`title`, `date`,
   `repos`, `commitCount`, `aiGenerated: true`, and the source `commits` with links),
   rebuilds the knowledge index, and commits both.

Posts appear at `/log` and `/log/<slug>` (with an *AI summary of real commits* badge and
links to every source commit), in the RSS feed at `/log/rss.xml`, in the sitemap, and
in the AI assistant's knowledge, so it can answer "what has he been working on?".
You can edit a post by hand; the build validates its frontmatter. Backfill a week with
`npm run build-log -- --now 2026-10-13T03:30:00Z`.

## Run things manually

| Task | GitHub | Locally |
|---|---|---|
| Sync | Actions → **Sync portfolio** → Run workflow | `npm run sync` |
| Draft | Actions → **Draft case studies** → Run workflow | `npm run draft` (or `npm run draft -- <slug>`), needs `GROQ_API_KEY` |
| Approve | (local only) | `npm run approve <slug>` |
| Screenshots | Actions → **Refresh screenshots** → Run workflow | `npm run screenshots` |

Set environment variables for local runs, e.g. in PowerShell:
`$env:GITHUB_TOKEN = "<token>"; $env:GROQ_API_KEY = "<key>"; npm run draft`.
`GITHUB_TOKEN` is optional (raises GitHub's limit from 60 to 5000 requests/hour).

Trigger a sync from another repo or a script:

```bash
curl -X POST \
  -H "Authorization: Bearer <token with repo access to portfolio-aftab>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Aftab5327/portfolio-aftab/dispatches \
  -d '{"event_type":"portfolio-sync"}'
```

## Repository settings these workflows need

GitHub → Settings → Secrets and variables → Actions:

| Name | Kind | Used by |
|---|---|---|
| `GROQ_API_KEY` | Secret | Draft case studies, Build log |
| `UPSTASH_REDIS_REST_URL` | Secret | Uptime, Lighthouse, Sync (heartbeat) |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Uptime, Lighthouse, Sync (heartbeat) |
| `SITE_URL` | **Variable** (not secret), e.g. `https://portfolio-aftab-nine.vercel.app` | Uptime, Lighthouse |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Secret (optional) | Lighthouse preview gate, if previews are protected |

The built-in `GITHUB_TOKEN` covers the GitHub API (sync, drafts, stats, build log,
auto-merge, PR comments).

Also:

- **Settings → Actions → General → Workflow permissions**: *Read and write
  permissions*, and tick **Allow GitHub Actions to create and approve pull requests**
  (needed to open the draft PR).
- **Settings → General → Pull Requests**: tick **Allow auto-merge** (Dependabot
  auto-merge).
- **Settings → Branches → branch protection for `main`**: require the **CI** check
  (`build`) to pass before merging, so auto-merge waits for CI. Allow
  `github-actions[bot]` to bypass, so the sync, screenshot and build-log commits can still
  be pushed.
- **Settings → Code security**: enable **Dependabot alerts** and **Code scanning**
  (CodeQL results).

Vercel → Project → Settings → Environment Variables (Production):
`NEXT_PUBLIC_SITE_URL`, `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT`, `CONTACT_TOKEN_SECRET`,
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `ADMIN_USER`, `ADMIN_PASSWORD`, and optionally
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.

## Contact pipeline

The contact form posts to `POST /api/contact` (`app/api/contact/route.ts`). There is
no third-party script in the browser and no public API keys.

**Validation (zod, extra fields rejected):** name 2–80 characters, a valid email,
optional subject up to 120, message 10–2,000.

**Spam protection, in order:**

1. **Honeypot:** a hidden `website` field. If it's filled, the API answers "OK" and
   delivers nothing, so bots learn nothing.
2. **Minimum time on form:** the form fetches a token from `GET /api/contact/token`
   when it loads: a timestamp signed with HMAC-SHA256 (`CONTACT_TOKEN_SECRET`, falling
   back to `RATE_LIMIT_SALT`). Submissions under 3 s or tokens older than 2 h are
   rejected. A forged or tampered token is rejected.
3. **Rate limit:** 3 messages per hour per visitor (salted IP hash, Upstash; in-memory
   without Redis).
4. **Cloudflare Turnstile** (optional): checked only when `TURNSTILE_SECRET_KEY` and
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set.

**Delivery:** four steps run in parallel, and one failing never affects the others:

| Step | Needs |
|---|---|
| a) Email to you (Reply-To = the sender) | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` |
| b) Auto-reply to the sender (plain text + HTML, links to `/resume` and `/stats`) | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` |
| c) Telegram message (name, email, subject, first 300 chars) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| d) Lead stored in Redis for 90 days (`lead:<id>`, status `new`) | Upstash |

The visitor sees success if **the email to you or the Telegram message** went through.
Otherwise they get a generic error with your email address. Provider errors are only
written to the server logs.

All user input is HTML-escaped in emails, escaped for Telegram MarkdownV2, and stripped
of line breaks in subjects (no header injection).

**Admin:** `/admin/leads` lists leads newest first, with a status selector
(new → replied → archived) and a filter. `/admin/*` and `/api/admin/*` are protected by
HTTP Basic Auth in `middleware.ts` (`ADMIN_USER` / `ADMIN_PASSWORD`, compared in
constant time). If those variables aren't set, the admin area answers **404** as if it
didn't exist. Admin responses carry `X-Robots-Tag: noindex`, and `/admin` is disallowed
in `robots.txt` and left out of the sitemap.

## Dependencies: Dependabot

`.github/dependabot.yml` runs every Monday:

- **npm:** runtime minor + patch updates grouped into one PR, dev-dependency minor +
  patch into another. Major versions of `next`, `tailwindcss` and `eslint-config-next`
  are ignored (upgrade those by hand).
- **GitHub Actions:** one grouped PR.

`dependabot-automerge.yml` enables **auto-merge (squash)** on Dependabot PRs that are
patch or minor. They merge only once the required CI check passes (needs *Allow
auto-merge* plus branch protection, see above). Majors wait for you.

## Lighthouse gate on previews

On every successful **Preview** deployment, `lighthouse.yml` runs Lighthouse on the
preview URL (`/`, the first case study and `/resume`; mobile; median of 3 runs) and
checks the budgets in **`lighthouse-budgets.json`**:

| Category | Budget |
|---|---|
| Performance | ≥ 85 |
| Accessibility | ≥ 95 |
| Best practices | ≥ 95 |
| SEO | ≥ 95 |

It posts (or updates) **one PR comment** with a score table and fails the check if any
page is below budget. The SEO *is-crawlable* audit is skipped on previews because
Vercel serves them with `X-Robots-Tag: noindex` on purpose. If your previews are behind
Vercel's login, add the `VERCEL_AUTOMATION_BYPASS_SECRET` secret (Vercel →
Deployment Protection → *Protection Bypass for Automation*). Production deployments
keep recording to Redis only.

## Security scanning

- **CodeQL** (`codeql.yml`): JavaScript/TypeScript `security-and-quality` queries on
  every push to `main`, every PR, and weekly. Results appear under *Security → Code
  scanning*.
- **Gitleaks** (`gitleaks.yml`): scans the pushed or PR commits for secrets and **fails
  on any finding**. Run it manually (*Run workflow*) to scan the full history. If it
  flags a real key, **revoke the key first**, then add the finding's fingerprint to
  `.gitleaksignore`.

## Status badges

`/api/badge/<metric>` returns [shields.io endpoint](https://shields.io/badges/endpoint-badge)
JSON, cached for 10 minutes:

| Metric | Shows |
|---|---|
| `uptime` | 7-day uptime of the portfolio |
| `lighthouse` | Latest production performance score |
| `projects` | Number of published projects |

Use it as `https://img.shields.io/endpoint?url=<site>/api/badge/uptime`. It shows "no
data" until the first measurements exist.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `GitHub API rate limit exceeded` locally | Set `GITHUB_TOKEN` (any fine-grained token, no permissions needed). |
| Project missing after sync | The repo must be public, not a fork or archived, with the `portfolio` topic, or the project needs a manual entry. |
| A project appears twice | A manual entry with a different slug than the repo name. Rename the slug or delete the entry. |
| Draft workflow: `GROQ_API_KEY is not set` | Add the repository secret (see above). |
| Draft PR not created: "GitHub Actions is not permitted to create pull requests" | Enable that option in Workflow permissions. |
| A repo keeps getting re-drafted | Close the PR and add its slug to `content/draft-skip.txt`. |
| `Draft ... still invalid after retry` | The model ignored the format or invented numbers twice. Re-run later, or write the case study yourself. |
| `npm run approve` refuses | Replace the listed `TODO:` lines, or use `-- --force`. |
| Screenshot `status: "failed"` | The site was down, slow (>30 s) or returned an HTTP error. The previous screenshot is kept. |
| Screenshot shows a cookie or login wall | Set an explicit `image`; auto screenshots don't interact with the page. |
| Build fails with `Invalid data in …` | Fix the named field. For generated files, re-run the script instead of editing them. |
| Bot commit didn't deploy | Check Vercel for the `chore(...)` commit. If Vercel blocks commits by `github-actions[bot]`, set the workflow's `git config user.email` to your GitHub noreply address, or call a Vercel Deploy Hook. |
| CI didn't run on a bot commit or draft PR | Expected: GitHub doesn't start workflows from events created with the built-in `GITHUB_TOKEN`. The data is validated by the scripts and again by Vercel's build. |
| `/stats` shows only the pipeline card | Redis isn't configured in Vercel, or no data has been written yet. Run **Uptime** and **Lighthouse** manually once; the GitHub section appears after the next sync. |
| `/stats` numbers look stale | The page and its Redis reads are cached for up to 10 minutes by design. |
| Lighthouse workflow never runs | It triggers on GitHub `deployment_status` events with environment `Production`. Check that Vercel's GitHub integration creates deployments, and run it manually to test. Also set the `SITE_URL` variable. |
| Uptime shows a site down that works in the browser | Some hosts block datacenter IPs or bots. Check the status code shown; a `403` usually means bot protection. |
| GitHub section missing after a sync | The **GitHub stats** step is allowed to fail without blocking the sync. Check its log in the workflow run. |
| Build log skipped a week | Fewer than 3 meaningful commits (bots, merges and data/media chores don't count). Expected. |
| Build log failed: "still invalid after retry" | The model ignored the format or added numbers that aren't in the commits. Re-run the workflow, or write the post by hand. |
| Chat says "reached its daily limit" | The global 300 questions/day cap was hit. Raise `GLOBAL_DAILY_LIMIT` in `lib/rate-limit.ts` if your Groq plan allows it. |
