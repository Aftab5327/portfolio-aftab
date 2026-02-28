import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aftabdhalait.vercel.app"),
  title: {
    default: "Aftab Dhalait | Portfolio",
    template: "%s | Aftab Dhalait"
  },
  description:
    "Software Developer specializing in Full Stack Development, IoT & Embedded Systems, and React & Backend Development. Based in Pune, India.",
  keywords: [
    "Aftab Dhalait",
    "Full Stack Developer",
    "IoT Developer",
    "React Developer",
    "Next.js Portfolio",
    "MERN Stack",
    "Embedded Systems",
    "Pune India"
  ],
  openGraph: {
    title: "Aftab Dhalait | Portfolio",
    description:
      "Full Stack Developer & IoT Engineer building scalable web apps and embedded systems. Based in Pune, India.",
    type: "website",
    url: "https://aftabdhalait.vercel.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Aftab Dhalait | Portfolio",
    description:
      "Full Stack Developer & IoT Engineer building scalable web apps and embedded systems. Based in Pune, India."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='aftab-portfolio-theme';var saved=localStorage.getItem(key);var theme=saved==='light'?'light':'dark';var root=document.documentElement;if(theme==='dark'){root.classList.add('dark');root.style.colorScheme='dark';}else{root.classList.remove('dark');root.style.colorScheme='light';}}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();`
          }}
        />
      </head>
      <body className={jakarta.className}>
        <Providers>
          <Navbar />
          <main className="mx-auto w-[min(1100px,94%)] pb-12 pt-10 md:pt-14">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
