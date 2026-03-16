import type { Config } from 'tailwindcss';
import { colorTokens } from '@fithub/tokens';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border-subtle)',
        input: 'var(--border-subtle)',
        ring: colorTokens.status.success,
        background: 'var(--bg-canvas)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-muted)',
          foreground: 'var(--text-secondary)',
        },
        primary: {
          DEFAULT: colorTokens.status.success,
          foreground: 'var(--text-inverse)',
        },
        secondary: {
          DEFAULT: '#e5e7eb',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: colorTokens.status.danger,
          foreground: 'var(--text-inverse)',
        },
      },
      fontFamily: {
        sans: ['"Sora"', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        panel: '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
