import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, consultants, liveSessions, SESSION } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopAvatar, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { firstName, Search } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * The three promo banners at the top of Consult — same object as Shop's, a
 * gradient block with one CTA, just themed for this roster. Kept as a local
 * const rather than a mock.js export: Shop.jsx set that precedent (its own
 * BANNERS array lives in the screen file), and there is no banner data
 * anywhere in mock.js to be consistent with instead.
 */
const BANNERS = [
  {
    id: 'bn-verified',
    kicker: 'Verified',
    title: 'Astrologers you can trust',
    note: 'Every expert screened and credential-checked. No exceptions.',
    cta: 'See astrologers',
    art: 'orbit',
    from: '#4338ca',
    to: '#818cf8',
  },
  {
    id: 'bn-first',
    kicker: 'Today only',
    title: `First session at ${SESSION.label}`,
    note: `${SESSION.promise}, any astrologer online.`,
    cta: 'Claim offer',
    art: 'halftone',
    from: '#14532d',
    to: '#4d9463',
  },
  {
    id: 'bn-refer',
    kicker: 'Refer a friend',
    title: 'Earn credit per referral',
    note: 'They get a discount. You get credit toward your next call.',
    cta: 'Refer now',
    art: 'contour',
    from: '#92660f',
    to: '#d29a2b',
  },
]

/** How each channel is actually delivered. */
const CHANNELS = {
  call: { icon: 'phone', label: 'Call' },
  chat: { icon: 'chat', label: 'Chat' },
  live: { icon: 'live', label: 'Live' },
}

