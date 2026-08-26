/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#2563eb",
        ink: "#0a0a0a",
        line: "#e5e7eb",
      },
    },
  },
  plugins: [],
};
