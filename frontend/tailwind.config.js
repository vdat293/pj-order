/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand
        primary: "#D83900",
        "primary-light": "#ff6b00",
        "primary-container": "#FFDBD1",
        "on-primary": "#ffffff",

        // Secondary (Emerald accents)
        secondary: "#006e2e",
        "secondary-container": "#6efb8e",

        // Surface system (Material Design 3)
        surface: "#FDFCF9",
        "surface-dim": "#dcd9d9",
        "surface-bright": "#fcf9f8",
        "surface-container": "#f0eded",
        "surface-container-low": "#f6f3f2",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",

        // On Surface
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#5d4038",
        "on-background": "#1c1b1b",

        // Outline
        outline: "#926f66",
        "outline-variant": "#e7bdb2",

        // Error
        error: "#ba1a1a",
        "error-container": "#ffdad6",

        // Inverse
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f3f0ef",
        "inverse-primary": "#ffb5a0",

        // Tertiary
        tertiary: "#005daa",
        "tertiary-container": "#0075d5",
      },
      fontFamily: {
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1.2', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '1.2', fontWeight: '500' }],
      },
      spacing: {
        'xs': '8px',
        'gutter': '24px',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(30, 26, 24, 0.06), 0 1px 3px rgba(30, 26, 24, 0.02)',
        'soft-lg': '0 15px 40px -12px rgba(30, 26, 24, 0.08), 0 4px 10px -5px rgba(30, 26, 24, 0.03)',
        'glow-primary': '0 8px 24px -4px rgba(216, 57, 0, 0.15), 0 4px 10px -5px rgba(216, 57, 0, 0.06)',
        'glow-emerald': '0 8px 24px -4px rgba(0, 110, 46, 0.12), 0 4px 10px -5px rgba(0, 110, 46, 0.04)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-subtle': 'bounce-subtle 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
