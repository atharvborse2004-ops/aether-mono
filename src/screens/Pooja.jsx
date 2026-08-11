import { useEffect, useRef, useState } from 'react'
import { deities, offerings } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { PopTag } from '../components/Pop.jsx'
import { Dhoop, Diya, Ghanti, Marigold, Thali } from '../components/PujaProps.jsx'
import { useStore } from '../store.jsx'

/**
 * Mandir — e-puja only, and it does not scroll.
 *
 * That is the whole layout rule. You cannot perform an aarti while hunting for
 * the thali, so the shrine takes every pixel between the deity row and the tab
 * bar, and every prop — bells, offerings, thali, sangeet — sits on the image
 * rather than under it. Nothing on this screen is below the fold because there
 * is no fold.
 *
 * Consequence worth knowing before you add anything: this is the one screen in
 * the app whose root is a fixed-height flex column instead of a scrolling
 * stack. A new section does not go at the bottom, it goes on the image or it
 * goes in the murti sheet. If neither fits, it does not belong here.
 *
 * Nothing books a pandit, nothing is charged, and there is no audio.
 */
export default function Pooja() {
  const { showToast } = useStore()
  const [deity, setDeity] = useState(deities[0])
  const [pic, setPic] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [lit, setLit] = useState({ diya: false, incense: false })
  const [aarti, setAarti] = useState(false)
  const [ringing, setRinging] = useState(false)
  const [petals, setPetals] = useState([])
  const [ripples, setRipples] = useState([])
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

  const image = deity.images[pic]

  return (
    /* relative, because the murti sheet is absolute against this screen rather
       than against the phone frame — it should not cover the tab bar. */
    <div className="relative flex h-full flex-col">
      <TabHeader action={<PopTag tone="gold">e-puja</PopTag>} />

      {/* ── Choose a deity ─────────────────────────────────────────────── */}
      <section className="flex-none px-2 pb-2 pt-2">
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
                className="tile w-[68px]"
              >
                {/* The face is the murti, so the pressed-in "on" state cannot
                    show through it. Selection reads as full colour against
                    faded neighbours instead. */}
                <span className="tile-face !h-[52px] !w-[52px] overflow-hidden">
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

      {/* ── The shrine, taking whatever is left ────────────────────────── */}
      <section className="relative min-h-0 flex-1 overflow-hidden bg-[#e9e3d9]">
        <img
          key={image.f}
          src={`${import.meta.env.BASE_URL}deities/${image.f}`}
          alt={`${deity.name} — ${image.label}`}
          className="animate-fade absolute inset-0 h-full w-full object-cover"
        />

        {/* Lamp light over the murti, always breathing. */}
        <span
          aria-hidden="true"
          className="animate-halo absolute left-1/2 top-[38%] block h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{ background: 'radial-gradient(circle, rgba(227,166,60,.5) 0%, rgba(227,166,60,0) 70%)' }}
        />

        {/* Petals fall the whole height of the shrine. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {petals.map((p) => (
            /* Marigold petals, not gold confetti — an ellipse tipped off
               axis reads as a petal at 8px where a circle reads as a dot. */
            <span
              key={p.id}
              className="animate-petal absolute top-0 block h-3 w-2"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                transform: `scale(${p.scale}) rotate(${(p.left % 5) * 14 - 28}deg)`,
                borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
                background: 'linear-gradient(160deg, #f7b733 0%, #e8871e 62%, #c25e10 100%)',
              }}
            />
          ))}
        </span>

        {/* One ring per offering, from the centre. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {ripples.map((r) => (
            <span
              key={r}
              className="animate-ripple absolute block h-28 w-28 rounded-full border border-gold-fill"
            />
          ))}
        </span>

        <HangingBell side="left" ringing={ringing} />
        <HangingBell side="right" ringing={ringing} />

        {/* ── The offering rail ───────────────────────────────────────── */}
        <ul className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
          {offerings.map((o) => {
            const on = o.key === 'diya' ? lit.diya : o.key === 'incense' ? lit.incense : false
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => offer(o.key, o.says)}
                  aria-pressed={on || undefined}
                  aria-label={o.label}
                  className={`plinth ${on ? 'plinth-on' : ''}`}
                >
                  <OfferingProp kind={o.key} on={on} />
                </button>
              </li>
            )
          })}
        </ul>

        {/* Which murti. A knob rather than a caption, because a caption under
            the image is the one thing this screen is not allowed to have. */}
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label="Choose a murti"
          className="plinth absolute bottom-4 left-3"
        >
          <Icon name="eye" size={19} />
        </button>

        <button
          type="button"
          onClick={() => showToast('Sangeet — prototype has no audio')}
          aria-label="Sangeet"
          className="plinth absolute bottom-4 right-3"
        >
          <SangeetGlyph />
        </button>

        {/* The altar. These stand on the step whether or not they are lit —
            samagri you have not touched yet is still samagri, and a diya that
            only exists once you light it makes the shrine look half-built. */}
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-[27%]"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}
        >
          <Diya size={40} lit={lit.diya} />
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-6 right-[27%]"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}
        >
          <Diya size={40} lit={lit.diya} />
        </span>

        <span
          aria-hidden="true"
          className="absolute bottom-6 left-[15%]"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}
        >
          <Dhoop size={44} lit={lit.incense} />
          {lit.incense &&
            [0, 1.2, 2.4].map((d) => (
              <span
                key={d}
                className="animate-smoke absolute -top-2 left-1/2 block h-7 w-3.5 -translate-x-1/2 rounded-full bg-black/20 blur-[3px]"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
        </span>

        {/* The aarti lamp travelling its circle in front of the murti. */}
        {aarti && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[42%] block h-4 w-4 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="animate-aarti block h-4 w-4">
              <span
                className="block h-4 w-4 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, #fff3cf 0%, #f0a92c 55%, rgba(240,169,44,0) 75%)',
                }}
              />
            </span>
          </span>
        )}

        {/* ── The thali. The one thing on this screen you came to press. ── */}
        <button
          type="button"
          onClick={() => {
            setAarti((a) => !a)
            ripple()
            showToast(aarti ? 'Aarti ended' : 'Aarti begun')
          }}
          aria-pressed={aarti}
          className="group absolute bottom-3 left-1/2 -translate-x-1/2"
        >
          <span className="block" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.45))' }}>
            <Thali size={104} lit={aarti} />
          </span>
          {/* The colours here are inline because every one of this app's
              palette entries is a CSS variable, and Tailwind silently drops an
              opacity modifier it cannot resolve — `bg-ink/70` painted nothing
              at all and left white caps on a cream wall. */}
          <span
            className="mx-auto mt-1 block w-fit rounded-full px-2.5 py-0.5 caps-sm text-white backdrop-blur-[2px]"
            style={{ background: 'rgba(14, 14, 16, 0.72)' }}
          >
            {aarti ? 'End aarti' : 'Aarti'}
          </span>
        </button>

      </section>

      {sheet && (
        <MurtiSheet
          deity={deity}
          pic={pic}
          onPick={(i) => {
            setPic(i)
            setSheet(false)
          }}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  )
}

