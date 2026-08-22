import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import { pro, user } from './data/mock.js'
import { translate } from './data/i18n.js'
import { supabase } from './lib/supabase.js'

/**
 * In-memory store for prototype state (cart, remaining AI questions, toast
 * messages — still nothing persisted, nothing fetched) plus the parts that
 * are now real: `session` and `profile` from Supabase auth and the `profiles`
 * table (phase 1), and `balance`, `ledger` and `spend` from `wallets` and
 * `ledger` (phase 2). `birth` stays the in-progress onboarding draft before
 * it is written; once a profile exists, screens read `profile`, not `birth`.
 *
 * `spend` returns a PROMISE. It used to return a boolean, and `if (promise)`
 * is always truthy — a caller that forgets to await it lets through a purchase
 * the server refused.
 *
 * Which side of the app you are on is NOT state. HashRouter is mounted above
 * AppProvider in main.jsx, so the provider can read the URL — and the URL is
 * already the single source of truth. Storing a role beside it would only
 * create something that can disagree with the address bar.
 */
const AppStore = createContext(null)

const EMPTY_BIRTH = {
  name: '',
  date: '',
  time: '',
  place: '',
  lat: null,
  lon: null,
  // IANA name of the birth place's zone, from the geocoder in AskPlace. Never
  // defaulted and never an offset — docs/05-BACKEND-SCHEMA.md §4.1.
  zone: '',
  phone: '',
  email: '',
}

/* The one draft that outlives a reload, and the only reason is the SMS step:
   reading the code means leaving the app, and a phone is free to evict the
   page while you are in Messages. Losing the draft there is silent — the
   account gets created and the birth details never arrive. sessionStorage, not
   localStorage, so an abandoned signup clears itself with the tab. */
const BIRTH_KEY = 'namo:birth-draft'

function readBirthDraft() {
  try {
    return { ...EMPTY_BIRTH, ...JSON.parse(sessionStorage.getItem(BIRTH_KEY) || '{}') }
  } catch {
    return EMPTY_BIRTH
  }
}

