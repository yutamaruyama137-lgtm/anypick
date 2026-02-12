import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0fdf5",
          100: "#dcfce8",
          200: "#bbf7d1",
          300: "#86efad",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        surface: {
          800: "#18181b",
          850: "#141418",
          900: "#0f0f12",
          950: "#050507",
        },
      },
      transitionDuration: {
        smooth: "220ms",
        fast: "150ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        out: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInFromLeft: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        loadingDot: {
          "0%, 80%, 100%": { transform: "scale(0.75)", opacity: "0.5" },
          "40%": { transform: "scale(1.1)", opacity: "1" },
        },
        loadingGlow: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        spinReverse: {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
        "fade-in-from-left": "fadeInFromLeft 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
        "loading-dot": "loadingDot 1s ease-in-out infinite",
        "loading-glow": "loadingGlow 1.8s ease-in-out infinite",
        "spin-reverse": "spinReverse 2.2s linear infinite",
      },
      animationDelay: {
        "dot-1": "0ms",
        "dot-2": "160ms",
        "dot-3": "320ms",
      },
      boxShadow: {
        "btn-press": "0 0 0 2px var(--tw-ring-color)",
      },
    },
  },
  plugins: [],
};

export default config;
