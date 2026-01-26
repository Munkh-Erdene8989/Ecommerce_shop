/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b9d',
        secondary: '#ff8fab',
        dark: '#2c2c2c',
        'light-gray': '#f5f5f5',
        gray: '#999',
      },
    },
  },
  plugins: [],
}
