/** @type {import('tailwindcss').Config} */

function channelScale(prefix) {
  const scale = {}
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    scale[step] = `rgb(var(--${prefix}-${step}) / <alpha-value>)`
  }
  return scale
}

const brand = channelScale('brand')
const accent = channelScale('accent')
const vitality = channelScale('vitality')
const circuit = channelScale('circuit')

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        premium: {
          dark: '#fafafa',
          darker: '#ffffff',
          slate: '#f4f4f5',
        },
        carbon: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f0f0f2',
          300: '#e4e4e7',
          400: '#d4d4d8',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#3f3f46',
          900: '#27272a',
          950: '#18181b',
        },
        octane: brand,
        vitality,
        circuit,
        steel: {
          50: '#f8f9fa',
          100: '#e8eaed',
          200: '#c5c9d0',
          300: '#9aa0ab',
          400: '#6b7280',
          500: '#525868',
          600: '#3d424d',
          700: '#2d3139',
          800: '#1f2228',
          900: '#14161a',
          950: '#0c0d10',
        },
        brand,
        navy: brand,
        accent,
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'glow-octane': 'var(--shadow-glow-octane)',
        'glow-vitality': 'var(--shadow-glow-vitality)',
        'glow-circuit': 'var(--shadow-glow-circuit)',
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
