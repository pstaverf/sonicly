/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#7C3AED', // Sonicly accent color
        glass: 'rgba(255, 255, 255, 0.05)',
        glassDark: 'rgba(0, 0, 0, 0.5)',
        background: 'var(--bg-color)',
        surface: 'var(--surface-color)',
        text: 'var(--text-color)',
      },
      borderRadius: {
        'lg': '16px',
        'xl': '24px',
        '2xl': '28px',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter Variable', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
