/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      colors: {
        background: "#f4f7fa",
        surface:    "#ffffff",
        elevated:   "#f0f4f8",
        border:     "#e2e8f0",

        nav: "#064e3b",

        accent: {
          DEFAULT: "#059669",
          dim:     "rgba(5,150,105,0.09)",
          border:  "rgba(5,150,105,0.28)",
          hover:   "#047857",
        },

        locked:  "#d97706",
        correct: "#059669",
        wrong:   "#dc2626",

        gold:   "#d97706",
        silver: "#64748b",
        bronze: "#92400e",

        text: {
          primary: "#111827",
          muted:   "#6b7280",
          faint:   "#9ca3af",
        },

        success: {
          DEFAULT: "#059669",
          bg:      "rgba(5,150,105,0.08)",
          border:  "rgba(5,150,105,0.22)",
        },
        warning: {
          DEFAULT: "#d97706",
          bg:      "rgba(217,119,6,0.08)",
          border:  "rgba(217,119,6,0.28)",
        },
        danger: {
          DEFAULT: "#dc2626",
          bg:      "rgba(220,38,38,0.08)",
          border:  "rgba(220,38,38,0.28)",
        },

        // Remap navy-* to light equivalents so existing JSX classes still work
        navy: {
          500: "#d1d5db",
          600: "#e2e8f0",
          700: "#f3f4f6",
          800: "#ffffff",
          900: "#f4f7fa",
        },
      },

      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        sans:    ["DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      fontSize: {
        "2xs": ["11px", { lineHeight: "16px", letterSpacing: "0.06em" }],
        xs:    ["12px", { lineHeight: "18px" }],
        sm:    ["14px", { lineHeight: "20px" }],
        base:  ["16px", { lineHeight: "24px" }],
        lg:    ["18px", { lineHeight: "26px" }],
        xl:    ["22px", { lineHeight: "30px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
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
        DEFAULT: "1px",
        "0.5":   "0.5px",
        "1":     "1px",
        "2":     "2px",
      },

      boxShadow: {
        none:            "none",
        card:            "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)",
        "card-hover":    "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        "focus-accent":  "0 0 0 3px rgba(5,150,105,0.18)",
        "focus-default": "0 0 0 3px rgba(0,0,0,0.06)",
        "glow-accent":   "0 0 16px rgba(5,150,105,0.15)",
        "glow-gold":     "0 0 16px rgba(217,119,6,0.18)",
      },

      opacity: {
        "locked": "0.55",
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
          "0%, 100%": { boxShadow: "0 0 0px rgba(5,150,105,0)" },
          "50%":       { boxShadow: "0 0 12px rgba(5,150,105,0.22)" },
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
        "shimmer": "linear-gradient(90deg, #f0f4f8 0px, #ffffff 80px, #f0f4f8 160px)",
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
