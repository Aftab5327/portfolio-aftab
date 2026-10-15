"use client";

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useClientValue, useHydrated } from "@/lib/use-client-value";
import {
  FiActivity,
  FiBookOpen,
  FiCopy,
  FiCpu,
  FiDownload,
  FiFileText,
  FiGithub,
  FiHash,
  FiLinkedin,
  FiMoon,
  FiSearch,
  FiSun,
  FiTwitter
} from "react-icons/fi";
import { AUTOMATION_DOCS_PATH, LOG_PATH, RESUME_PAGE_PATH, RESUME_PATH, STATS_PATH, sections } from "@/lib/config";
import type { Profile } from "@/lib/schema";

type Command = {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  icon: ReactNode;
  run: () => void;
};

/**
 * Subsequence fuzzy match. Returns null when not every query character is found
 * in order; otherwise a score that rewards consecutive runs and word starts.
 */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return 0;

  const t = text.toLowerCase();
  let score = 0;
  let ti = 0;
  let prevMatch = -2;

  for (const char of q) {
    const found = t.indexOf(char, ti);
    if (found === -1) return null;

    score += 1;
    if (found === prevMatch + 1) score += 3;
    if (found === 0 || /[\s\-_/.]/.test(t[found - 1])) score += 2;
    score -= Math.min(found - ti, 3) * 0.1;

    prevMatch = found;
    ti = found + 1;
  }

  return score;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CommandPalette({ profile }: { profile: Pick<Profile, "email" | "socials"> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useHydrated();
  const isMac = useClientValue(() => /Mac|iPhone|iPad/.test(navigator.userAgent), false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const [toast, setToast] = useState("");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const openPalette = useCallback(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    restoreFocusRef.current?.focus();
  }, []);

  // Global Ctrl+K / Cmd+K toggle.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closePalette();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette, closePalette]);

  // Focus the input and lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const commands = useMemo<Command[]>(() => {
    const goTo = (id: string) => () => {
      // Defer until the dialog has closed and released the scroll lock.
      window.setTimeout(() => {
        const target = pathname === "/" ? document.getElementById(id) : null;
        if (target) {
          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          history.replaceState(null, "", `#${id}`);
        } else {
          router.push(`/#${id}`);
        }
      }, 0);
    };

    const openExternal = (url: string) => () => {
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const isLight = resolvedTheme === "light";

    const list: Command[] = [
      ...sections.map((section) => ({
        id: `goto-${section.id}`,
        label: `Go to ${section.label}`,
        group: "Navigate",
        keywords: section.id,
        icon: <FiHash />,
        run: goTo(section.id)
      })),
      {
        id: "resume",
        label: "Download resume",
        group: "Actions",
        keywords: "cv pdf",
        icon: <FiDownload />,
        run: () => {
          window.open(RESUME_PATH, "_blank", "noopener");
        }
      },
      {
        id: "resume-page",
        label: "View resume (web page)",
        group: "Navigate",
        keywords: "cv html print",
        icon: <FiFileText />,
        run: () => router.push(RESUME_PAGE_PATH)
      },
      {
        id: "stats",
        label: "Open engineering stats",
        group: "Navigate",
        keywords: "dashboard uptime lighthouse github metrics",
        icon: <FiActivity />,
        run: () => router.push(STATS_PATH)
      },
      {
        id: "log",
        label: "Read the build log",
        group: "Navigate",
        keywords: "weekly updates commits blog rss",
        icon: <FiBookOpen />,
        run: () => router.push(LOG_PATH)
      },
      {
        id: "automation",
        label: "How this site runs itself",
        group: "Navigate",
        keywords: "automation pipeline docs workflows",
        icon: <FiCpu />,
        run: () => router.push(AUTOMATION_DOCS_PATH)
      },
      {
        id: "copy-email",
        label: "Copy email address",
        group: "Actions",
        keywords: `mail contact ${profile.email}`,
        icon: <FiCopy />,
        run: () => {
          navigator.clipboard
            .writeText(profile.email)
            .then(() => setToast(`Copied ${profile.email}`))
            .catch(() => setToast(`Couldn't copy. Email: ${profile.email}`));
        }
      },
      {
        id: "toggle-theme",
        label: isLight ? "Switch to dark theme" : "Switch to light theme",
        group: "Actions",
        keywords: "theme mode dark light toggle",
        icon: isLight ? <FiMoon /> : <FiSun />,
        run: () => setTheme(isLight ? "dark" : "light")
      },
      {
        id: "github",
        label: "Open GitHub",
        group: "Links",
        keywords: "code repos source",
        icon: <FiGithub />,
        run: openExternal(profile.socials.github)
      },
      {
        id: "linkedin",
        label: "Open LinkedIn",
        group: "Links",
        keywords: "profile connect",
        icon: <FiLinkedin />,
        run: openExternal(profile.socials.linkedin)
      }
    ];

    if (profile.socials.twitter) {
      list.push({
        id: "twitter",
        label: "Open X (Twitter)",
        group: "Links",
        keywords: "twitter x social",
        icon: <FiTwitter />,
        run: openExternal(profile.socials.twitter)
      });
    }

    return list;
  }, [pathname, profile, resolvedTheme, router, setTheme]);

  const results = useMemo(() => {
    if (!query.trim()) return commands;

    return commands
      .map((command, index) => {
        const labelScore = fuzzyScore(query, command.label);
        const keywordScore = command.keywords ? fuzzyScore(query, command.keywords) : null;
        const best = Math.max(labelScore ?? -Infinity, keywordScore !== null ? keywordScore - 0.5 : -Infinity);
        return { command, index, score: best };
      })
      .filter((item) => item.score !== -Infinity)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.command);
  }, [commands, query]);

  // Keep the active option within range (derived during render instead of corrected in an effect).
  const activeIndex = Math.min(rawActiveIndex, Math.max(results.length - 1, 0));

  // ...and visible.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const runCommand = (command: Command) => {
    closePalette();
    command.run();
  };

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closePalette();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (results.length) setActiveIndex((activeIndex + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (results.length) setActiveIndex((activeIndex - 1 + results.length) % results.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(Math.max(results.length - 1, 0));
        break;
      case "Enter": {
        event.preventDefault();
        const command = results[activeIndex];
        if (command) runCommand(command);
        break;
      }
      case "Tab": {
        // Focus trap: cycle through focusable elements inside the dialog.
        const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        break;
      }
    }
  };

  const shortcut = isMac ? "⌘ K" : "Ctrl K";
  const activeCommand = results[activeIndex];

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        aria-label="Open command palette"
        className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 font-mono text-[12px] text-txtdim transition-colors hover:border-teal hover:text-teal lg:inline-flex"
      >
        <FiSearch aria-hidden className="h-3.5 w-3.5" />
        <kbd className="font-mono">{shortcut}</kbd>
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-60 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-xs"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closePalette();
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                onKeyDown={onDialogKeyDown}
                className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-panel shadow-card"
              >
                <div className="flex items-center gap-2 border-b border-line bg-panel2 px-4 py-2.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2 font-mono text-xs text-txtfaint">command-palette.sh</span>
                </div>

                <div className="flex items-center gap-3 border-b border-line px-4">
                  <span aria-hidden className="font-mono text-sm text-teal">
                    {">"}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveIndex(0);
                    }}
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeCommand ? optionId(activeIndex) : undefined}
                    aria-label="Search commands"
                    placeholder="Type a command or search…"
                    spellCheck={false}
                    autoComplete="off"
                    className="min-h-14 flex-1 bg-transparent font-mono text-sm text-txt outline-hidden placeholder:text-txtfaint focus-visible:outline-hidden"
                  />
                </div>

                <ul
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-label="Commands"
                  className="max-h-[min(360px,50vh)] overflow-y-auto p-2"
                >
                  {results.map((command, index) => {
                    const active = index === activeIndex;
                    return (
                      <li
                        key={command.id}
                        id={optionId(index)}
                        data-index={index}
                        role="option"
                        aria-selected={active}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => runCommand(command)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors ${
                          active ? "border-teal bg-panel2 text-teal" : "border-transparent text-txtdim"
                        }`}
                      >
                        <span aria-hidden className="shrink-0">
                          {command.icon}
                        </span>
                        <span className="flex-1">{command.label}</span>
                        <span className="font-mono text-[11px] text-txtfaint">{command.group}</span>
                      </li>
                    );
                  })}
                </ul>

                {results.length === 0 ? (
                  <p role="status" className="px-5 pb-5 font-mono text-sm text-txtdim">
                    No matching commands.
                  </p>
                ) : null}

                <div
                  aria-hidden
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-panel2 px-4 py-2.5 font-mono text-[11px] text-txtfaint"
                >
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                  <span>esc close</span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Live region stays mounted so screen readers announce changes to it. */}
      {mounted
        ? createPortal(
            <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-70 -translate-x-1/2">
              {toast ? (
                <p className="rounded-lg border border-line bg-panel px-4 py-2.5 font-mono text-sm text-txt shadow-card">
                  {toast}
                </p>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
