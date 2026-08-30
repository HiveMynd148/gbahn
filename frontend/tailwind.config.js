/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sapphire: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#3b5bdb',
          600: '#364fc7',
          700: '#1a2b5e',
          800: '#152147',
          900: '#0d152e',
        },
        gold: {
          50: '#fff9db',
          100: '#fff3bf',
          500: '#fcc419',
          600: '#fab005',
          700: '#f59f00',
        },
        primary: '#3b5bdb',
        secondary: '#fcc419',
        accent: '#1a2b5e',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
