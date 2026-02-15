import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#c71585', light: '#e91e8c', dark: '#9b0d5c' },
        secondary: { DEFAULT: '#4a148c', light: '#7b1fa2', dark: '#311b92' },
      },
    },
  },
  plugins: [],
}
export default config
