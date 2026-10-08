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
        industrial: {
          950: '#060A13',
          900: '#0B111E',
          850: '#0F1728',
          800: '#141E34',
          750: '#1A2744',
          700: '#213257',
          600: '#334876',
          border: '#1E2C44',
          borderLight: '#2A3C5D',
        },
        brand: {
          cyan: '#06B6D4',
          cyanGlow: '#00E5FF',
          blue: '#2563EB',
          blueHover: '#1D4ED8',
        },
        status: {
          good: '#10B981',
          goodBg: 'rgba(16, 185, 129, 0.12)',
          goodBorder: 'rgba(16, 185, 129, 0.25)',
          defective: '#EF4444',
          defectiveBg: 'rgba(239, 68, 68, 0.12)',
          defectiveBorder: 'rgba(239, 68, 68, 0.25)',
          warning: '#F59E0B',
          warningBg: 'rgba(245, 158, 11, 0.12)',
          warningBorder: 'rgba(245, 158, 11, 0.25)',
          info: '#3B82F6',
          infoBg: 'rgba(59, 130, 246, 0.12)',
          infoBorder: 'rgba(59, 130, 246, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.4)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
