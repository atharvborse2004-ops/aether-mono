import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, consultants, timeSlots } from '../data/mock.js'
import { Sheet } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Field, firstName, Search, Ticks } from '../components/Primitives.jsx'
import { TabHeader } from '../components/Chrome.jsx'
import { Kicker, PopAvatar, PopButton } from '../components/Pop.jsx'
import { useStore } from '../store.jsx'

/** Slots already taken today. Fixed rather than random so the UI is stable. */
const TAKEN = ['13:30', '18:30']

/**
 * The four entry points across the top. Each is either a route or an action on
 * this screen — nothing here opens a dead end.
 */
const FEATURES = [
  { key: 'reports', label: 'Reports', icon: 'reports', to: '/reports' },
  {
    key: 'pooja',
    label: 'Pooja',
    icon: 'pooja',
    act: ({ showToast }) => showToast('Pooja booking — prototype only'),
  },
  { key: 'tarot', label: 'Tarot', icon: 'tarot', act: ({ setCat }) => setCat('Tarot') },
  {
    key: 'horoscope',
    label: 'Horoscope',
    icon: 'horoscope',
    act: ({ setHoroscopeOpen }) => setHoroscopeOpen(true),
  },
]

export default function Consult() {
  const { showToast, openChat, setHoroscopeOpen } = useStore()
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  // Quick booking without leaving the list. The full profile is still one tap
  // away — this is for people who already know who they want.
  const [booking, setBooking] = useState(null)
  const [duration, setDuration] = useState(null)
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
    setDuration(c.slots[c.slots.length > 1 ? 1 : 0])
    setSlot(null)
  }

  // Priced per session against the 15-minute base, rounded to the nearest ten.
  const priceFor = (c, mins) => Math.round((c.price * (parseInt(mins, 10) / 15)) / 10) * 10

  return (
    <>
      <TabHeader />

      <Search value={query} onChange={setQuery} placeholder="Search by name, concern or language" />

      {/* Filters use the same tracked-caps + underline language as every other
          selector in the app. Nothing here is a pill or a chip — a chip in this
          layout reads as a button, and these do not commit to anything. */}
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

      {/* Four ways in, as circles across the top. Reports used to be a wide
          card below the filters; as one of four peers it takes a quarter of
          the room and reads as a choice rather than an advert. */}
      <section className="px-2 pb-1 pt-1">
        <ul className="flex items-start justify-around">
          {FEATURES.map((f) => (
            <li key={f.key}>
              {f.to ? (
                <Link to={f.to} className="tile w-[76px]">
                  <span className="tile-face">
                    <Icon name={f.icon} size={23} />
                  </span>
                  <span className="caps-sm leading-tight t-body">{f.label}</span>
                </Link>
              ) : (
                <button type="button" onClick={() => f.act({ setCat, setHoroscopeOpen, showToast })} className="tile w-[76px]">
                  <span className="tile-face">
                    <Icon name={f.icon} size={23} />
                  </span>
                  <span className="caps-sm leading-tight t-body">{f.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 py-6">
        <Kicker>{`${list.length} ${list.length === 1 ? 'person' : 'people'} · ${
          consultants.filter((c) => c.online).length
        } online`}</Kicker>
        <ul className="mt-4 space-y-3">
          {list.map((c) => (
            <li key={c.id} className="pop-card p-4">
              <Link
                to={`/consult/${c.id}`}
                className="flex items-start gap-4 transition-opacity hover:opacity-60"
              >
                <PopAvatar initials={c.initials} size={44} online={c.online} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-body text-t1">{c.name}</span>
                    {c.online && (
                      <span className="flex-none text-micro uppercase tracking-caps text-t2">
                        Online
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-meta text-t3">{c.specialization}</span>
                  <span className="mt-2 flex items-center gap-3">
                    <Ticks value={Math.round(c.rating)} className="w-16" />
                    <span className="text-micro uppercase tracking-caps text-t3 tnum">
                      {c.rating} · {c.experience} · {c.languages.join(', ')}
                    </span>
                  </span>
                </span>

                <span className="flex-none text-right">
                  <span className="block text-body text-t1 tnum">₹{c.price}</span>
                  <span className="block text-micro uppercase tracking-caps text-t3">Session</span>
                </span>
              </Link>

              {/* Message, call and book. The first two are glyphs so the
                  booking CTA keeps the width — three labelled buttons on a
                  card this size wrap onto two lines. */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Message ${firstName(c.name)}`}
                  onClick={() => openChat('live')}
                  className="pill knob !h-10 !w-10 flex-none justify-center"
                >
                  <Icon name="chat" size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Call ${firstName(c.name)}`}
                  onClick={() => showToast(`Calling ${firstName(c.name)} — prototype only`)}
                  className="pill knob !h-10 !w-10 flex-none justify-center"
                >
                  <Icon name="phone" size={18} />
                </button>
                <PopButton variant="gold" className="flex-1" full={false} onClick={() => openBooking(c)}>
                  Book a slot
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

      <div className="h-24" />

      <Sheet open={!!booking} onClose={() => setBooking(null)} title="Book a slot">
        {booking && (
          <>
            <div className="mb-10 flex items-center gap-4">
              <PopAvatar initials={booking.initials} size={44} online={booking.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-t1">{booking.name}</p>
                <p className="mt-1 truncate text-micro uppercase tracking-caps text-t3">
                  {booking.rating} · {booking.experience} · {booking.languages.join(', ')}
                </p>
              </div>
            </div>

            <p className="label text-left mb-4">Length</p>
            <div className="mb-10 flex gap-3">
              {booking.slots.map((s) => (
                <Button
                  key={s}
                  variant={duration === s ? 'solid' : 'quiet'}
                  onClick={() => setDuration(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            <p className="label text-left mb-4">Today</p>
            <div className="mb-10 grid grid-cols-3 gap-3">
              {timeSlots.map((t) => {
                const taken = TAKEN.includes(t)
                return (
                  <Button
                    key={t}
                    variant={slot === t ? 'solid' : 'quiet'}
                    disabled={taken}
                    onClick={() => setSlot(t)}
                  >
                    {taken ? <s>{t}</s> : t}
                  </Button>
                )
              })}
            </div>

            <Field k="Consultant" v={booking.name} />
            <Field k="When" v={slot ? `Today, ${slot}` : 'Not picked yet'} />
            <Field k="Length" v={duration} />
            <Field k="Total" v={`₹${priceFor(booking, duration).toLocaleString('en-IN')}`} />

            <PopButton
              className="mt-10"
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
