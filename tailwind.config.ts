import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fffcf5",
        ink: "#222222",
        orange: "#ff8a3d",
        peach: "#ffe0c4",
        mint: "#7ddecb",
        lilac: "#c9b6ff",
      },
      boxShadow: {
        deck: "0 34px 80px rgba(255, 138, 61, 0.42)",
        soft: "0 24px 70px rgba(34, 34, 34, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
