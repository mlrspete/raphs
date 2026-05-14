import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFDF7",
        ink: "#171717",
        muted: "#525252",
        border: "#E8E0D4",
        orange: "#FF7A3D",
        "orange-hover": "#F0642A",
        peach: "#FFE0C4",
        dark: "#202020",
        "dark-card": "#343434",
        whitecard: "#FFFDF8",
        mint: "#BFF6E8",
        lilac: "#D8C8FF",
      },
      boxShadow: {
        deck: "0 34px 80px rgba(255, 122, 61, 0.34)",
        soft: "0 24px 70px rgba(23, 23, 23, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
