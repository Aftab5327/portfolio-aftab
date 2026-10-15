"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/use-client-value";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();

  const currentTheme = mounted ? theme : "dark";
  const isDark = currentTheme !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-panel text-txt transition-all duration-300 hover:border-teal hover:text-teal active:scale-95"
    >
      <span
        className={`text-base transition-all duration-300 ${
          mounted ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-1 rotate-12"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