export function AppProvider({ children }) {
  // Which side we are on, and therefore who "me" is.
  const isPro = useLocation().pathname.startsWith('/pro')

  const [birth, setBirth] = useState(readBirthDraft)

  useEffect(() => {
    try {
      sessionStorage.setItem(BIRTH_KEY, JSON.stringify(birth))
    } catch {
      /* Private mode with storage denied. The draft simply stays in memory. */
    }
  }, [birth])

  /* Auth. `sessionReady` flips once on first load — before that we don't yet
     know whether the visitor is signed in, so nothing should redirect on
     their behalf. `profile` is the real `profiles` row for the signed-in
     user; it starts null and is refetched whenever the session changes. */
  const [session, setSession] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  /* Wallet — real from phase 2, and the first thing in this store the browser
     cannot lie about. `balance` is PAISE, read back from the server under RLS.
     The client has no write policy anywhere near `wallets` or `ledger`, so
     devtools can move the number on screen and the next read puts it back.

     `null` means not loaded yet, and it is deliberately not 0 — a wallet
     briefly showing ₹0 to someone who has money is worse than showing nothing.

     `spending` stops a double-tap becoming a double-charge. It is a ref as
     well as state because two taps land in the same tick and state set by the
     first has not applied by the second. The ref is what refuses; the state is
     only what greys the button out. Guarding here rather than at each button
     means a call site that forgets its pending state still cannot double
     charge — there are five of them and the plan expects one to be missed. */
  const [balance, setBalance] = useState(null)
  const [ledger, setLedger] = useState([])
  const [spending, setSpending] = useState(false)
  const spendingRef = useRef(false)

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) return setProfile(null)
    setProfileLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    // A failed load is not the same as "no profile", but both end up null here
    // and every screen then falls back to seed identity — a signed-in person
    // shown the mock user's name and birth data. Nothing surfaces that yet
    // (phase 1 has no error UI), so at minimum make it diagnosable.
    if (error) console.error('[profile] load failed:', error.message)
    setProfile(data ?? null)
    setProfileLoading(false)
  }, [])

  /* Both reads are scoped by RLS to the caller's own rows, so neither carries
     a user id in its filter — asking for someone else's wallet returns an
     empty result rather than a refusal (docs/05-BACKEND-SCHEMA.md §7). */
  const refreshWallet = useCallback(async (userId) => {
    if (!userId) {
      setBalance(null)
      setLedger([])
      return
    }
    const [wallet, rows] = await Promise.all([
      supabase.from('wallets').select('balance_paise').single(),
      supabase.from('ledger').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (wallet.error) {
      console.error('[wallet] load failed:', wallet.error.message)
      return
    }
    setBalance(wallet.data.balance_paise)
    setLedger((rows.data ?? []).map(toLedgerRow))
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!active) return
      setSession(initial)
      setSessionReady(true)
      if (initial) {
        refreshProfile(initial.user.id)
        refreshWallet(initial.user.id)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next) {
        refreshProfile(next.user.id)
        refreshWallet(next.user.id)
      } else {
        setProfile(null)
        refreshWallet(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [refreshProfile, refreshWallet])

  const [questionsLeft, setQuestionsLeft] = useState(5)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  /* Language. A value, not a boolean, so it cannot live on `flags` — this is
     the first slice that genuinely needed one. Not persisted, like everything
     else here; it resets on reload with the rest of the app. */
  const [lang, setLang] = useState('en')

  /* Keeps the document in step, which is not decoration: it is what a screen
     reader picks a voice from and what the browser hyphenates by. */
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  /* Which chart the user reads. A preference, not screen state: someone who
     reads South Indian reads it everywhere, and finding the wheel again on
     Profile after choosing it on /chart is the app forgetting who you are. */
  const [chartSystem, setChartSystem] = useState('vedic')


  /* The chat panel — a right-side overlay rather than a route, so it can be
     opened from any tab and from the floating button without navigating. */
  const [chatOpen, setChatOpen] = useState(false)
  // Ask AI is the default surface. It is the one that always answers —
  // consultants only reply inside a session window.
  const [chatTab, setChatTab] = useState('ai')

  /* The horoscope panel. Also an overlay: the top-right Horoscope control is a
     focused action, so it must not navigate away from whatever tab you are on
     — sending it to Profile was the bug. */
  const [horoscopeOpen, setHoroscopeOpen] = useState(false)

  /* The cart, as real line items rather than a bare count, so the cart sheet
     has something to show and the total is computed rather than typed. */
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  /**
   * One flat set of boolean flags for every "sticky" toggle in the app:
   * `follow:a1`, `save:po2`, `like:r3`, `remind:l4`. A screen that toggles a
   * flag and then navigates away finds it still set on the way back — which is
   * the difference between a prototype and a broken one.
   */
  const [flags, setFlags] = useState(() => new Set(['save:po2']))

  const hasFlag = useCallback((key) => flags.has(key), [flags])

  const toggleFlag = useCallback((key, messages) => {
    let next
    setFlags((prev) => {
      const copy = new Set(prev)
      if (copy.has(key)) copy.delete(key)
      else copy.add(key)
      next = copy.has(key)
      return copy
    })
    if (messages) {
      setToast(next ? messages.on : messages.off)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), 2400)
    }
    return next
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  const setBirthField = useCallback(
    (field, value) => setBirth((b) => ({ ...b, [field]: value })),
    [],
  )

  /** Add a line, or bump its quantity if the product is already in the cart. */
  const addToCart = useCallback(
    (product, silent = false) => {
      setCart((c) => {
        const at = c.findIndex((l) => l.id === product.id)
        if (at === -1) return [...c, { ...product, qty: 1 }]
        const copy = [...c]
        copy[at] = { ...copy[at], qty: copy[at].qty + 1 }
        return copy
      })
      if (!silent) showToast(`${product.name} — added`)
    },
    [showToast],
  )

  const removeFromCart = useCallback((id) => setCart((c) => c.filter((l) => l.id !== id)), [])

  const setQty = useCallback(
    (id, qty) =>
      setCart((c) =>
        qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l)),
      ),
    [],
  )

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  const cartTotal = cart.reduce((n, l) => n + l.price * l.qty, 0)

  const spendQuestion = useCallback(() => setQuestionsLeft((n) => Math.max(0, n - 1)), [])

  const addQuestions = useCallback(
    (n) => {
      setQuestionsLeft((q) => q + n)
      showToast(`${n} questions added`)
    },
    [showToast],
  )

  /**
   * Spend against the wallet. Same name and same single home as before, and
   * the same `false` when it refuses — but it is now a PROMISE, so every
   * caller must `await` it. `if (spend(...))` is always truthy and would let
   * through a purchase the server refused.
   *
   * `amount` stays in rupees because that is what the catalogue in mock.js is
   * denominated in. It is converted to paise here, once, at the only place
   * that talks to the server. Nothing above this line ever sees paise and
   * nothing below it ever sees rupees.
   *
   * The server decides. This function never compares against `balance` — that
   * number is a read of a cache and a devtools-editable one at that; the
   * refusal comes from wallet_debit() under a row lock, and the toast below
   * shows the reason the server gave.
   */
  const spend = useCallback(
    async (amount, label) => {
      if (spendingRef.current) return false
      spendingRef.current = true
      setSpending(true)
      try {
        const { data, error } = await supabase.rpc('wallet_debit', {
          p_amount_paise: Math.round(amount * 100),
          p_kind: label,
        })
        if (error) {
          console.error('[wallet] debit failed:', error.message)
          showToast('Could not reach the wallet. Try again.')
          return false
        }
        if (!data?.ok) {
          showToast(data?.reason ?? 'Could not take that payment.')
          // A refusal can carry the real balance — take it, in case the number
          // on screen was the thing that was wrong.
          if (typeof data?.balance_paise === 'number') setBalance(data.balance_paise)
          return false
        }
        setBalance(data.balance_paise)
        // The row itself — id and timestamp — only exists on the server.
        refreshWallet(session?.user?.id)
        return true
      } finally {
        spendingRef.current = false
        setSpending(false)
      }
    },
    [showToast, refreshWallet, session],
  )

  const openChat = useCallback((tab = 'ai') => {
    setChatTab(tab)
    setChatOpen(true)
  }, [])

  /** Buy now — charge the wallet directly and skip the cart entirely.
   *  Async, because `spend` is. Callers must await it too. */
  const buyNow = useCallback(
    async (product) => {
      if (await spend(product.price, product.name)) {
        showToast(`Ordered · ${product.name}`)
        return true
      }
      return false
    },
    [spend, showToast],
  )

  /* `me` is rebuilt only when the side flips, not on every render — it feeds
     the shared TabHeader, so a fresh object each time would rerender all five
     tabs for nothing. */
  const me = useMemo(
    () =>
      isPro
        ? { ...pro, profileTo: '/pro/profile', homeTo: '/pro/studio' }
        : { ...user, profileTo: '/profile', homeTo: '/home' },
    [isPro],
  )

  // Hooks must stay unconditional; this list is just the public surface.
  const value = useMemo(
    () => ({
      isPro,
      me,
      birth,
      setBirthField,
      session,
      sessionReady,
      profile,
      profileLoading,
      refreshProfile,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      cartOpen,
      setCartOpen,
      buyNow,
      questionsLeft,
      spendQuestion,
      addQuestions,
      hasFlag,
      toggleFlag,
      balance,
      ledger,
      spend,
      spending,
      refreshWallet,
      chatOpen,
      setChatOpen,
      chatTab,
      setChatTab,
      openChat,
      horoscopeOpen,
      setHoroscopeOpen,
      toast,
      showToast,
      lang,
      setLang,
      t,
      chartSystem,
      setChartSystem,
    }),
    [
      isPro,
      me,
      birth,
      setBirthField,
      session,
      sessionReady,
      profile,
      profileLoading,
      refreshProfile,
      cart,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      cartOpen,
      buyNow,
      questionsLeft,
      spendQuestion,
      addQuestions,
      hasFlag,
      toggleFlag,
      balance,
      ledger,
      spend,
      spending,
      refreshWallet,
      chatOpen,
      chatTab,
      openChat,
      horoscopeOpen,
      toast,
      showToast,
      lang,
      t,
      chartSystem,
    ],
  )

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>
}

export function useStore() {
  const ctx = useContext(AppStore)
  if (!ctx) throw new Error('useStore must be used inside <AppProvider>')
  return ctx
}

/**
 * Paise to a rupee string. The only place in the app where money becomes
 * text, which is what keeps the division from spreading — every other layer
 * holds integers (backend/INSTRUCTIONS.md rule 1).
 */
export function rupees(paise) {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

/**
 * A `ledger` row in the shape the wallet and profile screens already read.
 * `amountPaise` rather than `amount` on purpose: the old field held rupees,
 * and a row carrying the same name with a hundred-fold different value is the
 * bug this rename exists to make impossible.
 */
function toLedgerRow(row) {
  return {
    id: row.id,
    label: row.kind,
    kind: row.delta_paise > 0 ? 'credit' : 'debit',
    amountPaise: Math.abs(row.delta_paise),
    date: formatLedgerDate(row.created_at),
    method: row.ref_type === 'payment' ? 'UPI' : 'Wallet',
  }
}

function formatLedgerDate(iso) {
  const at = new Date(iso)
  const mins = Math.round((Date.now() - at) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function formatSqlTime(hms) {
  let [h, min] = hms.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`
}

function initialsOf(name) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/**
 * The real `profiles` row, shaped the way the screens already expect to read
 * it, merged with the mock user for the fields the backend doesn't compute
 * yet. Sun/moon/rising need the ephemeris service (phase 7, unbuilt), so
 * those stay seed data until then — identity and birth details are real the
 * moment a profile exists.
 */
export function useProfileFields() {
  const { profile } = useStore()

  return {
    name: profile?.name || user.name,
    initials: profile ? initialsOf(profile.name) : user.initials,
    birthDate: profile?.birth_date ? formatIsoDate(profile.birth_date) : user.birthDate,
    birthTime: profile?.birth_time ? formatSqlTime(profile.birth_time) : user.birthTime,
    birthPlace: profile?.birth_place || user.birthPlace,
    sunSign: user.sunSign,
    moonSign: user.moonSign,
    risingSign: user.risingSign,
  }
}
