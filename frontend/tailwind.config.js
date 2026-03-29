/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Theme-aware semantic colors (via CSS custom properties) ──
        "th": {
          "surface-base":      "rgb(var(--color-surface-base) / <alpha-value>)",
          "surface-raised":    "rgb(var(--color-surface-raised) / <alpha-value>)",
          "surface-overlay":   "rgb(var(--color-surface-overlay) / <alpha-value>)",
          "surface-highlight": "rgb(var(--color-surface-highlight) / <alpha-value>)",
          "surface-sidebar":   "rgb(var(--color-surface-sidebar) / <alpha-value>)",
          "surface-header":    "rgb(var(--color-surface-header) / <alpha-value>)",

          "heading":    "rgb(var(--color-text-heading) / <alpha-value>)",
          "primary":    "rgb(var(--color-text-primary) / <alpha-value>)",
          "secondary":  "rgb(var(--color-text-secondary) / <alpha-value>)",
          "muted":      "rgb(var(--color-text-muted) / <alpha-value>)",
          "inverted":   "rgb(var(--color-text-inverted) / <alpha-value>)",

          "border":     "rgb(var(--color-border-default) / <alpha-value>)",
          "border-subtle": "rgb(var(--color-border-subtle) / <alpha-value>)",
          "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",

          "primary":       "rgb(var(--color-primary) / <alpha-value>)",
          "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
          "primary-light": "rgb(var(--color-primary-light) / <alpha-value>)",
          "primary-bg":    "rgb(var(--color-primary-bg) / <alpha-value>)",

          "success": "rgb(var(--color-success) / <alpha-value>)",
          "warning": "rgb(var(--color-warning) / <alpha-value>)",
          "danger":  "rgb(var(--color-danger) / <alpha-value>)",
          "info":    "rgb(var(--color-info) / <alpha-value>)",
        },

        // ── Static colors (don't change with theme) ──
        "primary": "#2563eb",
        "primary-hover": "#1d4ed8",
        "primary-light": "#3b82f6",

        "surface": {
          "base": "#0B1120",
          "raised": "#111827",
          "overlay": "#1e293b",
          "highlight": "#1e3a5f",
        },

        "border": {
          "DEFAULT": "#e2e8f0",
          "dark": "#1e293b",
          "subtle": "#334155",
        },

        "status": {
          "success": "#10b981",
          "warning": "#f59e0b",
          "danger": "#ef4444",
          "info": "#3b82f6",
          "purple": "#8b5cf6",
        },

        "ai": {
          "descriptive": "#3b82f6",
          "diagnostic": "#f59e0b",
          "predictive": "#8b5cf6",
          "prescriptive": "#10b981",
        },

        "background-light": "#f8fafc",
        "background-dark": "#0B1120",
        "card-dark": "#111827",
        "border-dark": "#1e293b",
      },
      fontFamily: {
        "display": ["Inter", "system-ui", "sans-serif"],
        "sans": ["Inter", "system-ui", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        "card": "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "enterprise": "0 0 0 1px rgb(0 0 0 / 0.03), 0 1px 2px 0 rgb(0 0 0 / 0.06)",
        "glow-primary": "0 0 20px -5px rgb(37 99 235 / 0.15)",
      },
      borderRadius: {
        "enterprise": "0.625rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
