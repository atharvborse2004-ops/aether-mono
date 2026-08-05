import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/**
 * Tiny in-memory store for prototype-only state: the birth details typed
 * during onboarding, cart count, remaining AI questions, contrast mode and
 * toast messages. Nothing is persisted, nothing is fetched.
 */
const AppStore = createContext(null)

const EMPTY_BIRTH = { name: '', date: '', time: '', place: '' }

export function AppProvider({ children }) {
  const [birth, setBirth] = useState(EMPTY_BIRTH)
  const [cartCount, setCartCount] = useState(2)
  const [questionsLeft, setQuestionsLeft] = useState(5)
  const [highContrast, setHighContrast] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  /* Wallet. The opening balance matches the `user` record so Profile and the
     wallet never disagree on load; every spend and top-up moves this one
     number, and the ledger is prepended to. */
  const [balance, setBalance] = useState(1240)
  const [ledger, setLedger] = useState([])

  /* The chat panel — a right-side overlay rather than a route, so it can be
     opened from any tab and from the floating button without navigating. */
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTab, setChatTab] = useState('live')

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

  // The contrast fix re-points CSS variables on <html>; nothing re-renders.
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) root.setAttribute('data-contrast', 'high')
    else root.removeAttribute('data-contrast')
  }, [highContrast])

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

  const addToCart = useCallback(
    (product) => {
      setCartCount((n) => n + 1)
      showToast(`${product.name} — added`)
    },
    [showToast],
  )

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

  const openChat = useCallback((tab = 'live') => {
    setChatTab(tab)
    setChatOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      birth,
      setBirthField,
      cartCount,
      addToCart,
      questionsLeft,
      spendQuestion,
      addQuestions,
      highContrast,
      setHighContrast,
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
      toast,
      showToast,
    }),
    [
      birth,
      setBirthField,
      cartCount,
      addToCart,
      questionsLeft,
      spendQuestion,
      addQuestions,
      highContrast,
      hasFlag,
      toggleFlag,
      balance,
      ledger,
      addMoney,
      spend,
      chatOpen,
      chatTab,
      openChat,
      toast,
      showToast,
    ],
  )

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>
}

export function useStore() {
  const ctx = useContext(AppStore)
  if (!ctx) throw new Error('useStore must be used inside <AppProvider>')
  return ctx
}
