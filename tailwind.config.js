const animate = require("tailwindcss-animate");
const safeArea = require("tailwindcss-safe-area");

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [animate, safeArea],
};
