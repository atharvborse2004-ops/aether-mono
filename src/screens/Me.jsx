import { sessionHistory, user } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import ChartWheel from '../components/ChartWheel.jsx'
import { Avatar, Field, Row, Section, Stub } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

export default function Me() {
  const { highContrast, setHighContrast, cartCount, questionsLeft } = useStore()

  return (
    <>
      <TopBar title="Me" />

      <section className="section pt-10 text-center">
        <Avatar initials={user.initials} size={56} />
        <h1 className="mt-5 text-title font-light">{user.name}</h1>
        <p className="mt-2 text-micro uppercase tracking-caps text-t3">
          {user.sunSign} sun · {user.moonSign} moon · {user.risingSign} rising
        </p>
        <Stub className="my-8" />
        <ChartWheel size={180} />
      </section>

      <Section label="Birth data">
        <Field k="Date" v={user.birthDate} />
        <Field k="Time" v={user.birthTime} />
        <Field k="Place" v={user.birthPlace} />
        <p className="mt-5 text-meta text-t3">
          Change any of these and every reading in the app changes with it. That is the point of
          asking so precisely.
        </p>
      </Section>

      <Section label="Everything else">
        <Row to="/people" title="People" note="Charts you have read against yours" />
        <Row to="/ask" title="Ask the Stars" meta={`${questionsLeft} left`} />
        <Row to="/notifications" title="Notifications" note="One a day, at eight" />
        <Row to="/premium" title="Premium" note="Reports, Eros, more questions" />
        <Row to="/shop" title="Shop" meta={`${cartCount} in cart`} />
      </Section>

      <Section label="Wallet">
        <Field k="Balance" v={`₹${user.walletBalance.toLocaleString('en-IN')}`} />
        <Field k="Questions" v={questionsLeft} />
      </Section>

      {/* Accessibility control. The reference palette puts grey text on black at
          ratios that fail WCAG AA; this raises every grey token by one step
          without changing a single layout decision. */}
      <Section label="Display">
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          aria-pressed={highContrast}
          className="flex w-full items-center justify-between gap-4 border-b border-rule py-4 text-left transition-opacity hover:opacity-60"
        >
          <span>
            <span className="block text-body text-t1">Increase contrast</span>
            <span className="mt-1 block text-meta text-t3">
              Raises every grey. Nothing else moves.
            </span>
          </span>
          <span className="flex-none text-label uppercase tracking-label text-t1">
            {highContrast ? 'On' : 'Off'}
          </span>
        </button>
      </Section>

      <Section label="Past sessions">
        <ul>
          {sessionHistory.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-4 border-b border-rule py-4 last:border-b-0"
            >
              <Avatar initials={s.initials} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-t1">{s.consultant}</span>
                <span className="mt-1 block text-micro uppercase tracking-caps text-t3 tnum">
                  {s.type} · {s.date}
                </span>
              </span>
              <span className="flex-none text-right">
                <span className="block text-meta text-t1 tnum">
                  {s.amount ? `₹${s.amount.toLocaleString('en-IN')}` : '—'}
                </span>
                <span className="block text-micro uppercase tracking-caps text-t3">{s.status}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="About this build" last>
        <p className="prose-c">
          Aether Mono. A front-end layout prototype — no backend, no auth, no network calls. Every
          value on screen comes from one hardcoded file.
        </p>
        <Row to="/onboarding" title="Run onboarding again" className="mt-8" />
      </Section>

      <div className="h-8" />
    </>
  )
}
