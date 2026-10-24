/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#07110d", 900: "#050c09", 800: "#0b1a14", 700: "#10241b", 600: "#173327" },
        ivory: { DEFAULT: "#efe9df", dim: "#b9b3a8", mute: "#7d8a84" },
        gold: { light: "#ecd29c", DEFAULT: "#c9a464", deep: "#8c6a35" },
        olive: { DEFAULT: "#5c6b1f", light: "#8a9a3a" },
        gunmetal: { DEFAULT: "#5a5c5f", light: "#8d9094" },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', "system-ui", "sans-serif"],
      },
      letterSpacing: { mega: "0.42em", wide2: "0.28em" },
      transitionTimingFunction: { lux: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
