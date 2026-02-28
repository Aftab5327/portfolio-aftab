"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "dark";
  const isDark = currentTheme !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/70 text-slate-800 backdrop-blur transition-all duration-300 hover:scale-105 active:scale-95 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <span
        className={`text-lg transition-all duration-300 ${
          mounted ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-1 rotate-12"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
