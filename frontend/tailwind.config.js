/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:             '#f4f6fb',
        sidebar:        '#1e2235',
        'sidebar-hover':'#262d45',
        card:           '#ffffff',
        primary:        '#5b6af0',
        'primary-hover':'#4a59e0',
        accent:         '#7c3aed',
        'text-primary': '#1a1d2e',
        'text-muted':   '#6b7280',
        'text-sidebar': '#a0aec0',
        border:         '#e5e7eb',
        'border-dark':  '#2d3450',
        success:        '#10b981',
        warning:        '#f59e0b',
        error:          '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
        bubble: '16px',
      },
    },
  },
  plugins: [],
}
