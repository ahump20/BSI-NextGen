import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f6ff',
          100: '#d9e4ff',
          200: '#a8c1ff',
          300: '#6d99ff',
          400: '#3c73ff',
          500: '#124dff',
          600: '#0037db',
          700: '#0029a8',
          800: '#001d75',
          900: '#001242'
        },
        accent: '#ff9f1c',
        slate: {
          950: '#020617'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-rajdhani)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(18,77,255,0.35)'
      }
    }
  },
  plugins: []
};

export default config;
