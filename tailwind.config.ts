import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        grey: {
          100: '#F5F3EF',
          400: '#E2E2E2',
          500: '#D4D4D4',
          600: '#A8A8A8',
          700: '#606060',
          800: '#3B3B3B',
          900: '#161819',
          950: '#111314',
        },
        brand: {
          400: '#68A3E9',
        },
      },
    },
  },
  plugins: [],
};
export default config;
