/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-green': '#68F757',
        'custom-yellow': '#FFFF00',
        'custom-red': '#D54D4D',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
        'tech': ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
  safelist: [
    'text-purple-400',
    'bg-purple-500/20',
    'border-purple-500/30',
    'text-red-400',
    'bg-red-500/20',
    'border-red-500/30',
    'text-blue-400',
    'bg-blue-500/20',
    'border-blue-500/30',
    'text-green-400',
    'bg-green-500/20',
    'border-green-500/30',
    'text-gray-400',
    'bg-gray-500/20',
    'border-gray-500/30',
    'bg-green-500/20',
    'bg-yellow-500/20',
    'bg-red-500/20',
  ]
}
