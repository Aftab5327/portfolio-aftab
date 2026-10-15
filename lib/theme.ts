/**
 * Browser-chrome colours for <meta name="theme-color">. They mirror the --bg token of each
 * theme in app/globals.css (metadata can't read CSS variables), so keep the two in sync.
 */
export const THEME_COLOR = {
  dark: "#0a0e14",
  light: "#f7f9fb"
} as const;
