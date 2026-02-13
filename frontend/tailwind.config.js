import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        'xl': '1.8rem',
        '2xl': '2rem',
      },
      colors: {
        dark: {
          DEFAULT: '#1a1a1a',
          80: 'rgba(26, 26, 26, 0.8)',
          90: 'rgba(26, 26, 26, 0.9)',
        },
        white: {
          DEFAULT: '#ffffff',
          80: 'rgba(255, 255, 255, 0.8)',
          90: 'rgba(255, 255, 255, 0.9)',
        },
        gray: {
          DEFAULT: '#6b7280',
          80: 'rgba(107, 114, 128, 0.8)',
          90: 'rgba(107, 114, 128, 0.9)',
        },
        silver: {
          DEFAULT: '#c0c0c0',
          80: 'rgba(192, 192, 192, 0.8)',
          90: 'rgba(192, 192, 192, 0.9)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
