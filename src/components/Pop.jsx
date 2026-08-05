import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   NeoPOP primitives.

   Everything here obeys the four rules that carry the look: radius 0, shadows
   are offset SOLID blocks with zero blur, one voltage accent per screen, and
   hierarchy from the opacity ladder rather than extra colours.

   These sit alongside the existing editorial primitives in Primitives.jsx —
   Section, Row, Ticks and friends are untouched. Use PopCard where a surface
   should read as a physical tile, and the plain Section stack where the
   screen is meant to read as a printed page.
   ═══════════════════════════════════════════════════════════════════════════ */

/** A surface. `raised` adds the offset block; use it for one tile per screen. */
export function PopCard({ raised = false, className = '', as: As = 'div', ...rest }) {
  return <As className={`${raised ? 'pop-raised' : 'pop-card'} ${className}`} {...rest} />
}

/**
 * The elevated button. Renders as <button>, <Link> or <a>.
 *
 * `gold` is the voltage CTA — one per screen. `ghost` drops the block for
 * secondary actions, because three elevated buttons on one screen reads as
 * noise rather than hierarchy.
 */
export function PopButton({
  to,
  href,
  onClick,
  variant = 'default',
  size = 'md',
  full = true,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'pop-btn caps',
    // `sm` is the house default for anything inline or paired — full-width
    // blocky CTAs eat the screen, and the gold ones especially.
    size === 'sm' && 'pop-btn-sm',
    variant === 'gold' && 'pop-btn-gold',
    variant === 'ghost' && 'shadow-pop-none bg-transparent',
    full && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls} {...rest}>
      {children}
    </button>
  )
}

/**
 * Section kicker. CAPS 11px at 50% white, optional right-hand action.
 * The single biggest visual win in the system — every section gets one.
 */
export function Kicker({ children, action, onAction, to, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${className}`}>
      <p className="caps t-body">{children}</p>
      {action &&
        (to ? (
          <Link to={to} className="caps-sm gold">
            {action}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className="caps-sm gold">
            {action}
          </button>
        ))}
    </div>
  )
}

/** Small square tag. CAPS, 1px stroke, no fill. */
export function PopTag({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'border-stroke t-body',
    gold: 'border-gold gold',
    live: 'border-live text-live',
  }
  return (
    <span className={`caps-sm inline-block border px-2 py-1 ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

/** A labelled figure. Numerals run mono — the spec's instrumentation read. */
export function Stat({ label, value, sub, className = '' }) {
  return (
    <div className={className}>
      <p className="caps-sm t-faint">{label}</p>
      <p className="mt-1.5 text-lead font-light tnum t-heading">{value}</p>
      {sub && <p className="mt-0.5 caps-sm t-faint">{sub}</p>}
    </div>
  )
}

/**
 * Progress rail. A 2px bar rather than a rounded pill, filled in the voltage
 * accent, so it belongs to the same geometry as everything else.
 */
export function PopBar({ value, className = '' }) {
  return (
    <span className={`block h-[3px] w-full bg-rule ${className}`}>
      <span
        className="block h-full bg-gold"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  )
}

/** Square avatar with a 1px stroke. Initials only — no photographs anywhere. */
export function PopAvatar({ initials, size = 36, online = false, className = '' }) {
  return (
    <span className={`relative inline-block flex-none ${className}`}>
      <span
        className="inline-flex items-center justify-center border border-stroke bg-surface2 t-sub"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      >
        {initials}
      </span>
      {online && (
        <span
          className="absolute -bottom-0.5 -right-0.5 block bg-ok"
          style={{ width: 7, height: 7 }}
          aria-label="Online"
        />
      )}
    </span>
  )
}
