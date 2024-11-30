/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/popup/index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          500: "#6366F1",
        },
        purple: {
          300: "#D8B4FE",
          500: "#8B5CF6",
        },
        pink: {
          500: "#EC4899",
        },
        blue: {
          800: "#1e3a8a",
        },
        fontFamily: {
          sans: ["Roboto", "sans-serif"],
        },
      },
    },
  },
  variants: {
    extend: {
      translate: ["active", "hover"],
    },
  },
  plugins: [],
}
