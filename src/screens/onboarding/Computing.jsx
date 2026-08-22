import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadingLines, user } from '../../data/mock.js'
import ChartWheel from '../../components/ChartWheel.jsx'
import { Button, Field, Stub } from '../../components/Primitives.jsx'
import { useStore } from '../../store.jsx'
import { supabase } from '../../lib/supabase.js'

/** '14/11/1996' -> '1996-11-14'. The onboarding Slot fields are already
 * zero-padded, so this is a reorder, not a parse. */
function toIsoDate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m}-${d}`
}

/** '04:35 AM' -> '04:35:00'. Naive local time — see docs/05-BACKEND-SCHEMA.md
 * §4.1 on why this is never combined with a UTC offset here. */
function to24Hour(hhmmAmpm) {
  const [time, period] = hhmmAmpm.split(' ')
  let [h, min] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
}

/**
 * A token refused on *timing* rather than on identity. Supabase rejects a JWT
 * whose issued-at or expiry does not line up with the server's clock, and the
 * message arrives as raw API text — "JWT issued at future" — which tells the
 * person holding the phone nothing at all.
 *
 * Nearly always a device clock set by hand or left on the wrong zone. The rest
 * is brief skew between Supabase's own nodes. Both clear with a fresh token,
 * which is why the retry below replaces the session rather than resending it.
 */
function isClockSkew(message = '') {
  // The whitespace is optional on purpose: the same condition arrives as both
  // "JWT issued at future" and "JWSError JWTNotYetValid" depending on which
  // layer refuses it.
  return /jwt/i.test(message) && /(future|expired|not\s*yet\s*valid|issued\s*at|\biat\b)/i.test(message)
}

/**
 * Two beats on one screen: the compute, then the reveal.
 *
 * The loading state does real brand work — naming the data source turns a
 * spinner into a credibility signal. The reveal that follows is the payoff for
 * the four questions, and it does not auto-advance: dumping someone straight
 * into a tab bar throws away the only moment the chart is the whole screen.
 *
 * It is also where the birth details stop being a draft in `birth` and become
 * the real `profiles` row — the account already exists (phone verified the
 * step before this one, which is what created it via the auth.users trigger),
 * so this is an UPDATE, not an insert.
 */
export default function Computing() {
  const { birth, session, profile, profileLoading, refreshProfile } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saveError, setSaveError] = useState('')
  // Bumped by the retry button. The write effect keys off it, because clearing
  // the error alone changes none of its other dependencies — the retry would
  // dismiss the message and land on the reveal without writing anything.
  const [attempt, setAttempt] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const written = useRef(false)

  /* Every field the write needs, not just the date. Two reasons: `to24Hour('')`
     returns the string '00:undefined:00', which Postgres rejects as a `time`;
     and a draft saved before the place search carried zones has no `zone`, which
     would write a null birth_zone and quietly cost the chart its offset. Both
     route back to re-answer instead. */
  const draftComplete = Boolean(birth.date && birth.time && birth.place && birth.zone)

  /* The account exists but there is nothing complete to write and nothing
     already stored — the draft was lost between the questions and the code.
     Send them back to re-answer rather than reveal a chart built from seed
     data, which is the same screen as a real one and gives no sign anything
     went wrong. */
  useEffect(() => {
    if (!session || profileLoading || draftComplete || profile?.birth_date) return
    navigate('/onboarding/date', { replace: true })
  }, [session, profile, profileLoading, draftComplete, navigate])

  const done = step >= loadingLines.length
  const name = birth.name || user.name

  useEffect(() => {
    if (done) return undefined
    const t = setTimeout(() => setStep((s) => s + 1), 780)
    return () => clearTimeout(t)
  }, [step, done])

  useEffect(() => {
    if (written.current || !session || !draftComplete) return
    written.current = true

    supabase
      .from('profiles')
      .update({
        name: birth.name,
        // Falls back to what is already stored. Someone sent back to finish a
        // half-written profile skips the email step, so the draft has none —
        // and writing that empty draft straight through would erase an address
        // they had already given.
        email: (birth.email ?? '').trim() || profile?.email || null,
        birth_date: toIsoDate(birth.date),
        birth_time: to24Hour(birth.time),
        birth_time_known: true,
        birth_place: birth.place,
        birth_lat: birth.lat,
        birth_lon: birth.lon,
        // The birth place's zone, carried from AskPlace. Hardcoding this was
        // survivable only while the place list was four Indian cities; with
        // worldwide search it would store India's zone against a London birth
        // and shift every cusp with no error raised anywhere.
        birth_zone: birth.zone,
      })
      .eq('id', session.user.id)
      .then(({ error }) => {
        // Never swallow this. A failed write here still lands on the reveal,
        // which looks identical to a real one — the account then exists with
        // no birth details and nothing on screen ever said so.
        if (error) {
          written.current = false
          setSaveError(error.message)
          return undefined
        }
        return refreshProfile(session.user.id)
      })
  }, [session, birth, draftComplete, profile, refreshProfile, attempt])

  /* Resending a rejected token gets the same rejection, so the retry replaces
     the session before trying again. Without this the button loops forever on a
     clock-skew failure — which is exactly how it behaved in the wild. */
  const retry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await supabase.auth.refreshSession()
    } catch {
      /* Offline, or the refresh token is gone too. Let the write below fail on
         its own terms rather than swallowing the reason here. */
    }
    setSaveError('')
    setRetrying(false)
    setAttempt((a) => a + 1)
  }

  if (saveError) {
    const skew = isClockSkew(saveError)
    return (
      <div className="flex min-h-full animate-fade flex-col justify-center px-6 pb-10 text-center">
        <p className="text-micro uppercase tracking-caps text-t3">Not saved</p>
        <h1 className="mx-auto mt-5 max-w-[16ch] text-display font-light">
          {skew ? 'This phone’s clock is wrong.' : 'Your details didn’t reach us.'}
        </h1>
        <p className="prose-c mt-6">
          {skew
            ? 'Your sign-in was refused because this device has the wrong time. Open Settings, set date and time to automatic, then try again.'
            : 'You’re signed in, but the birth details are still on this device. Try again.'}
        </p>
        <p className="prose-c mt-4">Your answers are still here. Nothing was lost.</p>

        {/* Kept, but demoted. This is a diagnostic for whoever reads the bug
            report, not an instruction for the person stuck on the screen. */}
        <p className="mx-auto mt-6 max-w-measure text-micro uppercase tracking-caps text-t3">
          {saveError}
        </p>

        <div className="mt-12">
          <Button onClick={retry} variant="solid">
            {retrying ? 'Retrying…' : 'Try again'}
          </Button>
        </div>
      </div>
    )
  }

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
            Enter Namo
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
