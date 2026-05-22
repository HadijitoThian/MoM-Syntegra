/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          rec: '#ef4444',
          done: '#10b981',
          warn: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
