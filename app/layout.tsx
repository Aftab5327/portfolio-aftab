import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";
import { siteUrl } from "@/lib/config";
import { getProfile } from "@/lib/data";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap"
});

const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap"
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
