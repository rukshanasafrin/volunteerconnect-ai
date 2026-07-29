/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#272757',
          50: '#F4F4F8',
          100: '#E7E7F0',
          200: '#CDCDDf',
          300: '#AAAAC5',
          400: '#8686AC',
          500: '#505081',
          600: '#3D3D68',
          700: '#272757',
          800: '#1D1D43',
          900: '#14142F',
        },

        secondary: {
          DEFAULT: '#505081',
        },

        accent: {
          DEFAULT: '#8686AC',
        },

        surface: {
          light: '#F8FAFC',
          dark: '#0F172A',
          card: '#FFFFFF',
          darkCard: '#151D2A',
        },
      },

      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },

      boxShadow: {
        soft: '0 10px 35px rgba(39, 39, 87, 0.08)',
        elevated: '0 20px 50px rgba(39, 39, 87, 0.14)',
        glow: '0 15px 45px rgba(134, 134, 172, 0.28)',
      },

      backgroundImage: {
        'hero-gradient':
          'linear-gradient(135deg, #272757 0%, #505081 52%, #8686AC 100%)',
      },

      keyframes: {
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-14px)',
          },
        },

        'float-slow': {
          '0%, 100%': {
            transform: 'translateY(0px) translateX(0px)',
          },
          '50%': {
            transform: 'translateY(-18px) translateX(8px)',
          },
        },

        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
      },

      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },

  plugins: [],
}