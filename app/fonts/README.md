# Self-hosted fonts

Loaded with `next/font/local` in `app/layout.tsx`, so `next build` never downloads from Google Fonts
(Turbopack's Google-font fetch was failing intermittently in CI).

| Family | File | Weights used | Licence |
|---|---|---|---|
| Bricolage Grotesque | `bricolage-grotesque/BricolageGrotesque-latin.woff2` | 700, 800 | SIL OFL 1.1 (`bricolage-grotesque/OFL.txt`) |
| JetBrains Mono | `jetbrains-mono/JetBrainsMono-latin.woff2` | 400, 600 | SIL OFL 1.1 (`jetbrains-mono/OFL.txt`) |
| Sora | `sora/Sora-latin.woff2` | 400, 500, 600 | SIL OFL 1.1 (`sora/OFL.txt`) |

Each file is the Latin-subset variable woff2 that Google Fonts serves for these families (the only
subset the site's text uses), so rendering is unchanged. Characters outside the Google "latin"
range (e.g. accented Latin-extended letters, Greek, Cyrillic) fall back to the next font in the
stack (`system-ui`, `ui-monospace`).

The files are variable fonts, but Google may slice their weight axis to the weights that were
requested (listed above). To add a weight, download that family's Latin woff2 again with the new
weight included, replace the file, and add another `{ path, weight }` entry in `app/layout.tsx`.
