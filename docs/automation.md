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

All JSON is validated with zod (`lib/schema.ts`). Invalid data **fails `next build`**
with a message naming the field.

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

The sync and screenshot workflows share a concurrency group, so they never push to
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

- **Secret `GROQ_API_KEY`**: Settings → Secrets and variables → Actions → *New
  repository secret*. Used by **Draft case studies**.
- **Settings → Actions → General → Workflow permissions**: *Read and write
  permissions*, and tick **Allow GitHub Actions to create and approve pull requests**
  (needed to open the draft PR).
- If `main` is branch-protected, allow `github-actions[bot]` to push, or the sync and
  screenshot commits will be rejected.

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
