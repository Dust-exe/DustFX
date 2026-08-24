/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090810',
        foreground: '#F4F4F5',
        card: '#120E1E',
        cardBorder: '#281C44',
        brand: {
          purple: '#9333EA',
          fuchsia: '#C026D3',
          cyan: '#06B6D4',
          accent: '#A855F7',
          glow: '#7C3AED'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
