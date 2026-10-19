import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";
import { siteUrl } from "@/lib/config";
import { getProfile } from "@/lib/data";

/*
 * Self-hosted fonts (app/fonts/*, SIL OFL 1.1, licences next to each file), so builds never
 * download from Google Fonts. They are the exact Latin-subset variable woff2 files Google
 * serves, with one face per weight pointing at the same file, as Google's CSS declares them
 * (a weight range would render in-between weights differently).
 *
 * Glyphs missing from the Latin subset (e.g. "→") render from a metric-adjusted Arial fallback.
 * next/font/local would derive its own metrics from the subset file, so the fallback faces are
 * declared in app/globals.css with the exact values next/font/google used.
 */
const display = localFont({
  src: [
    { path: "./fonts/bricolage-grotesque/BricolageGrotesque-latin.woff2", weight: "700", style: "normal" },
    { path: "./fonts/bricolage-grotesque/BricolageGrotesque-latin.woff2", weight: "800", style: "normal" }
  ],
  // Not --font-display: Tailwind 4 emits its theme tokens (--font-display/--font-mono) as CSS
  // variables on :root, which would collide with next/font's variables and form a cycle.
  variable: "--font-bricolage",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback"]
});

const mono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono/JetBrainsMono-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono/JetBrainsMono-latin.woff2", weight: "600", style: "normal" }
  ],
  variable: "--font-jetbrains",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["JetBrains Mono Fallback"]
});

const body = localFont({
  src: [
    { path: "./fonts/sora/Sora-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/sora/Sora-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/sora/Sora-latin.woff2", weight: "600", style: "normal" }
  ],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Sora Fallback"]
});

const profile = getProfile();
const defaultTitle = `${profile.name} | Portfolio`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${profile.name}`
  },
  description: profile.seo.description,
  keywords: profile.seo.keywords,
  openGraph: {
    title: defaultTitle,
    description: profile.seo.description,
    type: "website",
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: profile.seo.description
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { firstName, lastName, email, socials } = profile;

  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
      // Next 16 no longer resets our global `scroll-behavior: smooth` during route changes;
      // this attribute keeps the Next 14 behaviour (instant jump to top on navigation).
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>
          <Navbar profile={{ firstName, lastName, email, socials }} />
          <main className="mx-auto w-[min(1180px,92%)] pb-16 pt-6 md:pt-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
