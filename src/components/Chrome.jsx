import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { user } from '../data/mock.js'
import Icon from './Icon.jsx'
import { PopAvatar } from './Pop.jsx'
import { useStore } from '../store.jsx'

/* App chrome: the top bar, the bottom nav, the sheet and the toast.

   The two bars are cut from the same ink and round toward each other — the top
   one at the bottom edge, the bottom one at the top — so content scrolls in the
   gap between them. That bracket is the whole reason a canvas this pale still
   reads as a designed screen rather than a document.

   They are not symmetrical, and should not be. The tab bar is taller with a
   32px radius; the top bar is a slim lid at 18px. Weight belongs at the bottom,
   where the thumb is and where the raised Live button needs mass to sit in. */

/**
 * Five destinations. Horoscope moves inside Profile as a tab and Ask AI moves
 * into the chat panel, which frees the two slots Live and Academy need.
 */
/** Live sits in the middle deliberately — it is the raised one. */
const LEFT = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/consult', label: 'Consult', icon: 'consult' },
]
const RIGHT = [
  { to: '/academy', label: 'Academy', icon: 'academy' },
  { to: '/shop', label: 'Shop', icon: 'shop' },
]

function Tab({ to, label, icon }) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        className={({ isActive }) =>
          // A thin glass bar cannot hold a bright/dim colour hierarchy — gold
          // caps on it measure 2.8:1. The active signal is the indicator bar
          // plus icon weight; both labels stay bright enough to read.
          `relative flex flex-col items-center gap-1.5 pb-5 pt-4 text-center caps-sm transition-colors duration-200 ${
            isActive ? 'font-extrabold text-white' : 'font-semibold text-white/55 hover:text-white/80'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {/* The indicator grows out from the centre rather than switching
                on, so moving between tabs reads as one continuous object. */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-5 top-1.5 h-[3px] origin-center rounded-full bg-gold-fill transition-transform duration-300 ease-out ${
                isActive ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
            {/* The icon thickens rather than recolouring — one line set, two
                states, and no second filled set to draw and keep in sync. */}
            <Icon name={icon} size={21} weight={isActive ? 2.1 : 1.6} />
            <span className="leading-none">{label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}

/**
 * The dark bar. On a light canvas the nav is the one persistent slab of ink —
 * it anchors the page the way CRED's does, and it is why the canvas can stay
 * as pale as it is without the screen floating away at the bottom.
 *
 * Live is a circle that breaks the top edge and sits half above it. It stays
 * part of the bar rather than floating free: a ring of the page colour behind
 * the circle punches it out of the slab, so the two read as one object.
 */
export function BottomNav() {
  return (
    <nav className="navbar">
      <ul className="flex items-stretch">
        {LEFT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}

        {/* Reserves the slot the circle occupies so the four text tabs stay
            evenly spaced and nothing sits underneath it. */}
        <li className="w-20 flex-none" aria-hidden="true" />

        {RIGHT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </ul>

      <NavLink
        to="/live"
        aria-label="Live"
        className="group absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        {({ isActive }) => (
          <span
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full transition-transform duration-200 group-active:scale-95 ${
              isActive ? 'bg-gold-fill text-ink' : 'bg-ink2 text-gold-fill'
            }`}
            style={{
              // The page-coloured ring is what punches the circle out of the
              // bar; the soft drop underneath it is what raises it.
              boxShadow: '0 0 0 5px var(--bg), 0 8px 20px -6px rgba(28,26,25,0.45)',
            }}
          >
            <Icon name="live" size={20} weight={2} />
            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.1em] leading-none">
              Live
            </span>
          </span>
        )}
      </NavLink>
    </nav>
  )
}

/**
 * The header every tab screen shares: profile on the left, the wordmark, then
 * the screen's own action (if it has one) and messages on the right.
 *
 * Screens used to print their own name and tagline up here — "Academy /
 * Learn to read it yourself" sitting directly above a tab bar already
 * labelled ACADEMY. The bar names the screen; the header does not need to say
 * it a second time, and the row is worth more as a constant.
 *
 * `action` is the one slot that varies: Home puts the horoscope there, Shop
 * the cart, Live its on-air badge. Everything else passes nothing.
 */
export function TabHeader({ action = null }) {
  const { openChat } = useStore()

  return (
    <header className="topbar flex items-center gap-2.5 px-4 py-2">
      <Link to="/profile" aria-label="Your profile" className="transition-opacity hover:opacity-70">
        <PopAvatar initials={user.initials} size={30} />
      </Link>
      <p className="flex-1 font-display text-lead leading-none t-heading">Veda</p>
      {action}
      <button
        type="button"
        onClick={() => openChat('live')}
        aria-label="Messages"
        className="pill knob relative !h-9 !w-9 justify-center"
      >
        <Icon name="chat" size={18} />
        <span className="absolute -right-0.5 -top-0.5 block h-2.5 w-2.5 rounded-full bg-live ring-2 ring-surface" />
      </button>
    </header>
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
      className="absolute bottom-[110px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold-fill text-ink shadow-gold transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
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
export function TopBar({
  title,
  back = false,
  backTo,
  hardBack = false,
  right = null,
  left = null,
  sub = null,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  // React Router stamps 'default' on the key when this is the first entry in
  // the session — i.e. nothing to go back to.
  const hasHistory = location.key !== 'default'

  // `hardBack` always lands on `backTo`, ignoring history. Profile uses it:
  // "back" there means Home, not whichever screen happened to precede it.
  const goBack = () => {
    if (hardBack && backTo) navigate(backTo)
    else if (hasHistory) navigate(-1)
    else navigate(backTo || '/home', { replace: true })
  }

  return (
    <header className="topbar">
      {/* 72px sides, not 56 — a right-slot label like "5 left" wraps at 56. */}
      <div className="grid h-11 grid-cols-[72px_1fr_72px] items-center">
        <div className="flex items-center pl-4">
          {back ? (
            <button
              type="button"
              aria-label="Back"
              onClick={goBack}
              className="text-body text-t2 transition-transform duration-150 hover:-translate-x-0.5 hover:text-t1 active:-translate-x-1"
            >
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
 * Bottom sheet. Rises 24px onto a dimmed page and stops. Rounded at the top
 * only — it is a surface coming up from the bottom edge, so the bottom corners
 * have nothing to round against.
 */
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-ink opacity-40"
      />
      <div className="glass-panel no-scrollbar relative max-h-[82%] animate-sheet-in overflow-y-auto rounded-t-3xl shadow-xl">
        {/* The grab handle. It does nothing — it says which edge this came
            from, which is the only thing a sheet has to communicate. */}
        <div className="glass-panel sticky top-0 z-10 pt-3">
          <span className="mx-auto block h-1 w-9 rounded-full bg-black/15" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between border-b border-rule px-6 pb-4">
            <p className="caps t-body">{title}</p>
            <button type="button" onClick={onClose} className="caps-sm gold" aria-label="Close">
              Close
            </button>
          </div>
        </div>
        <div className="px-6 py-7">{children}</div>
      </div>
    </div>
  )
}

/** Toast. One dark pill, rises in, fades. */
export function Toast({ message }) {
  if (!message) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-50 flex justify-center px-6">
      <p className="animate-pop-in inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 shadow-lg caps-sm on-ink">
        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-gold-fill" />
        {message}
      </p>
    </div>
  )
}
