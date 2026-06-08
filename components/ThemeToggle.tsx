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
      className="group inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-txt transition-all duration-300 hover:border-teal hover:text-teal active:scale-95"
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
