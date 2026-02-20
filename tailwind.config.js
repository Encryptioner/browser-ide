/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xsm': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'sidebar-bg': '#252526',
        'panel-bg': '#1e1e1e',
        'border': '#3e3e3e',
        'text-primary': '#cccccc',
        'text-secondary': '#858585',
        'accent': '#007acc',
      },
      touchAction: {
        'manipulation': 'manipulation',
      },
      spacing: {
        '44': '11rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
      });
    },
  ],
}