export default function Consult() {
  const { showToast, openChat, hasFlag, toggleFlag } = useStore()
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const [slide, setSlide] = useState(0)
  const rail = useRef(null)
  const listRef = useRef(null)

  const step = (el) =>
    el.children[1] ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth

  const onRailScroll = (e) => {
    const i = Math.round(e.currentTarget.scrollLeft / step(e.currentTarget))
    if (i !== slide) setSlide(Math.min(Math.max(i, 0), BANNERS.length - 1))
  }

  const goTo = (i) => {
    const el = rail.current
    if (el) el.scrollTo({ left: i * step(el), behavior: 'smooth' })
  }

  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const filters = ['All', ...categories]
  const q = query.trim().toLowerCase()
  const list = consultants.filter((c) => {
    const inCat = cat === 'All' || c.category === cat
    const inQuery =
      !q ||
      [c.name, c.specialization, c.category, ...c.languages].some((f) =>
        f.toLowerCase().includes(q),
      )
    return inCat && inQuery
  })

  const online = consultants.filter((c) => c.online)

  const liveNow = liveSessions.filter((l) => l.live)
  const [featured, ...alsoLive] = liveNow
  const upcoming = liveSessions.filter((l) => !l.live)

  return (
    <>
      <TabHeader />

      <Search value={query} onChange={setQuery} placeholder="Search by name, concern or language" />

      {/* ── Banners ─────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <div ref={rail} onScroll={onRailScroll} className="rail gap-3 px-4">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                if (b.id === 'bn-verified') scrollToList()
                else if (b.id === 'bn-refer') showToast('Opening invite — prototype only')
                else showToast('Offer — prototype only')
              }}
              className="banner w-[86%] p-5 text-left"
              style={{
                backgroundImage: `linear-gradient(135deg, ${b.from} 0%, ${b.to} 100%)`,
                animation: `pop-in .5s cubic-bezier(.2,.7,.3,1) ${i * 80}ms backwards`,
              }}
            >
              <Plate
                seed={b.id}
                variant={b.art}
                className="pointer-events-none absolute -right-8 -top-6 h-[150%] w-2/3 animate-float bg-transparent opacity-25 mix-blend-overlay"
              />
              <span className="sheen animate-sweep" style={{ animationDelay: `${i * 2}s` }} />

              <span className="relative block">
                <span className="caps-sm text-white/70">{b.kicker}</span>
                <span className="mt-2.5 block max-w-[16ch] text-title font-medium leading-tight text-white">
                  {b.title}
                </span>
                <span className="mt-2 block max-w-[26ch] text-meta text-white/75">{b.note}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 caps-sm text-ink shadow-md">
                  {b.cta} <span aria-hidden="true">→</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3.5 flex justify-center gap-1.5">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              aria-current={slide === i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                slide === i ? 'w-6 bg-ink' : 'w-1.5 bg-black/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Category chips ─────────────────────────────────────────────── */}
      <div className="relative mt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {filters.map((f) => {
            const count = f === 'All' ? consultants.length : consultants.filter((c) => c.category === f).length
            return (
              <button
                key={f}
                type="button"
                aria-pressed={cat === f}
                onClick={() => setCat(f)}
                className="pill caps-sm tnum"
              >
                {f} · {count}
              </button>
            )
          })}
        </div>
        <span className="scroll-fade" aria-hidden="true" />
      </div>

      {/* ── Unlimited questions, N min — who is online right now ─────────── */}
      <section className="pt-6">
        <div className="mb-3 flex items-baseline justify-between px-4">
          <p className="font-display text-lead t-heading">
            {SESSION.promise} in {SESSION.label}
          </p>
          <span className="flex-none caps-sm text-ok">{online.length} online</span>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {online.map((c) => (
            <div key={c.id} className="pop-card w-36 flex-none p-3.5 text-center">
              <PopAvatar initials={c.initials} size={64} online className="mx-auto" />
              <p className="mt-2.5 truncate text-meta t-heading">{c.name}</p>
              <p className="mt-0.5 truncate caps-sm t-faint">{c.specialization.split(' · ')[0]}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="caps-sm gold tnum">{c.rating}</span>
                <span className="text-meta t-heading tnum">₹{c.price.toLocaleString('en-IN')}</span>
              </div>
              <PopButton variant="gold" size="sm" className="mt-2.5" to={`/consult/${c.id}`}>
                Book
              </PopButton>
            </div>
          ))}
        </div>
      </section>

      {/* ── On air now ─────────────────────────────────────────────────────
          Folded in from the old Live mode rather than dropped: the featured
          stream, the rest of what's airing, and what's coming up next are
          real, deliberately-built content the mockup doesn't show but that
          has nowhere else to live now that Live is a per-card action. */}
      {featured && (
        <section className="pt-8">
          <Kicker className="px-5">On air now</Kicker>

          <div className="mt-3 px-4">
            <Link to={`/live/${featured.id}`} className="relative block overflow-hidden rounded-2xl shadow-lg">
              <Plate seed={featured.id} variant="orbit" className="!rounded-none aspect-[16/9] w-full !shadow-none" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
              />
              <span className="absolute left-3 top-3 flex items-center gap-2">
                <span className="badge-live">● Live</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm tnum">
                  {featured.viewers} watching
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white ring-1 ring-white/40">
                    {featured.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-meta font-semibold text-white">
                      {featured.topic}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.08em] text-white/65">
                      {featured.consultant} · started {featured.startedAgo} ago
                    </span>
                  </span>
                  <span className="flex-none rounded-xl bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-ink shadow-md">
                    Join
                  </span>
                </span>
              </span>
            </Link>
          </div>

          {alsoLive.length > 0 && (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {alsoLive.map((l) => (
                <Link
                  key={l.id}
                  to={`/live/${l.id}`}
                  className="w-44 flex-none transition-opacity hover:opacity-80"
                >
                  <Plate seed={l.id} variant="orbit" className="aspect-video w-full">
                    <span className="absolute left-2 top-2">
                      <span className="badge-live">● Live</span>
                    </span>
                  </Plate>
                  <p className="mt-2 truncate text-meta t-heading">{l.topic}</p>
                  <p className="mt-0.5 truncate caps-sm t-faint">{l.consultant}</p>
                </Link>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mt-4 space-y-3 px-4">
              {upcoming.map((l) => {
                const reminded = hasFlag(`remind:${l.id}`)
                return (
                  <PopCard key={l.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <PopAvatar initials={l.initials} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="text-body t-heading">{l.topic}</p>
                        <p className="mt-1 caps-sm t-faint tnum">
                          {l.consultant} · {l.startsIn}
                        </p>
                      </div>
                      <PopTag>{l.tag}</PopTag>
                    </div>
                    <PopButton
                      variant={reminded ? 'gold' : 'default'}
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        toggleFlag(`remind:${l.id}`, {
                          on: 'You will be reminded',
                          off: 'Reminder removed',
                        })
                      }
                    >
                      {reminded ? 'Reminder set' : 'Remind me'}
                    </PopButton>
                  </PopCard>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Available now — the full roster ───────────────────────────── */}
      <section ref={listRef} className="px-5 pt-8">
        <p className="mb-3 caps-sm t-faint">
          Every session is {SESSION.label} · {SESSION.promise.toLowerCase()}
        </p>

        <Kicker>
          {`${list.length} ${list.length === 1 ? 'person' : 'people'} · ${online.length} online`}
        </Kicker>

        <ul className="mt-4 space-y-3">
          {list.map((c) => (
            <li key={c.id} className="pop-card p-4">
              <Link
                to={`/consult/${c.id}`}
                className="flex items-start gap-4 transition-opacity hover:opacity-60"
              >
                <PopAvatar initials={c.initials} size={56} online={c.online} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-body text-t1">{c.name}</span>
                    <span className="flex-none text-body text-t1 tnum">
                      ₹{Math.round(c.price / SESSION.mins)}
                      <span className="text-meta text-t3">/min</span>
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-meta text-t3">{c.specialization}</span>
                  <span className="mt-1.5 flex items-center gap-2 text-micro uppercase tracking-caps text-t3 tnum">
                    <span className="gold">{c.rating}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.experience}</span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {c.languages.map((lang) => (
                      <span key={lang} className="rounded-md border border-stroke bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-t2">
                        {lang}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>

              {/* Call is a permanent stub — no calling infra exists. Chat opens
                  the real panel. Live goes straight to the real room when the
                  consultant actually has one running; online does not mean
                  broadcasting, so when they don't, it's the same honest toast
                  as Call rather than a fake destination. */}
              <div className="mt-4 flex items-center gap-2 border-t border-rule pt-4">
                {['call', 'chat', 'live'].map((kind) => {
                  const liveSession =
                    kind === 'live' && c.online && liveSessions.find((l) => l.consultantId === c.id && l.live)
                  const onClick = liveSession
                    ? undefined
                    : kind === 'call'
                      ? () => showToast(`Calling ${firstName(c.name)} — prototype only`)
                      : kind === 'chat'
                        ? () => openChat('live')
                        : () => showToast(`${firstName(c.name)} isn't live right now — prototype only`)

                  return (
                    <PopButton
                      key={kind}
                      size="sm"
                      variant={kind === 'live' ? 'gold' : 'ghost'}
                      full={false}
                      className="flex-1"
                      disabled={!c.online}
                      to={liveSession ? `/live/${liveSession.id}` : undefined}
                      onClick={onClick}
                    >
                      <Icon name={CHANNELS[kind].icon} size={15} />
                      <span className="ml-1.5">{CHANNELS[kind].label}</span>
                    </PopButton>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <p className="py-10 text-center text-meta text-t3">
            Nobody matches that. Clear the search or pick another category.
          </p>
        )}
      </section>

      <div className="h-24" />
    </>
  )
}
