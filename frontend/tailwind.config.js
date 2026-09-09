/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#0a0e1a',
        sidebar:   '#0d1220',
        card:      '#111827',
        'card-2':  '#162030',
        border:    '#1e2d40',
        'text-primary': '#e8eaf0',
        'text-muted':   '#6b7a99',
        'text-dim':     '#3d4f6b',
        primary:        '#00c896',
        'primary-hover':'#00b082',
        'primary-dim':  '#00c89620',
        accent:         '#3b82f6',
        xp:             '#f59e0b',
        streak:         '#ef4444',
        success:        '#00c896',
        error:          '#ef4444',
        warning:        '#f59e0b',
      },
      borderRadius: {
        card:   '12px',
        btn:    '8px',
        bubble: '16px',
        pill:   '999px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
