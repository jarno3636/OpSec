import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        scan: "#00ff95",
        warn: "#ffb100",
        danger: "#ff4d4d"
      },
      fontFamily: { mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"] }
    }
  },
  plugins: []
} satisfies Config;
