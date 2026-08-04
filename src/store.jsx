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
