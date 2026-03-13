/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#28C76F',
        'accent-dark': '#1E9A52',
        surface: '#141414',
        'surface-2': '#0F1F16',
        'surface-border': 'rgba(255,255,255,0.07)',
        bg: '#0A0A0A',
        text: '#FFFFFF',
        'text-muted': '#2A7A50',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        landscape: { raw: '(orientation: landscape)' },
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
