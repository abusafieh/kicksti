/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      colors: {
        background: "#0a0f1e",
        surface:    "#0d1526",
        elevated:   "#111c30",
        border: "#1e2a3d",

        accent: {
          DEFAULT: "#4ade80",
          dim:     "#4ade8015",
          border:  "#4ade8040",
          hover:   "#22c55e",
        },

        locked:  "#f97316",
        correct: "#4ade80",
        wrong:   "#f87171",

        gold:   "#f59e0b",
        silver: "#94a3b8",
        bronze: "#c97c3a",

        text: {
          primary: "#e2e8f0",
          muted:   "#94a3b8",
          faint:   "#4a5568",
        },

        success: {
          DEFAULT: "#4ade80",
          bg:      "#4ade8010",
          border:  "#4ade8030",
        },
        warning: {
          DEFAULT: "#f59e0b",
          bg:      "#f59e0b10",
          border:  "#f59e0b30",
        },
        danger: {
          DEFAULT: "#f97316",
          bg:      "#f9731610",
          border:  "#f9731630",
        },
      },

      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        sans:    ["DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.06em" }],
        xs:    ["11px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["15px", { lineHeight: "22px" }],
        lg:    ["18px", { lineHeight: "24px" }],
        xl:    ["22px", { lineHeight: "28px" }],
        "2xl": ["28px", { lineHeight: "34px" }],
        score: ["32px", { lineHeight: "1", fontWeight: "700" }],
      },

      spacing: {
        "4.5":  "18px",
        "13":   "52px",
        "15":   "60px",
        "18":   "72px",
        "22":   "88px",
        "safe": "env(safe-area-inset-bottom)",
      },

      borderRadius: {
        none:  "0",
        xs:    "4px",
        sm:    "8px",
        md:    "12px",
        lg:    "16px",
        xl:    "20px",
        full:  "9999px",
      },

      borderWidth: {
        DEFAULT: "0.5px",
        "0.5":   "0.5px",
        "1":     "1px",
        "2":     "2px",
      },

      boxShadow: {
        none:            "none",
        "focus-accent":  "0 0 0 3px rgba(74, 222, 128, 0.25)",
        "focus-default": "0 0 0 3px rgba(255, 255, 255, 0.08)",
        "glow-accent":   "0 0 16px rgba(74, 222, 128, 0.20)",
        "glow-gold":     "0 0 16px rgba(245, 158, 11, 0.20)",
      },

      opacity: {
        "locked": "0.6",
      },

      minHeight: {
        "touch": "44px",
        "nav":   "60px",
      },
      minWidth: {
        "touch": "44px",
      },

      transitionDuration: {
        DEFAULT: "150ms",
        fast:    "100ms",
        slow:    "300ms",
      },

      keyframes: {
        "points-pop": {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.9)" },
          "60%":  { opacity: "1", transform: "translateY(-4px) scale(1.05)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0px rgba(74, 222, 128, 0)" },
          "50%":       { boxShadow: "0 0 12px rgba(74, 222, 128, 0.3)" },
        },
        "score-fill": {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },

      animation: {
        "points-pop":  "points-pop 0.4s ease-out forwards",
        "glow-pulse":  "glow-pulse 2s ease-in-out infinite",
        "score-fill":  "score-fill 0.2s ease-out",
        "shimmer":     "shimmer 1.5s infinite linear",
        "slide-in":    "slide-in 0.2s ease-out",
      },

      backgroundImage: {
        "shimmer": "linear-gradient(90deg, #0d1526 0px, #111c30 80px, #0d1526 160px)",
      },

      backgroundSize: {
        "shimmer": "800px 100%",
      },

      zIndex: {
        "nav":     "100",
        "modal":   "200",
        "toast":   "300",
        "tooltip": "400",
      },
    },
  },

  plugins: [],
};