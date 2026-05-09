/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0d12',
        card: '#1a1a24',
        accent: '#c82333',
        health: '#28a745',
        mana: '#007bff'
      }
    },
  },
  plugins: [],
}
