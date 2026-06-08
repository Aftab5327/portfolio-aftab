import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg-2)",
        panel: "var(--panel)",
        panel2: "var(--panel-2)",
        line: "var(--line)",
        teal: "var(--teal)",
        tealdim: "var(--teal-dim)",
        green: "var(--green)",
        txt: "var(--txt)",
        txtdim: "var(--txt-dim)",
        txtfaint: "var(--txt-faint)",
        code: "var(--code)",
        // legacy alias kept so any stray usage still resolves
        accent: "var(--teal)"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "22px"
      },
      boxShadow: {
        soft: "0 20px 40px -20px rgba(0, 0, 0, 0.75)",
        card: "0 40px 90px -30px rgba(0, 0, 0, 0.85)",
        glow: "0 0 0 1px var(--teal), 0 18px 50px -18px rgba(45, 212, 191, 0.35)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" }
        },
        pulseDot: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(74, 222, 128, 0.55)" },
          "70%": { boxShadow: "0 0 0 8px rgba(74, 222, 128, 0)" }
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        blink: "blink 1.1s step-end infinite"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(45,212,191,0.10) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
