/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ========================================================================
      // FERRETTO GROUP THEME - Enhanced Design System
      // ========================================================================
      colors: {
        // Primary Ferretto Red
        ferretto: {
          red: '#E30613',
          'red-dark': '#B10510',
          'red-light': '#FF3B47',
          'red-lighter': '#FF8A8F',
          'red-pale': '#FFE5E7',
        },
        // Alias for primary
        ferrRed: '#E30613',

        // Dark colors for sidebar/header
        'ferretto-dark': '#32373c',
        'ferretto-dark-light': '#4A5056',
        'ferretto-dark-darker': '#23282d',
        ferrGray: '#32373c',

        // Complete gray scale
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2D2D2D',
          900: '#1A1A1A',
        },

        // Semantic colors
        primary: '#E30613',
        secondary: '#32373c',
        accent: '#E30613',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Status colors (for badges, indicators)
        status: {
          active: '#10B981',
          inactive: '#6B7280',
          pending: '#F59E0B',
          completed: '#3B82F6',
          error: '#EF4444',
          cancelled: '#9CA3AF',
        },
      },

      // Typography
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
        // Legacy support
        roboto: ['Roboto', 'system-ui', 'sans-serif'],
        barlow: ['"Barlow Semi Condensed"', 'sans-serif'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },

      // Spacing
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },

      // Border Radius
      borderRadius: {
        'ferretto': '0.25rem',      // 4px (standard)
        'ferretto-sm': '0.125rem',  // 2px
        'ferretto-md': '0.375rem',  // 6px
        'ferretto-lg': '0.5rem',    // 8px
      },

      // Shadows - Industrial & Professional
      boxShadow: {
        'ferretto': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'ferretto-sm': '0 1px 4px rgba(0, 0, 0, 0.08)',
        'ferretto-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'ferretto-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'ferretto-xl': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'ferretto-2xl': '0 12px 40px rgba(0, 0, 0, 0.2)',
        'ferretto-glow': '0 0 20px rgba(227, 6, 19, 0.3)',
        'ferretto-red': '0 8px 32px rgba(227, 6, 19, 0.1)',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      // Transitions
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '400': '400ms',
      },

      // Z-index
      zIndex: {
        '1': '1',
        '5': '5',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}
