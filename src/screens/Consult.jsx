import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookedSlots, categories, consultants, SESSION, timeSlots } from '../data/mock.js'
import { Sheet, TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopAvatar, PopButton } from '../components/Pop.jsx'
import { Field, firstName, Search, Ticks } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'
import { LiveBody } from './Live.jsx'

/**
 * Consulting has modes, not pages: the same roster reached four ways. Talk now
 * (call or chat), watch now (live), or arrange it for later (booking).
 *
 * They are local state rather than routes because /consult/:id is already the
 * consultant profile — /consult/call would resolve as a consultant with the id
 * "call".
 */
const MODES = [
  { key: 'call', label: 'Call', icon: 'phone' },
  { key: 'chat', label: 'Chat', icon: 'chat' },
  { key: 'live', label: 'Live', icon: 'live' },
  { key: 'booking', label: 'Booking', icon: 'calendar' },
]

export default function Consult() {
  const { showToast, openChat } = useStore()
  const [mode, setMode] = useState('call')
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  // Quick booking without leaving the list. The full profile is still one tap
  // away — this is for people who already know who they want.
  const [booking, setBooking] = useState(null)
  const [slot, setSlot] = useState(null)

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

  const openBooking = (c) => {
    setBooking(c)
    setSlot(null)
  }

  return (
    <>
      <TabHeader />

      {/* The four ways in, directly under the wordmark. They were a sub-nav
          pinned above the tab bar; as circles at the top they are the first
          thing on the screen rather than the last, and they reuse the `.tile`
          shape Home already uses instead of a second bar competing with the
          real one. The `.subnav` CSS is kept in index.css, so going back is a
          markup change. */}
      <section className="px-2 pb-1 pt-3">
        <ul className="flex items-start justify-around">
          {MODES.map((m) => (
            <li key={m.key}>
              <button
                type="button"
                aria-pressed={mode === m.key}
                onClick={() => setMode(m.key)}
                className="tile w-[76px]"
              >
                <span className={`tile-face ${mode === m.key ? 'tile-face-on' : ''}`}>
                  <Icon name={m.icon} size={22} weight={mode === m.key ? 2.1 : 1.7} />
                </span>
                <span
                  className={`caps-sm leading-tight ${mode === m.key ? 't-heading' : 't-body'}`}
                >
                  {m.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {mode === 'live' ? (
        <LiveBody />
      ) : (
        <>
          <Search
            value={query}
            onChange={setQuery}
            placeholder="Search by name, concern or language"
          />

          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={cat === f}
                onClick={() => setCat(f)}
                className="pill caps-sm"
              >
                {f}
              </button>
            ))}
          </div>

          <section className="px-5 py-6">
            {/* The deal, stated once at the top rather than per card. */}
            <p className="mb-3 caps-sm t-faint">
              Every session is {SESSION.label} · {SESSION.promise.toLowerCase()}
            </p>

            <Kicker>
              {mode === 'booking'
                ? `${list.length} available to book`
                : `${list.length} ${list.length === 1 ? 'person' : 'people'} · ${
                    consultants.filter((c) => c.online).length
                  } online`}
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
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-body text-t1">{c.name}</span>
                        {c.online && (
                          <span className="flex-none text-micro uppercase tracking-caps text-t2">
                            Online
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-meta text-t3">
                        {c.specialization}
                      </span>
                      <span className="mt-2 flex items-center gap-3">
                        <Ticks value={Math.round(c.rating)} className="w-16" />
                        <span className="text-micro uppercase tracking-caps text-t3 tnum">
                          {c.rating} · {c.experience} · {c.languages.join(', ')}
                        </span>
                      </span>
                    </span>

                    <span className="flex-none text-right">
                      <span className="block text-body text-t1 tnum">
                        ₹{Math.round(c.price / SESSION.mins)}/min
                      </span>
                      <span className="block text-micro uppercase tracking-caps text-t3">
                        {SESSION.label}
                      </span>
                    </span>
                  </Link>

                  {/* One row for every mode. Call and message are glyphs — the
                      circles at the top already say which mode you are in, so a
                      card repeating "Call now" said it twice. Booking keeps its
                      words because it is the only one that commits you. */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Call ${firstName(c.name)}`}
                      disabled={!c.online}
                      onClick={() => showToast(`Calling ${firstName(c.name)} — prototype only`)}
                      className="pill knob !h-10 !w-10 flex-none justify-center disabled:opacity-40"
                    >
                      <Icon name="phone" size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Message ${firstName(c.name)}`}
                      disabled={!c.online}
                      onClick={() => openChat('live')}
                      className="pill knob !h-10 !w-10 flex-none justify-center disabled:opacity-40"
                    >
                      <Icon name="chat" size={18} />
                    </button>
                    {/* Pushed to the right edge, not sitting in the run of
                        knobs. Call and message are things you can undo; booking
                        commits money, and putting it a thumb's width away from
                        the other two is how you mis-tap it. */}
                    <PopButton
                      variant="gold"
                      size="sm"
                      className="ml-auto flex-none"
                      full={false}
                      onClick={() => openBooking(c)}
                    >
                      Book · ₹{c.price.toLocaleString('en-IN')}
                    </PopButton>
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
        </>
      )}

      <div className="h-24" />

      <Sheet open={!!booking} onClose={() => setBooking(null)} title="Book a session">
        {booking && (
          <>
            <div className="mb-8 flex items-center gap-4">
              <PopAvatar initials={booking.initials} size={44} online={booking.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-t1">{booking.name}</p>
                <p className="mt-1 truncate text-micro uppercase tracking-caps text-t3">
                  {booking.rating} · {booking.experience} · {booking.languages.join(', ')}
                </p>
              </div>
            </div>

            <p className="label mb-4 text-left">Today</p>
            <div className="mb-8 grid grid-cols-3 gap-2">
              {timeSlots.map((t) => {
                const taken = bookedSlots.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={taken}
                    aria-pressed={slot === t}
                    onClick={() => setSlot(t)}
                    className="pill caps-sm justify-center tnum"
                  >
                    {taken ? <s>{t}</s> : t}
                  </button>
                )
              })}
            </div>

            <Field k="Consultant" v={booking.name} />
            <Field k="When" v={slot ? `Today, ${slot}` : 'Not picked yet'} />
            <Field k="Length" v={SESSION.label} />
            <Field k="Questions" v={SESSION.promise} />
            <Field k="Total" v={`₹${booking.price.toLocaleString('en-IN')}`} />

            <PopButton
              className="mt-8"
              variant="gold"
              disabled={!slot}
              onClick={() => {
                showToast(`Booked · ${firstName(booking.name)} · today ${slot}`)
                setBooking(null)
              }}
            >
              {slot ? `Confirm ${slot}` : 'Pick a time'}
            </PopButton>
            <p className="mt-5 text-center text-meta text-t3">
              Prototype — no payment is taken and nothing is booked.
            </p>
          </>
        )}
      </Sheet>
    </>
  )
}
