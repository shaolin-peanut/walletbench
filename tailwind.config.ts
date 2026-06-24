import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        wb: {
          bg:        "var(--wb-bg)",
          surface:   "var(--wb-surface)",
          border:    "var(--wb-border)",
          text:      "var(--wb-text)",
          muted:     "var(--wb-muted)",
          accent:    "var(--wb-accent)",
          "accent-glow": "var(--wb-accent-glow)",
          green:     "var(--wb-green)",
          red:       "var(--wb-red)",
          amber:     "var(--wb-amber)",
          purple:    "var(--wb-purple)",
        },
      },
      fontFamily: {
        display: ["var(--wb-font-display)", "system-ui", "sans-serif"],
        mono:    ["var(--wb-font-mono)", "monospace"],
        body:    ["var(--wb-font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up":   "wb-fade-in-up 150ms ease-out both",
        "draw":         "wb-draw 800ms ease-in-out forwards",
        "tick":         "wb-tick 280ms ease-out",
        "pop":          "wb-pop 180ms ease-out",
        "pulse-dot":    "wb-pulse 1400ms ease-in-out infinite",
        "slide-in-right": "wb-slide-in-right 200ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
