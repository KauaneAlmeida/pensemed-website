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
        // Paleta PenseMed oficial
        pense: {
          primary: '#205b67',      // Teal principal
          secondary: '#09354d',    // Azul escuro/petróleo
          light: '#2a7a8a',        // Teal claro (hovers)
          dark: '#184954',         // Teal escuro (pressed)
        },
        // Mantendo compatibilidade com classes existentes
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2a7a8a',
          600: '#205b67',
          700: '#09354d',
          800: '#184954',
          900: '#072a3d',
        },
        medical: {
          light: '#2a7a8a',
          DEFAULT: '#205b67',
          dark: '#09354d',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        opensans: ['var(--font-opensans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
