import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#fffdf8",
        ink: "#1f2937",
        mist: "#eff6f4",
        sage: {
          50: "#f1f8f4",
          100: "#dbeee4",
          200: "#b8ddc8",
          300: "#8cc5a6",
          400: "#5da580",
          500: "#3c8762",
          600: "#2e6b4d",
          700: "#25543e",
          800: "#204333",
          900: "#1c382c"
        },
        peach: {
          50: "#fff4ec",
          100: "#ffe6d2",
          200: "#ffc9a5",
          300: "#ffaa73",
          400: "#ff8a46",
          500: "#f36e20"
        }
      },
      boxShadow: {
        card: "0 18px 50px -22px rgba(36, 59, 48, 0.22)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Consolas", "monospace"]
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(255, 170, 115, 0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(140, 197, 166, 0.18), transparent 26%)",
        "workspace-grid":
          "linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
