/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        macro: {
          300: '#6d7dff',
          400: '#5366ff', 
          500: '#3f50d6'
        },
        vitamin: {
          300: '#4ade80',
          400: '#22c55e',
          500: '#16a34a'
        },
        mineral: {
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0284c7'
        },
        other: {
          300: '#facc15',
          400: '#eab308',
          500: '#ca8a04'
        }
      }
    },
  },
  plugins: [],
}
