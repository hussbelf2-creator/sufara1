/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-body)'],
          body: ['var(--font-body)'],
          heading: ['var(--font-heading)'],
          display: ['var(--font-heading)'],
        },
        colors: {
          background: 'var(--bg)',
          foreground: 'var(--text)',
          primary: 'var(--accent)',
          accent: 'var(--accent2)',
          secondary: 'var(--muted)',
        },
        maxWidth: {
          shell: '1280px',
        },
      },
    },
    plugins: [],
  }