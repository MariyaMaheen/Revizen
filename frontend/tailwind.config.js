/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F1A',
        sidebar: '#13131F',
        card: '#1A1A2E',
        primary: '#7C3AED',
        'primary-hover': '#6D28D9',
        accent: '#A78BFA',
        'text-primary': '#F1F5F9',
        'text-muted': '#94A3B8',
        border: '#2D2D44',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        bubble: '20px',
      },
    },
  },
  plugins: [],
}
