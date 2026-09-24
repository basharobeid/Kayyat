import type { Config } from 'tailwindcss';

// Design tokens from the blueprint (sections 7.3 and 8). Colors resolve to CSS variables
// defined in globals.css so they can be themed without touching components.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          ink: 'rgb(var(--color-gold-ink) / <alpha-value>)',
        },
        ink: 'rgb(var(--color-ink) / <alpha-value>)', // Deep Indigo
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        charcoal: 'rgb(var(--color-charcoal) / <alpha-value>)',
        olive: 'rgb(var(--color-olive) / <alpha-value>)',
        clay: 'rgb(var(--color-clay) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // Warm Grey
        mist: 'rgb(var(--color-mist) / <alpha-value>)', // Light Blue
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading)', 'Georgia', 'serif'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'body-s': ['0.875rem', { lineHeight: '1.375rem' }],
        'body-m': ['1rem', { lineHeight: '1.625rem' }],
        'body-l': ['1.125rem', { lineHeight: '1.875rem' }],
        h3: ['1.375rem', { lineHeight: '1.875rem', fontWeight: '600' }],
        h2: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        h1: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        display: ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        xl: '0 16px 48px rgba(0,0,0,0.16)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
