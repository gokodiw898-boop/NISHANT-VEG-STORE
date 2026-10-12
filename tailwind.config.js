/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leaf: { 50: '#f1f8ee', 100: '#dff0d8', 200: '#bfe0b2', 300: '#94c97f', 400: '#6aae52', 500: '#4a9338', 600: '#37762b', 700: '#2c5d24', 800: '#254a20', 900: '#1d3b1b' },
        cream: { 50: '#fdfbf5', 100: '#f8f4e8', 200: '#efe8d3' },
        ink: '#1f2a1c',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Hind', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 2px 10px rgba(44, 93, 36, 0.08)', lift: '0 8px 24px rgba(44, 93, 36, 0.14)' },
    },
  },
  plugins: [],
};
