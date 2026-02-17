/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          "surface-hover": "var(--bg-surface-hover)",
          sidebar: "var(--bg-sidebar)",
          block: "var(--bg-block)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        block: "var(--radius-block)",
        input: "var(--radius-input)",
      },
      fontFamily: {
        ui: ["var(--font-ui)"],
        content: ["var(--font-content)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
