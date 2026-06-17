import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Brand — all CTAs and interactive accents */
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          DEFAULT: 'var(--color-brand-600)',
          foreground: 'var(--color-text-inverse)',
        },

        /* Navy — dark-mode sidebar background only */
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          foreground: 'var(--color-text-inverse)',
        },

        /* Backward compat: primary → brand (removes navy from buttons) */
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },

        /* Backward compat: accent → brand */
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          foreground: 'var(--color-accent-foreground)',
        },

        /* Neutral scale */
        neutral: {
          0: 'var(--color-neutral-0)',
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },

        /* Surfaces */
        canvas: 'var(--color-canvas)',
        background: 'var(--color-canvas)',
        foreground: 'var(--color-text-primary)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },

        /* Borders */
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },

        /* Text */
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
          brand: 'var(--color-text-brand)',
        },

        /* Form / utility (resolves undefined token usage in pages) */
        muted: 'var(--color-muted)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',

        /* Semantic */
        success: {
          DEFAULT: 'var(--color-success)',
          text: 'var(--color-success-text)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          text: 'var(--color-warning-text)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          text: 'var(--color-error-text)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          text: 'var(--color-info-text)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },

        /* Lead qualifiers */
        qualifier: {
          hot: {
            DEFAULT: 'var(--color-qualifier-hot-text)',
            bg: 'var(--color-qualifier-hot-bg)',
            text: 'var(--color-qualifier-hot-text)',
            border: 'var(--color-qualifier-hot-border)',
          },
          warm: {
            DEFAULT: 'var(--color-qualifier-warm-text)',
            bg: 'var(--color-qualifier-warm-bg)',
            text: 'var(--color-qualifier-warm-text)',
            border: 'var(--color-qualifier-warm-border)',
          },
          cold: {
            DEFAULT: 'var(--color-qualifier-cold-text)',
            bg: 'var(--color-qualifier-cold-bg)',
            text: 'var(--color-qualifier-cold-text)',
            border: 'var(--color-qualifier-cold-border)',
          },
        },
      },

      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'var(--font-sans-fallback)',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          'var(--font-mono-fallback)',
          'monospace',
        ],
      },

      fontSize: {
        'display-lg': [
          '32px',
          { lineHeight: '40px', letterSpacing: '-0.02em' },
        ],
        'display-md': [
          '24px',
          { lineHeight: '32px', letterSpacing: '-0.01em' },
        ],
        'heading-lg': [
          '20px',
          { lineHeight: '28px', letterSpacing: '-0.01em' },
        ],
        'heading-md': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        'heading-sm': ['14px', { lineHeight: '20px', letterSpacing: '0' }],
        'body-lg': ['15px', { lineHeight: '24px', letterSpacing: '0' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0' }],
        label: ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
        'mono-sm': ['12px', { lineHeight: '18px', letterSpacing: '0' }],
      },

      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        focus: 'var(--shadow-focus)',
        modal: 'var(--shadow-modal)',
        frame: 'var(--shadow-frame)',
        glass: 'var(--shadow-glass)',
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },

      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
