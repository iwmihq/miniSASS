/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ── Design Tokens: Colors ──
      colors: {
        // Primary brand
        primary: {
          DEFAULT: "#0e4981",   // blue-900 — main brand blue
          light: "#2f3a80",     // indigo-800
          dark: "#07325a",
        },
        // Secondary / accent
        accent: {
          DEFAULT: "#539987",   // blue_gray-500 — teal/green accent
          light: "#6ab39e",
          dark: "#3d7a67",
        },
        // Status colors
        success: { DEFAULT: "#288b31" },    // green-800
        warning: { DEFAULT: "#fadf63" },    // yellow-400
        danger: { DEFAULT: "#ea4832", dark: "#d00501" },  // red-500, red-A700

        // Neutrals
        surface: {
          DEFAULT: "#ffffff",
          muted: "#e7e7e7",     // gray-200
          subtle: "#d9d9d9",    // blue_gray-100
        },
        text: {
          DEFAULT: "#414141",   // gray-800
          muted: "#a2a2a2",     // gray-500
          subtle: "#939090",    // gray-500_01
          inverse: "#ffffff",
        },

        // Legacy aliases (keep for backward compatibility during migration)
        blue: { 900: "#0e4981" },
        cyan: { A200: "#00ffff" },
        gray: {
          200: "#e7e7e7",
          500: "#a2a2a2",
          800: "#414141",
          "500_01": "#939090",
        },
        blue_gray: { 100: "#d9d9d9", 500: "#539987" },
        red: { 500: "#ea4832", A700: "#d00501" },
        green: { 800: "#288b31" },
        yellow: { 400: "#fadf63" },
        black: { 900: "#000000", "900_01": "#070707" },
        white: { A700: "#ffffff" },
        indigo: { 800: "#2f3a80" },
      },

      // ── Design Tokens: Typography ──
      fontFamily: {
        raleway: ["Raleway", "system-ui", "sans-serif"],
        mulish: ["Mulish", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],   // 40px
        "display": ["2rem", { lineHeight: "1.25", fontWeight: "700" }],        // 32px
        "heading": ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],       // 24px
        "subheading": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],   // 20px
        "body-lg": ["1.125rem", { lineHeight: "1.5", fontWeight: "400" }],     // 18px
        "body": ["1rem", { lineHeight: "1.5", fontWeight: "400" }],            // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],     // 14px
        "caption": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],      // 12px
      },

      // ── Design Tokens: Spacing ──
      spacing: {
        "header": "4.5rem",   // 72px — sticky header height
        "sidebar": "20rem",   // 320px — sidebar width
      },

      // ── Design Tokens: Border Radius ──
      borderRadius: {
        "brand": "0px 1rem 1rem 1rem",  // miniSASS signature rounded corners (top-left square)
      },

      // ── Design Tokens: Shadows ──
      boxShadow: {
        "card": "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
        "nav": "0 2px 8px rgba(0, 0, 0, 0.06)",
      },

      // ── Layout ──
      maxWidth: {
        "content": "90rem",  // 1440px — max content width
      },

      // ── Transitions ──
      transitionDuration: {
        "fast": "150ms",
        "normal": "250ms",
        "slow": "350ms",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
