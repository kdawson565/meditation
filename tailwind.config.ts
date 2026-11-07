import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: c("paper"),
        surface: c("surface"),
        ink: c("ink"),
        muted: c("muted"),
        line: c("line"),
        sea: c("sea"),
        brass: c("brass"),
        "brass-ink": c("brass-ink"),
        deep: c("deep"),
        "on-deep": c("on-deep"),
        "sea-dot": c("sea-dot"),
      },
      fontFamily: {
        serif: ["var(--font-serif)", '"Iowan Old Style"', "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      // The type scale. Serif sizes for headlines and reading; 16/15/13 for UI.
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.4" }], // 13
        sm: ["0.875rem", { lineHeight: "1.45" }], // 14
        base: ["1rem", { lineHeight: "1.5" }], // 16
        lg: ["1.125rem", { lineHeight: "1.6" }], // 18 reading
        xl: ["1.3125rem", { lineHeight: "1.35" }], // 21
        "2xl": ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.005em" }], // 26
        "3xl": ["2.125rem", { lineHeight: "1.18", letterSpacing: "-0.01em" }], // 34
      },
      transitionTimingFunction: { calm: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      transitionDuration: { calm: "500ms" },
    },
  },
  plugins: [],
};
export default config;
