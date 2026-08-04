import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   The whole vocabulary of the layout lives in this file.

   Screens compose these and are not allowed to invent new tappable shapes —
   that rule is what fixes the "which of these is a link" problem the original
   is criticised for. Three affordances, defined once:

     <Button>   bordered block          commits to something
     <Row>      full-width row with →   navigates somewhere
     <TextLink> underlined inline text  navigates from inside a sentence
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tiny tracked caps. Centered by default — the printed-page tell. */
export function Label({ children, align = 'center', className = '', as: As = 'p' }) {
  return (
    <As className={`label ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {children}
    </As>
  )
}

/**
 * A section: label, air, content, hairline. Every screen is a stack of these
 * and nothing else. `grid` switches the body to the 4-column grid used for
 * dense data, which is what keeps the centered passages from turning into
 * the "everything is centered and nothing has hierarchy" failure.
 */
export function Section({ label, children, className = '', tight = false, last = false }) {
  return (
    <section
      className={`${tight ? 'section-tight' : 'section'} ${last ? 'border-b-0' : ''} ${className}`}
    >
      {label && <Label className="mb-6">{label}</Label>}
      {children}
    </section>
  )
}

/** Short centered hairline. A full stop between two thoughts. */
export function Stub({ className = '' }) {
  return <div className={`rule-stub ${className}`} />
}

/** Affordance 1 — commits. Renders as <button>, <Link> or <a> as needed. */
export function Button({ to, href, onClick, variant = 'default', className = '', children, ...rest }) {
  const cls = [
    'act-btn',
    variant === 'solid' && 'act-btn-solid',
    variant === 'quiet' && 'act-btn-quiet',
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
      <a href={href} className={cls} {...rest}>
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
 * Affordance 2 — navigates. The trailing arrow is drawn by CSS so no row can
 * ship without it, and every row in the app therefore looks identical.
 */
export function Row({ to, onClick, title, meta, note, className = '' }) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-body text-t1">{title}</span>
        {note && <span className="mt-1 block text-meta text-t3">{note}</span>}
      </span>
      {meta && <span className="text-label uppercase tracking-label text-t3 tnum">{meta}</span>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={`act-row ${className}`}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`act-row ${className}`}>
      {inner}
    </button>
  )
}

/** Affordance 3 — navigates from inside prose. Always underlined. */
export function TextLink({ to, onClick, children }) {
  if (to) {
    return (
      <Link to={to} className="act-link">
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className="act-link">
      {children}
    </button>
  )
}

/**
 * Segmented control. Text only — no pill, no sliding lens. The selected item
 * is white over a 1px white underline; everything else is grey.
 */
export function Segmented({ items, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`seg ${className}`}>
      {items.map((item) => {
        const key = typeof item === 'string' ? item : item.key
        const text = typeof item === 'string' ? item : item.label
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={value === key}
            className="seg-item"
            onClick={() => onChange(key)}
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A rating drawn as ticks rather than a bar. Filled ticks are white and 2px;
 * empty ones are a hairline. No colour, no percentage badge.
 */
export function Ticks({ value, total = 5, className = '' }) {
  return (
    <span className={`flex items-center gap-1 ${className}`} aria-label={`${value} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`tick ${i < value ? 'tick-on' : ''}`} />
      ))}
    </span>
  )
}

/** A 0–100 reading rendered as a 40-tick ruler. Used for day intensity. */
export function Ruler({ value, className = '' }) {
  const filled = Math.round((value / 100) * 40)
  return (
    <div className={className}>
      <div className="flex h-3 items-end gap-[2px]" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            className="flex-1"
            style={{
              height: i % 5 === 0 ? '12px' : '7px',
              background: i < filled ? 'var(--text)' : 'var(--text-4)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Square avatar. Initials only — no photographs anywhere in this layout. */
export function Avatar({ initials, size = 36, className = '' }) {
  return (
    <span
      className={`inline-flex flex-none items-center justify-center border border-rule text-t2 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials}
    </span>
  )
}

/** Key/value line for dense data. Left-aligned on purpose. */
export function Field({ k, v, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between gap-6 py-3 rule-b ${className}`}>
      <span className="label text-left flex-none">{k}</span>
      <span className="text-body text-t1 text-right tnum">{v}</span>
    </div>
  )
}

/** Non-interactive tag. Deliberately not a chip — chips read as tappable. */
export function Tag({ children }) {
  return (
    <span className="border border-rule px-2 py-1 text-micro uppercase tracking-caps text-t3">
      {children}
    </span>
  )
}
