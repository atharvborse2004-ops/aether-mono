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

const EMPTY_BIRTH = { date: '', time: '', place: '' }

export function AppProvider({ children }) {
  const [birth, setBirth] = useState(EMPTY_BIRTH)
  const [cartCount, setCartCount] = useState(2)
  const [questionsLeft, setQuestionsLeft] = useState(5)
  const [highContrast, setHighContrast] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

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
