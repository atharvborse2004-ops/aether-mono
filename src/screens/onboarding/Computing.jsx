import { useEffect, useState } from 'react'
import { loadingLines, user } from '../../data/mock.js'
import ChartWheel from '../../components/ChartWheel.jsx'
import { Button, Field, Stub } from '../../components/Primitives.jsx'
import { useStore } from '../../store.jsx'

/**
 * Two beats on one screen: the compute, then the reveal.
 *
 * The loading state does real brand work — naming the data source turns a
 * spinner into a credibility signal. The reveal that follows is the payoff for
 * the four questions, and it does not auto-advance: dumping someone straight
 * into a tab bar throws away the only moment the chart is the whole screen.
 */
export default function Computing() {
  const { birth } = useStore()
  const [step, setStep] = useState(0)

  const done = step >= loadingLines.length
  const name = birth.name || user.name

  useEffect(() => {
    if (done) return undefined
    const t = setTimeout(() => setStep((s) => s + 1), 780)
    return () => clearTimeout(t)
  }, [step, done])

  if (done) {
    return (
      <div className="flex min-h-full animate-fade flex-col px-6 pb-10 pt-12 text-center">
        <p className="text-micro uppercase tracking-caps text-t3">Chart ready</p>
        <h1 className="mx-auto mt-5 max-w-[12ch] text-display font-light">Here you are, {name}.</h1>

        <Stub className="my-10" />
        <ChartWheel size={240} />

        <div className="mx-auto mt-12 w-full max-w-[18rem] text-left">
          <Field k="Sun" v={`${user.sunSign} — how you push`} />
          <Field k="Moon" v={`${user.moonSign} — how you feel`} />
          <Field k="Rising" v={`${user.risingSign} — how you land`} />
        </div>

        <p className="prose-c mt-10">
          Three positions out of eight. The rest are in your chart, and none of them are a verdict.
        </p>

        {/* Both routes land in the tabbed app shell. Sending someone
            straight to /horoscope or /chart dropped them on a screen with no
            bottom nav and no way back — the stranded flow this fixes. */}
        <div className="mt-auto pt-12">
          <Button to="/home" variant="solid">
            Enter Veda
          </Button>
          <p className="mt-4 text-center text-meta text-t3">
            Your chart and today&apos;s reading are both waiting inside.
          </p>
        </div>
      </div>
    )
  }

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
