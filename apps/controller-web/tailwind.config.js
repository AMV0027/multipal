/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			retro: [
  				'Press Start 2P"',
  				'monospace'
  			],
  			pixel: [
  				'Silkscreen"',
  				'Press Start 2P"',
  				'monospace'
  			]
  		},
  		boxShadow: {
  			pixel: '4px 4px 0px 0px #000000',
  			'pixel-sm': '2px 2px 0px 0px #000000',
  			'pixel-lg': '6px 6px 0px 0px #000000',
  			'pixel-inset': 'inset 3px 3px 0px 0px rgba(0,0,0,0.6)'
  		},
  		colors: {
  			pixel: {
  				bg: '#0D0E15',
  				card: '#181926',
  				border: '#000000',
  				yellow: '#FACC15',
  				blue: '#3B82F6',
  				red: '#EF4444',
  				green: '#22C55E',
  				purple: '#A855F7'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};
