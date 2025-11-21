/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blaze-orange': '#ff6b00',
        'blaze-blue': '#0066cc',
        'data-blue': '#2d7eff',
        'data-purple': '#6f5bff',
        'data-orange': '#ff8a3d',
        'data-amber': '#f2c14e',
        'data-green': '#1db954',
        'data-emerald': '#2dd4bf',
        'data-pink': '#ff5f8a',
        'data-cyan': '#22d3ee',
        'surface': '#0f172a',
        'surface-strong': '#111827',
        'border': '#1f2937',
        'muted-foreground': '#9ca3af',
        'data-primary': '#e5e7eb',
      },
      boxShadow: {
        glow: '0 10px 40px rgba(45, 126, 255, 0.25)',
      },
    },
  },
  plugins: [],
}
