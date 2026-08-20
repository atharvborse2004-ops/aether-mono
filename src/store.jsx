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
 * In-memory store for prototype state (cart count, remaining AI questions,
 * toast messages — still nothing persisted, nothing fetched) plus two things
 * that now are real: `session` and `profile`, backed by Supabase auth and the
 * `profiles` table (phase 1). `birth` stays the in-progress onboarding draft
 * before it is written; once a profile exists, screens read `profile`, not
 * `birth`.
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

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!active) return
      setSession(initial)
      setSessionReady(true)
      if (initial) refreshProfile(initial.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next) refreshProfile(next.user.id)
      else setProfile(null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [refreshProfile])

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

  /* Wallet. The opening balance matches the `user` record so Profile and the
     wallet never disagree on load; every spend and top-up moves this one
     number, and the ledger is prepended to. */
  const [balance, setBalance] = useState(1240)
  const [ledger, setLedger] = useState([])

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

  const addMoney = useCallback(
    (amount) => {
      setBalance((b) => b + amount)
      setLedger((l) => [
        { id: `t${l.length}-${amount}`, label: 'Added money', kind: 'credit', amount, date: 'Just now', method: 'UPI' },
        ...l,
      ])
      showToast(`₹${amount.toLocaleString('en-IN')} added`)
    },
    [showToast],
  )

  /**
   * Spend against the wallet. Returns false and says why when the balance is
   * short, so callers can stop rather than silently going negative — the one
   * piece of money logic in the prototype that has to be right.
   */
  const spend = useCallback(
    (amount, label) => {
      if (amount > balance) {
        showToast('Not enough balance')
        return false
      }
      setBalance((b) => b - amount)
      setLedger((l) => [
        { id: `t${l.length}-${amount}`, label, kind: 'debit', amount, date: 'Just now', method: 'Wallet' },
        ...l,
      ])
      return true
    },
    [balance, showToast],
  )

  const openChat = useCallback((tab = 'ai') => {
    setChatTab(tab)
    setChatOpen(true)
  }, [])

  /** Buy now — charge the wallet directly and skip the cart entirely. */
  const buyNow = useCallback(
    (product) => {
      if (spend(product.price, product.name)) {
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
      addMoney,
      spend,
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
      addMoney,
      spend,
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
