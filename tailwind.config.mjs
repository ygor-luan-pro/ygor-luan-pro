/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso:  '#18130E',
        mahogany:  '#221A12',
        tobacco:   '#2E2015',
        cream:     '#F2E8DA',
        parchment: '#C4B49A',
        fade:      '#7A6B57',
        copper:    '#C9853A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      borderColor: {
        ink:   'rgba(201,133,58,0.12)',
        blade: 'rgba(201,133,58,0.30)',
      },
      backgroundColor: {
        'copper-dim': 'rgba(201,133,58,0.15)',
      },
    },
  },
  plugins: [],
};
