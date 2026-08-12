import typography from '@tailwindcss/typography'

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
        // Deep near-black — Linear-inspired canvas
        canvas: {
          DEFAULT: '#08090a',
          50:  '#0d0e10',
          100: '#111214',
          200: '#161719',
          300: '#1c1d20',
          400: '#232428',
          500: '#2a2b30',
          600: '#35363c',
          700: '#404148',
          800: '#4d4e56',
          900: '#5a5b64',
        },
        // Electric indigo — brand accent
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Semantic
        priority: {
          high:   '#ef4444',
          medium: '#f59e0b',
          low:    '#6b7280',
        },
        // Glass surface tints
        glass: {
          white:  'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          hover:  'rgba(255,255,255,0.06)',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-noise':  'url("data:image/svg+xml,%3Csvg...")',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(99,102,241,0.25)',
        'glow':     '0 0 24px rgba(99,102,241,0.35)',
        'glow-lg':  '0 0 48px rgba(99,102,241,0.45)',
        'glass':    '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg': '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float':   'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [typography],
}
