/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0c',
        panel: '#151518',
        accent: '#c82333',
        gold: '#d4af37'
      }
    },
  },
  plugins: [],
}
