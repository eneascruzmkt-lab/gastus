import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        veridian: {
          50: "#f0f9f5",
          100: "#d5f0e3",
          200: "#aee0c8",
          300: "#7ecaa8",
          400: "#53b08a",
          500: "#40826D",
          600: "#2d6a57",
          700: "#255647",
          800: "#1f4539",
          900: "#1a3930",
          950: "#0d201b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
