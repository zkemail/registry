import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  mode: 'jit',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        grey: {
          '100': '#F5F3EF',
          '200': '#E2E2E2',
          '400': '#E2E2E2',
          '500': '#D4D4D4',
          '600': '#A8A8A8',
          '700': '#606060',
          '800': '#3B3B3B',
          '850': '#272727',
          '900': '#161819',
          '950': '#111314',
        },
        warning: '#D7AE0B',
        neutral: {
          '100': '#F5F3EF',
          '200': '#F9F9F9',
          '300': '#EDEDED',
          '600': '#7A7A7A',
        },
        success: '#3AA345',
        green: {
          '100': '#EDFFF1',
          '200': '#C2F6C7',
          '300': '#278266',
        },
        brand: {
          '400': '#68A3E9',
        },
        yellow: {
          '100': '#FFFAF3',
          '200': '#FCE0B9',
          '300': '#F38E00',
        },
        purple: {
          '100': '#F4F4FF',
          '200': '#DDDDFE',
          '300': '#4D49F8',
        },
        info: '#007AFF',
        red: {
          '100': '#FFF6F7',
          '200': '#FFDBDE',
          '300': '#E15E56',
          '400': '#C72C22',
          '500': '#C71B16',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
