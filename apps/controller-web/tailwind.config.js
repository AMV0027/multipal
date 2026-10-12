/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        retro: ['"Press Start 2P"', 'monospace'],
        pixel: ['"Silkscreen"', '"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        pixel: '4px 4px 0px 0px #09090F',
        'pixel-sm': '2px 2px 0px 0px #09090F',
        'pixel-lg': '6px 6px 0px 0px #09090F',
        'pixel-purple': '4px 4px 0px 0px #8B35FF',
        'pixel-cyan': '4px 4px 0px 0px #00E5FF',
        'pixel-pink': '4px 4px 0px 0px #FF2E88',
        'pixel-inset': 'inset 3px 3px 0px 0px rgba(9,9,15,0.7)',
      },
      colors: {
        // MultiPal Arcade Theme Palette
        arcade: {
          bg: {
            primary: '#09090F',
            secondary: '#11111B',
            tertiary: '#1A1A28',
            elevated: '#222235',
          },
          brand: {
            orange: '#FF6B00',
            yellow: '#FFD400',
            pink: '#FF2E88',
            magenta: '#D91FFF',
            purple: '#8B35FF',
            blue: '#245BFF',
            cyan: '#00E5FF',
          },
          text: {
            primary: '#F7F4E8',
            secondary: '#B7B6C9',
            muted: '#77778D',
            inverse: '#09090F',
          },
          border: {
            subtle: '#29293A',
            default: '#39394F',
            active: '#8B35FF',
          },
          semantic: {
            success: '#35E58A',
            warning: '#FFD400',
            error: '#FF4268',
            info: '#00CFFF',
          },
          zombie: {
            primary: '#FF4268',
            secondary: '#35E58A',
            accent: '#FF6B00',
          },
          fighter: {
            primary: '#D91FFF',
            secondary: '#00E5FF',
            accent: '#FFD400',
          },
          racing: {
            primary: '#FF6B00',
            secondary: '#245BFF',
            accent: '#00E5FF',
          },
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
