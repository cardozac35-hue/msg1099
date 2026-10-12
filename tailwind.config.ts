import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        maroon: {
          50: "#fdf4f5",
          100: "#fbe8eb",
          200: "#f6d4da",
          300: "#eeaeb9",
          400: "#e07d8f",
          500: "#781F32",
          600: "#681b2b",
          700: "#571624",
          800: "#49131f",
          900: "#3d111b",
          950: "#22060c",
        },
        charcoal: {
          50: "#f6f7f8",
          100: "#ebedf0",
          200: "#d4d7dc",
          300: "#b1b6c0",
          400: "#87909f",
          500: "#242C36",
          600: "#1f262f",
          700: "#1a1f26",
          800: "#15191e",
          900: "#0e1115",
          950: "#080a0c",
        },
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
