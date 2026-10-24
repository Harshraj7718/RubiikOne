/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme: ink #0B1219, crimson #A50003 and near-white #F9F9F9; gold stays as the metallic accent.
        night: { DEFAULT: "#0B1219", 900: "#070C11", 800: "#0E1720", 700: "#141F2A", 600: "#1C2935" },
        ivory: { DEFAULT: "#F9F9F9", dim: "#C9CBCE", mute: "#8A9099" },
        wine: { DEFAULT: "#A50003", 900: "#2A0001", 800: "#4D0002", 700: "#7A0002", 600: "#A50003" },
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
