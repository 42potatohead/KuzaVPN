/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "Sora-Regular": ["Sora-Regular", "sans-serif"],
        "Sora-Bold": ["Sora-Bold", "sans-serif"],
        "Sora-ExtraBold": ["Sora-ExtraBold", "sans-serif"],
        "Sora-SemiBold": ["Sora-SemiBold", "sans-serif"],
      },
      colors: {
        "highlight": {
          darkest: "#006F61",
          dark: "#009985",
          medium: "#5CCDBC",
          light: "#A8E3DA",
          lightest: "#E0F4F1",
        },
        "n-light": {
          darkest: "#A5B7B3",
          dark: "#C0DBD6",
          medium: "#E8EBEB",
          light: "#F5F9FA",
          lightest: "#FFFFFF",
        },
        "n-dark": {
          darkest: "#1F2024",
          dark: "#2F3036",
          medium: "#2F3036",
          light: "#71727A",
          lightest: "#8F9098",
        },
        "danger": {
          100: "#ED3241",
          90: "#FF616D",
          80: "#FFE2E5",
        }
      }
    },
  },
  plugins: [],
}
