import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadingLines } from '../../data/mock.js'
import { Stub } from '../../components/Primitives.jsx'

/**
 * The loading state does real brand work: naming the data source turns a spinner
 * into a credibility signal. It is the reason people believe the output, so it
 * gets its own screen rather than a spinner in a corner.
 */
export default function Computing() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= loadingLines.length) {
      const done = setTimeout(() => navigate('/today', { replace: true }), 700)
      return () => clearTimeout(done)
    }
    const t = setTimeout(() => setStep((s) => s + 1), 780)
    return () => clearTimeout(t)
  }, [step, navigate])

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <Stub />
      <ul className="mt-10 w-full max-w-measure">
        {loadingLines.map((line, i) => (
          <li
            key={line}
            className="flex items-center justify-between gap-4 py-3 transition-opacity duration-500"
            style={{ opacity: i < step ? 1 : i === step ? 0.55 : 0.18 }}
          >
            <span className="text-meta text-t2">{line}</span>
            <span className="flex-none text-micro uppercase tracking-caps text-t3">
              {i < step ? 'Done' : i === step ? '···' : ''}
            </span>
          </li>
        ))}
      </ul>
      <Stub className="mt-10" />
      <p className="mt-10 text-center text-micro uppercase tracking-caps text-t3">
        Positions from NASA JPL ephemerides
      </p>
    </div>
  )
}
