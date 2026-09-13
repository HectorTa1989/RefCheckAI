import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        apple: {
          blue:      "#0071E3",
          "blue-dk": "#0056B0",
          text:      "#1D1D1F",
          secondary: "#6E6E73",
          tertiary:  "#AEAEB2",
          bg:        "#F5F5F7",
          surface:   "#FFFFFF",
          border:    "#D2D2D7",
          green:     "#34C759",
          red:       "#FF3B30",
          orange:    "#FF9F0A",
          yellow:    "#FFD60A",
          purple:    "#AF52DE",
          indigo:    "#5856D6",
        },
      },
      borderRadius: {
        "apple-sm": "8px",
        "apple":    "12px",
        "apple-lg": "18px",
        "apple-xl": "24px",
      },
      boxShadow: {
        "apple-sm":  "0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)",
        "apple":     "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)",
        "apple-md":  "0 4px 16px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)",
        "apple-lg":  "0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ring-fill": {
          "0%":   { "stroke-dashoffset": "var(--dash-total)" },
          "100%": { "stroke-dashoffset": "var(--dash-offset)" },
        },
      },
      animation: {
        "fade-up":   "fade-up 0.35s ease both",
        "ring-fill": "ring-fill 1s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
