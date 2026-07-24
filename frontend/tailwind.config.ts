import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Ink: the anchor color — a warm, deep control-room navy, not a
        // flat black. Paper: off-white, not stark white, for content areas.
        // Signal: a single precise amber accent used like a status light —
        // sparingly, never as a gradient or a wash.
        ink: {
          50: "#F4F5F7",
          100: "#E4E7EC",
          300: "#8D96A8",
          600: "#333D52",
          800: "#161E2E",
          900: "#0B1220",
        },
        paper: "#F7F6F3",
        signal: {
          DEFAULT: "#E8A33D",
          dim: "#B8792A",
        },
        // Status colors for the state-indicator signature element.
        state: {
          active: "#3D9A5C",
          pending: "#E8A33D",
          idle: "#8D96A8",
          alert: "#C4463C",
        },
        // Backward-compatible aliases so existing markup (brand-600,
        // surface-muted, etc.) keeps working while pages get migrated to
        // the ink/paper/signal names directly, one at a time.
        brand: {
          50: "#E4E7EC",
          100: "#333D52",
          500: "#161E2E",
          600: "#0B1220",
          700: "#161E2E",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#F7F6F3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;