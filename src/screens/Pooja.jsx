import { useEffect, useRef, useState } from 'react'
import { deities, offerings } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Field } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Mandir — e-puja only.
 *
 * Nothing here books a pandit or takes a payment. The ritual happens on the
 * screen: pick a deity, ring the bell, offer flowers, light the diya and dhoop,
 * run the aarti. That is the whole product, so the shrine gets the screen and
 * the copy stays out of its way.
 *
 * The murti is a real painting — the shrine is the one place in this app that
 * carries photographs, because a drawn idol was always the weakest thing on
 * the screen. Each deity ships three or four, the seeker picks, and the
 * arch that used to stand in for one is gone rather than layered on top of
 * art that already has its own architecture.
 *
 * Everything that moves is still drawn over it: halo, diyas, dhoop, bell,
 * petals, the aarti lamp on its circle.
 */
export default function Pooja() {
  const { showToast } = useStore()
  const [deity, setDeity] = useState(deities[0])
  const [pic, setPic] = useState(0)
  const [lit, setLit] = useState({ diya: false, incense: false })
  const [aarti, setAarti] = useState(false)
  const [ringing, setRinging] = useState(false)
  const [petals, setPetals] = useState([])
  const [ripples, setRipples] = useState([])
  const [count, setCount] = useState(0)
  const seq = useRef(0)

  // Petals and ripples are one-shot animations; drop them once they finish so
  // the DOM does not fill up over a long session.
  useEffect(() => {
    if (!petals.length) return
    const t = setTimeout(() => setPetals((p) => p.slice(8)), 3600)
    return () => clearTimeout(t)
  }, [petals])

  useEffect(() => {
    if (!ripples.length) return
    const t = setTimeout(() => setRipples((r) => r.slice(1)), 1000)
    return () => clearTimeout(t)
  }, [ripples])

  const ripple = () => {
    seq.current += 1
    setRipples((r) => [...r, seq.current])
  }

  const offer = (key, says) => {
    setCount((c) => c + 1)
    ripple()
    if (key === 'bell') {
      setRinging(true)
      setTimeout(() => setRinging(false), 1400)
    }
    if (key === 'flower') {
      seq.current += 1
      const base = seq.current
      setPetals((p) => [
        ...p,
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `${base}-${i}`,
          left: 8 + Math.random() * 84,
          delay: Math.random() * 0.7,
          scale: 0.7 + Math.random() * 0.6,
        })),
      ])
    }
    if (key === 'diya') setLit((l) => ({ ...l, diya: !l.diya }))
    if (key === 'incense') setLit((l) => ({ ...l, incense: !l.incense }))
    showToast(says)
  }

  return (
    <>
      <TabHeader action={<PopTag tone="gold">e-puja</PopTag>} />

      {/* ── Choose a deity ─────────────────────────────────────────────── */}
      <section className="px-2 pb-1 pt-3">
        <ul className="no-scrollbar flex gap-1 overflow-x-auto px-2">
          {deities.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                aria-pressed={deity.id === d.id}
                onClick={() => {
                  setDeity(d)
                  setPic(0)
                }}
                className="tile w-[72px]"
              >
                {/* The face is the murti, so the pressed-in "on" state cannot
                    show through it. Selection reads as full colour against
                    faded neighbours instead. */}
                <span className="tile-face overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}deities/${d.images[0].f}`}
                    alt=""
                    loading="lazy"
                    className={`h-full w-full object-cover transition duration-200 ${
                      deity.id === d.id ? '' : 'opacity-50 saturate-50'
                    }`}
                  />
                </span>
                <span
                  className={`caps-sm leading-tight ${deity.id === d.id ? 't-heading' : 't-body'}`}
                >
                  {d.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── The shrine ─────────────────────────────────────────────────── */}
      <section className="px-4 pt-2">
        <PopCard raised className="relative overflow-hidden">
          <Shrine deity={deity} pic={pic} lit={lit} aarti={aarti} ringing={ringing} />

          {/* Petals fall over the whole niche. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {petals.map((p) => (
              <span
                key={p.id}
                className="animate-petal absolute top-0 block h-2 w-2 rounded-full bg-gold-fill"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  transform: `scale(${p.scale})`,
                }}
              />
            ))}
          </span>

          {/* One ring per offering, from the centre. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {ripples.map((r) => (
              <span
                key={r}
                className="animate-ripple absolute block h-28 w-28 rounded-full border border-gold-fill"
              />
            ))}
          </span>

          <div className="relative border-t border-stroke p-4">
            <p className="caps-sm gold">{deity.aarti}</p>
            <p className="mt-1.5 text-meta t-sub">{deity.line}</p>
          </div>
        </PopCard>
      </section>

      {/* ── Which murti ────────────────────────────────────────────────── */}
      <section className="px-4 pt-3">
        <ul className="no-scrollbar flex gap-2 overflow-x-auto">
          {deity.images.map((im, i) => (
            <li key={im.f}>
              <button
                type="button"
                aria-pressed={pic === i}
                aria-label={im.label}
                onClick={() => setPic(i)}
                className={`block h-16 w-[52px] overflow-hidden rounded-md border transition ${
                  pic === i ? 'border-ink shadow-md' : 'border-stroke opacity-60'
                }`}
              >
                <img
                  src={`${import.meta.env.BASE_URL}deities/${im.f}`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-snug t-faint">
          {deity.images[pic].label} · {deity.images[pic].credit} · Wikimedia Commons
        </p>
      </section>

      {/* ── Offerings ──────────────────────────────────────────────────── */}
      <section className="px-4 pt-4">
        <ul className="flex items-start justify-around">
          {offerings.map((o) => {
            const on = o.key === 'diya' ? lit.diya : o.key === 'incense' ? lit.incense : false
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => offer(o.key, o.says)}
                  aria-pressed={on || undefined}
                  className="tile w-[76px]"
                >
                  <span className={`tile-face ${on ? 'tile-face-on' : ''}`}>
                    <OfferingGlyph kind={o.key} on={on} />
                  </span>
                  <span className="caps-sm leading-tight t-body">{o.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex items-center gap-2">
          <PopButton
            variant={aarti ? 'ghost' : 'gold'}
            className="flex-1"
            full={false}
            onClick={() => {
              setAarti((a) => !a)
              ripple()
              showToast(aarti ? 'Aarti ended' : 'Aarti begun')
            }}
          >
            {aarti ? 'End aarti' : 'Begin aarti'}
          </PopButton>
          <PopButton
            variant="ghost"
            className="flex-1"
            full={false}
            onClick={() => showToast('Sangeet — prototype has no audio')}
          >
            Sangeet
          </PopButton>
        </div>

        {count > 0 && (
          <p className="mt-4 text-center caps-sm t-faint tnum">
            {count} {count === 1 ? 'offering' : 'offerings'} today
          </p>
        )}
      </section>

      {/* ── What this is ───────────────────────────────────────────────── */}
      <section className="mt-6 border-t border-rule px-5 py-6">
        <Kicker>{deity.name}</Kicker>
        <div className="mt-3">
          <Field k="Graha" v={deity.graha} />
          <Field k="Day" v={deity.day} />
          <Field k="Aarti" v={deity.aarti} />
        </div>
        <p className="mt-4 text-meta t-sub">
          <span className="caps-sm t-faint">For · </span>
          {deity.forWhat}
        </p>
        <p className="mt-5 text-meta t-faint">
          This is an e-puja and only an e-puja. No pandit is engaged, no samagri is sourced and
          nothing is charged. What you do here you do yourself.
        </p>
      </section>

      <div className="h-24" />
    </>
  )
}

/**
 * The shrine.
 *
 * A real painting fills the niche and everything ritual is drawn on top of it.
 * The bottom scrim is not decoration — the diyas and the dhoop have to sit on
 * something, and every painting has a different floor.
 *
 * Nothing here masks the art into an arch. Most of these murtis were painted
 * inside their own throne or temple already, and a second arch over the top
 * cropped the composition to nothing.
 */
function Shrine({ deity, pic, lit, aarti, ringing }) {
  const image = deity.images[pic]

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#efe9df] to-[#e2dbd0]">
      <img
        key={image.f}
        src={`${import.meta.env.BASE_URL}deities/${image.f}`}
        alt={`${deity.name} — ${image.label}`}
        className="animate-fade absolute inset-0 h-full w-full object-cover"
      />

      {/* Lamp light over the murti, always breathing. */}
      <span
        aria-hidden="true"
        className="animate-halo absolute left-1/2 top-[38%] block h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(227,166,60,.55) 0%, rgba(227,166,60,0) 70%)' }}
      />

      {/* The step. Gives the diyas a floor and settles the painting into the card. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 block h-[22%]"
        style={{
          background:
            'linear-gradient(180deg, rgba(233,227,217,0) 0%, rgba(233,227,217,.5) 52%, rgba(226,219,208,.86) 100%)',
        }}
      />
      <svg
        viewBox="0 0 200 250"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M34 240h132M28 232h144" stroke="rgba(28,26,25,.18)" strokeWidth="1.4" fill="none" />
      </svg>

      {/* Two diyas on the step. The flame only exists when lit. */}
      {['left-[26%]', 'right-[26%]'].map((pos) => (
        <span key={pos} className={`absolute bottom-[13%] ${pos}`} aria-hidden="true">
          <span className="relative block h-4 w-9 rounded-b-full border border-black/20 bg-[#c9a227]" />
          {lit.diya && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span
                className="animate-flicker block h-5 w-3 origin-bottom rounded-full"
                style={{
                  background: 'radial-gradient(circle at 50% 70%, #fff6d8 0%, #f4b942 45%, rgba(244,185,66,0) 72%)',
                }}
              />
            </span>
          )}
        </span>
      ))}

      {/* Dhoop, at the right of the step. */}
      {lit.incense && (
        <span aria-hidden="true" className="absolute bottom-[14%] right-[14%]">
          <span className="block h-6 w-[2px] bg-[#8a6a3a]" />
          {[0, 1.2, 2.4].map((d) => (
            <span
              key={d}
              className="animate-smoke absolute -top-1 left-1/2 block h-6 w-3 -translate-x-1/2 rounded-full bg-black/15 blur-[2px]"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </span>
      )}

      {/* The aarti lamp travelling its circle in front of the murti. */}
      {aarti && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[42%] block h-4 w-4 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="animate-aarti block h-4 w-4">
            <span
              className="block h-4 w-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, #fff3cf 0%, #f0a92c 55%, rgba(240,169,44,0) 75%)',
              }}
            />
          </span>
        </span>
      )}

      {/* The bell, hanging at the top right of the arch. */}
      <span
        aria-hidden="true"
        className={`absolute right-[16%] top-[9%] origin-top ${ringing ? 'animate-swing' : ''}`}
      >
        <svg viewBox="0 0 40 54" className="h-12 w-9">
          <path d="M20 4v6" stroke="rgba(28,26,25,.45)" strokeWidth="2" fill="none" />
          <path
            d="M20 10c-8 0-12 7-12 16 0 6-2 10-4 13h32c-2-3-4-7-4-13 0-9-4-16-12-16Z"
            fill="#d8b45a"
            stroke="rgba(28,26,25,.4)"
            strokeWidth="1.4"
          />
          <circle cx="20" cy="45" r="3.2" fill="#c9a227" stroke="rgba(28,26,25,.4)" strokeWidth="1.2" />
        </svg>
      </span>

      <span className="absolute left-3 top-3">
        <PopTag>{deity.day}</PopTag>
      </span>
    </div>
  )
}

/** Small glyphs for the offering row, drawn rather than pulled from Icon. */
function OfferingGlyph({ kind, on }) {
  if (kind === 'bell') return <Icon name="bell" size={22} />
  if (kind === 'flower')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="2.6" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="12" cy="6.4" rx="3" ry="4.4" transform={`rotate(${a} 12 12)`} />
        ))}
      </svg>
    )
  if (kind === 'diya')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M3.6 14.4h16.8a8.4 8.4 0 0 1-16.8 0Z" />
        <path
          d="M12 11.4c0-2.4 1.6-3.6 1.6-5.4 0-1.2-.8-2.4-1.6-3-.8.6-1.6 1.8-1.6 3 0 1.8 1.6 3 1.6 5.4Z"
          className={on ? 'animate-flicker origin-bottom' : ''}
        />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M12 21V9" />
      <path d="M12 8.6c-2.2-1.6-1-4.2 0-5.6 1 1.4 2.2 4-.0 5.6Z" className={on ? 'animate-flicker origin-bottom' : ''} />
    </svg>
  )
}
