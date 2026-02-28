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
        base: "#07111f",
        accent: "#34d399",
        card: "rgba(255, 255, 255, 0.08)"
      },
      boxShadow: {
        soft: "0 20px 40px -20px rgba(7, 17, 31, 0.75)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
