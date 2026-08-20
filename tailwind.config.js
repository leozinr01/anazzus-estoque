/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#dc2626",
          redDark: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};
