/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Caveat covers Latin; CJK glyphs (which Caveat lacks) fall through to
        // ZCOOL KuaiLe, a cute handwritten Chinese face, before generic cursive.
        hand: ['Caveat', "'ZCOOL KuaiLe'", 'cursive'],
        type: ["'Special Elite'", "'ZCOOL KuaiLe'", 'monospace'],
      },
      colors: {
        ink: '#3a3730',
        paper: '#f4ecd6',
        page: '#F7F4EE',
        cream: '#e7ddc0',
        navy: {
          panel: '#38416f',
          deep: '#262e54',
        },
      },
      keyframes: {
        jribbon: {
          '0%,100%': { transform: 'rotate(0.2deg)' },
          '50%': { transform: 'rotate(-0.9deg)' },
        },
        jstarsA: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-46px,-72px,0)' },
        },
        jstarsB: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(38px,-52px,0)' },
        },
        jtwinkleA: { '0%,100%': { opacity: '0.85' }, '50%': { opacity: '0.45' } },
        jtwinkleB: { '0%,100%': { opacity: '0.45' }, '50%': { opacity: '0.9' } },
        jglow1: {
          '0%': { transform: 'translate(-6%,-3%) scale(1)', opacity: '0.55' },
          '50%': { transform: 'translate(9%,5%) scale(1.28)', opacity: '0.85' },
          '100%': { transform: 'translate(-6%,-3%) scale(1)', opacity: '0.55' },
        },
        jglow2: {
          '0%': { transform: 'translate(5%,4%) scale(1.15)', opacity: '0.35' },
          '50%': { transform: 'translate(-8%,-6%) scale(1)', opacity: '0.6' },
          '100%': { transform: 'translate(5%,4%) scale(1.15)', opacity: '0.35' },
        },
      },
      animation: {
        ribbon: 'jribbon 6s ease-in-out infinite',
        starsA: 'jstarsA 150s linear infinite alternate, jtwinkleA 7s ease-in-out infinite',
        starsB: 'jstarsB 110s linear infinite alternate, jtwinkleB 5.5s ease-in-out infinite',
        glow1: 'jglow1 46s ease-in-out infinite',
        glow2: 'jglow2 62s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
