/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            50: '#f0f5ff',
            100: '#e0ecff',
            600: '#1d4ed8',
            700: '#1e40af',
            800: '#1e3a8a',
            900: '#0f172a',
          },
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
          green: {
            50: '#f0fdf4',
            600: '#16a34a',
            700: '#15803d',
          },
          amber: {
            50: '#fffbeb',
            600: '#d97706',
            700: '#b45309',
          },
          red: {
            50: '#fef2f2',
            600: '#dc2626',
            700: '#b91c1c',
          }
        }
      }
    },
  },
  plugins: [],
}
