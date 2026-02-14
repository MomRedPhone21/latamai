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
        fintech: {
          50: "#f5f8ff",
          100: "#eaf0ff",
          200: "#d8e4ff",
          300: "#b4cdff",
          400: "#7ca8ff",
          500: "#4d80f5",
          600: "#2b62d9",
          700: "#1f4cb2",
          800: "#1e418f",
          900: "#1f3a78",
        },
      },
      boxShadow: {
        "fintech-panel": "0 24px 45px rgba(17, 32, 52, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
