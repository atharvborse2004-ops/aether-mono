import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'

/* App chrome: the top bar, the bottom nav, the sheet and the toast.
   All four are flat — a hairline separates them from content, nothing else. */

/**
 * Five destinations. Horoscope moves inside Profile as a tab and Ask AI moves
 * into the chat panel, which frees the two slots Live and Academy need.
 */
const TABS = [
  { to: '/home', label: 'Home' },
  { to: '/consult', label: 'Consult' },
  { to: '/live', label: 'Live' },
  { to: '/academy', label: 'Academy' },
  { to: '/shop', label: 'Shop' },
]

/**
 * Text-only tab bar. No icons — an icon would need a second visual language,
 * and this layout only has one. The active item is marked by a hard 2px gold
 * bar rather than a fill: the one place the voltage shows in the chrome.
 */
export function BottomNav() {
  return (
    <nav className="flex-none border-t border-stroke bg-bg">
      <ul className="flex">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `relative block py-4 text-center caps-sm transition-colors ${
                  isActive ? 'gold' : 't-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-0 top-0 h-[2px] bg-gold" />}
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Floating Ask AI button. Sits above the tab bar on every tab, opens the chat
 * panel straight onto the AI tab. Round on purpose — the single curved shape
 * in the app, which is exactly why it reads as the action.
 */
export function AskAiButton() {
  const { openChat } = useStore()

  return (
    <button
      type="button"
      onClick={() => openChat('ai')}
      aria-label="Ask AI"
      className="is-round absolute bottom-[76px] right-4 z-30 flex h-14 w-14 items-center justify-center border border-gold bg-bg text-gold transition-transform active:translate-y-[2px]"
      style={{
        // Zero-blur rings rather than a glow — a soft shadow is the one thing
        // NeoPOP does not allow, so the "glow" is drawn as a hard halo.
        boxShadow: '0 0 0 1px rgba(212,162,76,0.35), 0 0 0 6px rgba(212,162,76,0.08)',
      }}
    >
      <span className="caps-sm leading-none">AI</span>
    </button>
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
