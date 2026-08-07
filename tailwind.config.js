/**
 * CRED-light token set.
 *
 * Three rules encoded here rather than left to discipline:
 *   1. Near-neutral. A warm canvas, white surfaces, a grey-black ink and one
 *      gold voltage. Colour beyond that is reachable only through the banner
 *      gradients, which are named below and nowhere else.
 *   2. Radius is the default, not the exception — the scale starts at 8px and
 *      `rounded-full` actually rounds.
 *   3. Elevation is a soft shadow tuned to the ink, never a generic black
 *      blur. Every level is listed; nothing invents its own.
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
      'gold-fill': 'var(--gold-fill)', // background only — never small text
      'gold-dim': 'var(--gold-dim)',
      'gold-wash': 'var(--gold-wash)',
      live: 'var(--live)',
      ok: 'var(--ok)',
      // The grey-black. Bottom bar, primary CTA, raised Live button.
      ink: 'var(--ink)',
      ink2: 'var(--ink-2)',
    },
    borderRadius: {
      none: '0',
      sm: '8px',
      DEFAULT: '12px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      full: '9999px',
    },
    // Tuned to the ink, not to pure black — a #000 blur on a warm canvas goes
    // grey and muddy, which is what makes most light UIs look unfinished.
    boxShadow: {
      none: 'none',
      sm: '0 1px 2px rgba(15,14,14,0.04), 0 3px 8px -5px rgba(15,14,14,0.12)',
      DEFAULT: '0 1px 2px rgba(15,14,14,0.04), 0 6px 16px -8px rgba(15,14,14,0.10)',
      md: '0 1px 2px rgba(15,14,14,0.04), 0 6px 16px -8px rgba(15,14,14,0.10)',
      lg: '0 2px 4px rgba(15,14,14,0.04), 0 16px 32px -12px rgba(15,14,14,0.16)',
      xl: '0 4px 8px rgba(15,14,14,0.05), 0 28px 48px -16px rgba(15,14,14,0.22)',
      // Cast upward — the bottom bar throws its shadow onto the content above.
      nav: '0 -2px 6px rgba(15,14,14,0.06), 0 -12px 28px -12px rgba(15,14,14,0.22)',
      gold: '0 1px 2px rgba(122,84,16,0.2), 0 8px 18px -8px rgba(122,84,16,0.5)',
    },
    extend: {
      fontFamily: {
        // ONE family. CRED sets its whole interface in a single geometric sans
        // and gets hierarchy from weight, size and case — no serif anywhere,
        // and no separate mono. `display` and `mono` stay mapped to it so the
        // existing `font-display` call sites keep working; what makes a
        // display heading a display heading is the weight rule in index.css.
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Named to the role, so a screen cannot invent a nineteenth size.
        // A geometric sans needs the negative tracking pulled in harder than a
        // serif did — it sets loose by default at display sizes.
        micro: ['10px', { lineHeight: '1.3', letterSpacing: '0.1em' }],
        label: ['11px', { lineHeight: '1.3', letterSpacing: '0.08em' }],
        meta: ['13px', { lineHeight: '1.45', letterSpacing: '-0.005em' }],
        body: ['15px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        read: ['17px', { lineHeight: '1.6', letterSpacing: '-0.011em' }],
        lead: ['20px', { lineHeight: '1.35', letterSpacing: '-0.02em' }],
        title: ['26px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        display: ['34px', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
        huge: ['44px', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
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
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.85' },
        },
        // Lands with a settle rather than a snap. The overshoot is 2%, which
        // is enough to read as physical and small enough not to look bouncy.
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(10px)' },
          '70%': { opacity: '1', transform: 'scale(1.02) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Diagonal sheen across a banner gradient. One pass, long pause.
        sweep: {
          '0%': { transform: 'translateX(-150%) skewX(-16deg)' },
          '50%, 100%': { transform: 'translateX(320%) skewX(-16deg)' },
        },
        // The live dot, and anything else that needs a heartbeat.
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        // A meter or bar drawing itself in from the left.
        grow: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        // The same, for anything that fills upward — ruler ticks, bar charts.
        'grow-y': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
        // Slow vertical drift for the decorative art inside banners.
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        fade: 'fade 0.4s ease-out both',
        'fade-slow': 'fade 0.9s ease-out both',
        'fade-rise': 'fade-rise 0.5s cubic-bezier(.2,.7,.3,1) both',
        'sheet-in': 'sheet-in 0.34s cubic-bezier(.2,.7,.3,1) both',
        'slide-in': 'slide-in 0.24s cubic-bezier(.2,.7,.3,1) both',
        breathe: 'breathe 3.2s ease-in-out infinite',
        'pop-in': 'pop-in 0.46s cubic-bezier(.2,.7,.3,1) both',
        sweep: 'sweep 6s linear infinite',
        pulse: 'pulse 1.8s ease-in-out infinite',
        grow: 'grow 0.7s cubic-bezier(.2,.7,.3,1) both',
        'grow-y': 'grow-y 0.5s cubic-bezier(.2,.7,.3,1) both',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
