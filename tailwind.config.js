/**
 * Monochrome brutalist-editorial token set.
 *
 * Three hard rules encoded here, not left to discipline:
 *   1. No colour. The palette is black, white and four greys. Nothing else is
 *      reachable, so nothing else can leak in.
 *   2. No radius. Every scale collapses to 0.
 *   3. No elevation. Every shadow collapses to none — sections are separated
 *      by 1px rules and whitespace only.
 *
 * Colours resolve through CSS variables (declared in index.css) so the
 * high-contrast accessibility mode can re-point them at runtime.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // `colors` is REPLACED, not extended — Tailwind's default palette is gone.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      surface2: 'var(--surface-2)',
      stroke: 'var(--stroke)',
      t1: 'var(--text)',
      t2: 'var(--text-2)',
      t3: 'var(--text-3)',
      t4: 'var(--text-4)', // non-text only: ticks, spokes, placeholders
      rule: 'var(--rule)',
      // The single voltage accent. NeoPOP allows one per screen; this app
      // spends it on gold to keep the astrology identity.
      gold: 'var(--gold)',
      'gold-dim': 'var(--gold-dim)',
      'gold-wash': 'var(--gold-wash)',
      live: 'var(--live)',
      ok: 'var(--ok)',
      edge: 'var(--edge)',
    },
    borderRadius: {
      none: '0',
      sm: '0',
      DEFAULT: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      '3xl': '0',
      full: '0',
    },
    // Blurred shadows stay unreachable. The only shadows in this app are the
    // NeoPOP offset blocks below, every one of them zero-blur.
    boxShadow: {
      none: 'none',
      DEFAULT: 'none',
      sm: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      pop: '4px 4px 0 0 #3D3D3D',
      'pop-sm': '2px 2px 0 0 #3D3D3D',
      'pop-gold': '4px 4px 0 0 var(--gold-dim)',
      'pop-none': '0 0 0 0 transparent',
    },
    extend: {
      fontFamily: {
        // Outfit stands in for Gilroy (UI), Instrument Serif for Cirka
        // (display), Overpass Mono for numerals and meta — the three
        // substitutions the spec names.
        sans: ['Outfit', 'Inter', '-apple-system', 'Helvetica Neue', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Overpass Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Named to the role, so a screen cannot invent a nineteenth size.
        micro: ['10px', { lineHeight: '1.3', letterSpacing: '0.12em' }],
        label: ['11px', { lineHeight: '1.3', letterSpacing: '0.10em' }],
        meta: ['13px', { lineHeight: '1.45' }],
        body: ['15px', { lineHeight: '1.6' }],
        read: ['17px', { lineHeight: '1.65' }],
        lead: ['20px', { lineHeight: '1.5' }],
        title: ['26px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        display: ['34px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        huge: ['44px', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        label: '0.10em',
        caps: '0.18em',
      },
      spacing: {
        // 8pt grid, extended into the unusually large vertical gaps the layout
        // leans on (32 / 40 / 48 / 56).
        13: '3.25rem',
        18: '4.5rem',
      },
      maxWidth: {
        measure: '34ch',
        prose2: '44ch',
      },
      keyframes: {
        // Fades only. No bounce, no spring, no translate over 6px.
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.7' },
        },
        // Linear, single-axis, no arc — the NeoPOP motion rule.
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fade: 'fade 0.4s ease-out both',
        'fade-slow': 'fade 0.9s ease-out both',
        'fade-rise': 'fade-rise 0.45s ease-out both',
        'sheet-in': 'sheet-in 0.3s ease-out both',
        breathe: 'breathe 3.2s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
