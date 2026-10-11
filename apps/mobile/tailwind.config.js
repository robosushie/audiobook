const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'tag-blue': 'hsl(var(--tag-blue))',
        'tag-purple': 'hsl(var(--tag-purple))',
        'tag-pink': 'hsl(var(--tag-pink))',
        'tag-green': 'hsl(var(--tag-green))',
        'tag-yellow': 'hsl(var(--tag-yellow))',
        cotton: 'hsl(var(--cotton))',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: '2px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
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
      boxShadow: {
        pop: '0 0 #0000',
        soft: '0 0 #0000',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    require('tailwindcss-animate'),
    function interWeights({ addUtilities }) {
      addUtilities({
        '.font-normal': { fontFamily: 'Inter_400Regular', fontWeight: '400' },
        '.font-medium': { fontFamily: 'Inter_500Medium', fontWeight: '400' },
        '.font-semibold': { fontFamily: 'Inter_600SemiBold', fontWeight: '400' },
        '.font-bold': { fontFamily: 'Inter_700Bold', fontWeight: '400' },
        '.font-extrabold': { fontFamily: 'Inter_700Bold', fontWeight: '400' },
      });
    },
  ],
};