/**
 * The murti picker, and the only place the attribution lives.
 *
 * That is not a detail to tidy away: four of the Hanuman murtis are CC BY and
 * three more across Durga and Shani are share-alike. The licence needs a
 * credit somewhere a person can reach, and the shrine itself is not allowed to
 * carry text. If this sheet goes, the images have to go with it.
 */
function MurtiSheet({ deity, pic, onPick, onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-black/45"
      />
      <div className="animate-fade-rise relative rounded-t-3xl bg-surface p-4 shadow-xl">
        <p className="caps-sm t-faint">{deity.name} · murti</p>
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {deity.images.map((im, i) => (
            <li key={im.f}>
              <button
                type="button"
                aria-pressed={pic === i}
                aria-label={im.label}
                onClick={() => onPick(i)}
                className={`block h-24 w-[68px] overflow-hidden rounded-lg border transition ${
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
        <p className="mt-3 text-[11px] leading-snug t-faint">
          {deity.images[pic].label} · {deity.images[pic].credit} · Wikimedia Commons
        </p>
      </div>
    </div>
  )
}

/** A ghanti on its chain, hung in a top corner of the niche. */
function HangingBell({ side, ringing }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 origin-top ${side === 'left' ? 'left-[6%]' : 'right-[6%]'} ${
        ringing ? 'animate-swing' : ''
      }`}
      style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.45))' }}
    >
      <Ghanti size={86} hanging />
    </span>
  )
}

function SangeetGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  )
}

/** What the rail shows: the samagri itself, not a symbol for it. */
function OfferingProp({ kind, on }) {
  if (kind === 'bell') return <Ghanti size={26} />
  if (kind === 'flower') return <Marigold size={25} />
  if (kind === 'diya') return <Diya size={26} lit={on} />
  return <Dhoop size={26} lit={on} />
}
