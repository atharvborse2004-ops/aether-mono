import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

/* App chrome: the top bar, the bottom nav, the sheet and the toast.
   All four are flat — a hairline separates them from content, nothing else. */

/**
 * Five destinations, in the reference app's order. Profile deliberately lives
 * behind the header avatar on Home and Horoscope so the bar stays at five —
 * the same trade the reference makes, for the same reason.
 */
const TABS = [
  { to: '/home', label: 'Home' },
  { to: '/horoscope', label: 'Horoscope' },
  { to: '/consult', label: 'Consult' },
  { to: '/ask', label: 'Ask AI' },
  { to: '/shop', label: 'Shop' },
]

/**
 * Text-only tab bar. No icons — an icon would need a second visual language,
 * and this layout only has one. Active is white, the rest are grey.
 */
export function BottomNav() {
  return (
    <nav className="flex-none border-t border-rule bg-bg">
      <ul className="flex">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                // tracking-label, not tracking-caps: five labels including
                // "Horoscope" do not fit at 0.18em in a 420px frame.
                `block py-4 text-center text-micro uppercase tracking-label transition-colors ${
                  isActive ? 'font-medium text-t1' : 'text-t3'
                }`
              }
            >
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Top bar. Left slot is either a back arrow or nothing; the title is the tiny
 * tracked caps label, centered; right slot is one optional action.
 *
 * Back goes back — through real history, not to a hardcoded parent. Screens
 * like Shop and Ask are reachable from more than one place, and a fixed
 * `backTo` on those sends you somewhere you were never coming from. `backTo`
 * is kept only as the fallback for a cold deep-link or a refresh, where there
 * is no history entry to return to.
 */
export function TopBar({ title, back = false, backTo, right = null, left = null, sub = null }) {
  const navigate = useNavigate()
  const location = useLocation()

  // React Router stamps 'default' on the key when this is the first entry in
  // the session — i.e. nothing to go back to.
  const hasHistory = location.key !== 'default'

  const goBack = () => {
    if (hasHistory) navigate(-1)
    else navigate(backTo || '/home', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex-none border-b border-rule bg-bg">
      {/* 72px sides, not 56 — a right-slot label like "5 left" wraps at 56. */}
      <div className="grid h-12 grid-cols-[72px_1fr_72px] items-center">
        <div className="flex items-center pl-4">
          {back ? (
            <button type="button" aria-label="Back" onClick={goBack} className="text-body text-t2">
              ←
            </button>
          ) : (
            left
          )}
        </div>
        <div className="min-w-0 text-center">
          <p className="label truncate">{title}</p>
          {sub && <p className="mt-0.5 truncate text-micro uppercase tracking-caps text-t3">{sub}</p>}
        </div>
        <div className="flex items-center justify-end pr-4">{right}</div>
      </div>
    </header>
  )
}

/** The one-glyph top-right action. Used for notifications and the cart. */
export function BarAction({ to, onClick, children, badge = null, label }) {
  const body = (
    <span className="relative inline-flex items-center text-label uppercase tracking-label text-t2">
      {children}
      {badge ? <span className="ml-1 tnum text-t1">{badge}</span> : null}
    </span>
  )
  if (to) {
    return (
      <Link to={to} aria-label={label}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={label}>
        {body}
      </button>
    )
  }
  // Read-only status (the cart count, for instance). Rendered as text rather
  // than a dead button — a control that looks tappable and is not is exactly
  // the affordance confusion this layout is trying to avoid.
  return <span aria-label={label}>{body}</span>
}

/**
 * Bottom sheet. Slides nowhere — it fades up 16px and stops. Full-width, one
 * hairline at the top, black fill.
 */
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black opacity-80"
      />
      <div className="relative animate-sheet-in max-h-[82%] overflow-y-auto border-t border-rule bg-bg no-scrollbar">
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <p className="label text-left">{title}</p>
          <button type="button" onClick={onClose} className="label" aria-label="Close">
            Close
          </button>
        </div>
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  )
}

/** Toast. One line, hairline box, fades. */
export function Toast({ message }) {
  if (!message) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-50 flex justify-center px-6">
      <p className="animate-fade border border-rule bg-bg px-4 py-3 text-label uppercase tracking-label text-t1">
        {message}
      </p>
    </div>
  )
}
