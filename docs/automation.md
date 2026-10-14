# Portfolio automation

The site's content comes from two data files. Components never hard-code profile
or project content.

| File | Edited by | Contains |
|---|---|---|
| `content/profile.json` | You, by hand | Name, title, summary, socials, education, experience, skills, certifications, stats |
| `content/manual-projects.json` | You, by hand | Projects that don't have a `PORTFOLIO.md` in their repo yet |
| `data/projects.json` | **Generated. Never edit.** | Every project shown on the site |

Both JSON files are validated with zod (`lib/schema.ts`). Invalid data **fails
`next build`** with a message naming the field, so a typo can't reach production.

## How it fits together

```
your project repos ──┐
 (topic: portfolio,  │   npm run sync          data/projects.json ──► next build ──► Vercel
  PORTFOLIO.md)      ├──► scripts/sync-projects.ts ──►  public/projects/*.png
content/manual-      │      (validates output)
 projects.json ──────┘
```

1. **`npm run sync`** (`scripts/sync-projects.ts`):
   - lists your public repos (username = `githubUsername` in `content/profile.json`);
   - keeps repos with the **`portfolio`** topic, skipping forks and archived repos;
   - reads `PORTFOLIO.md` from each repo's default branch, or builds a minimal
     entry from the repo name, description, language, topics and website if there isn't one;
   - adds GitHub metadata: repo URL, stars, primary language, language breakdown,
     last push date, and the repo "Website" as a fallback live URL;
   - downloads a repo-relative `image` to `public/projects/<slug>.<ext>`;
   - merges in `content/manual-projects.json` (a synced repo with the same slug wins);
   - sorts by featured → `order` → most recently pushed;
   - writes `data/projects.json` only if something changed, then prints a summary.
2. **`.github/workflows/sync-portfolio.yml`** runs the sync every 6 hours (and on
   demand). If `data/` or `public/projects/` changed, it commits
   `chore(data): sync portfolio from GitHub` and pushes to `main`.
3. That push triggers the normal **Vercel deployment**.

Other things that update automatically from the same data: the home page project
cards, `/projects/<slug>` case-study pages, `sitemap.xml`, and the AI chat
assistant's knowledge of your projects.

## Add a project

1. Copy [`templates/PORTFOLIO.md`](../templates/PORTFOLIO.md) to the **root** of the project repo and fill it in.
2. On the repo's GitHub page, click the ⚙ next to **About** and add the topic **`portfolio`**.
3. Wait for the next scheduled sync, or [trigger one manually](#trigger-a-sync-manually).

The project's slug (its URL, `/projects/<slug>`) is the **repo name in lowercase**,
e.g. `FastBox-Delivery-Simulation` → `/projects/fastbox-delivery-simulation`.

If the project is already in `content/manual-projects.json` under the same slug, the
synced version replaces it automatically. Delete the manual entry afterwards to keep
things tidy. If the slugs differ you'll see the project twice until you delete the
manual entry.

### PORTFOLIO.md format

Frontmatter (all optional; missing fields fall back to GitHub metadata):

| Field | Type | Fallback |
|---|---|---|
| `title` | string | Repo name, title-cased |
| `tagline` | string | Repo description |
| `category` | string | Primary language |
| `stack` | list | Primary language + topics |
| `featured` | `true` / `false` | `false` |
| `order` | number (lower = first) | none |
| `liveUrl` | https URL | Repo "Website" field |
| `image` | repo-relative path (`docs/shot.png`) or https URL | none |

Body sections, each starting with a level-2 heading: `## Problem`, `## Solution`,
`## Result`, `## Features`, `## Challenges`, `## Architecture`. Any you leave out are
hidden on the page.

- Markdown is GitHub-flavoured: tables, task lists and strikethrough all work. **Raw HTML is
  stripped.**
- A ` ```mermaid ` code block (typically in Architecture) renders as a diagram in
  the browser.
- Relative links and images (`docs/SETUP.md`, `![](img/x.png)`) are rewritten to
  point at the file on GitHub.
- Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif`, max 5 MB. 1600×900 works well.

Problems (unknown fields, bad values, unknown headings, missing images) show up as
**warnings** in the sync summary. They never break the sync; the invalid part is
skipped.

## Trigger a sync manually

- **From GitHub:** repo → **Actions** → **Sync portfolio** → **Run workflow**.
- **Locally:** `npm run sync`, then commit `data/` and `public/projects/` yourself.
  Set `GITHUB_TOKEN` first if you hit the 60 requests/hour anonymous limit:
  ```powershell
  $env:GITHUB_TOKEN = "<token>"; npm run sync      # PowerShell
  ```
  ```bash
  GITHUB_TOKEN=<token> npm run sync                # bash
  ```
- **From another repo or a script** (e.g. on push to a project repo), send a
  `repository_dispatch` event with type `portfolio-sync`:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer <token with repo access to portfolio-aftab>" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/Aftab5327/portfolio-aftab/dispatches \
    -d '{"event_type":"portfolio-sync"}'
  ```

## Edit your profile

Edit `content/profile.json` and push. `npm run build` (and CI) will fail with a
clear message if a field is missing or malformed. Empty `experience` and
`certifications` arrays simply hide those blocks on the About section.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Sync failed: GitHub API rate limit exceeded` locally | Set `GITHUB_TOKEN` (any fine-grained token, no permissions needed). |
| Project missing after sync | Check that the repo is public, not a fork or archived, and has the `portfolio` topic. |
| A project appears twice | A manual entry with a different slug; delete it from `content/manual-projects.json`. |
| Build fails with `Invalid data in content/profile.json` | Fix the field named in the error. |
| Build fails with `Invalid data in data/projects.json` | Don't hand-edit it; run `npm run sync` to regenerate. |
| Sync workflow ran but site didn't update | Open the Vercel dashboard and look for a deployment of the `chore(data)` commit. If Vercel skipped or blocked it because the author is `github-actions[bot]`, change the `git config user.email` in the workflow to your GitHub noreply address, or trigger a Vercel Deploy Hook from the workflow. |
| CI didn't run on the sync commit | Expected: GitHub doesn't start workflows from pushes made with the built-in `GITHUB_TOKEN`. The sync script validates the data before writing it, and Vercel's build validates it again. |
