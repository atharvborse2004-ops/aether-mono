import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, consultants, timeSlots } from '../data/mock.js'
import { Sheet } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Button, Field, firstName, Search, Ticks } from '../components/Primitives.jsx'
import { Kicker, PopAvatar, PopButton } from '../components/Pop.jsx'
import { useStore } from '../store.jsx'

/** Slots already taken today. Fixed rather than random so the UI is stable. */
const TAKEN = ['13:30', '18:30']

export default function Consult() {
  const { showToast, openChat } = useStore()
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
      <header className="sticky top-0 z-20 flex-none border-b border-stroke bg-bg px-5 py-4">
        <p className="font-display text-lead leading-none t-heading">Consult</p>
        <p className="mt-1 caps-sm t-faint tnum">
          {consultants.filter((c) => c.online).length} of {consultants.length} online now
        </p>
      </header>

      <Search value={query} onChange={setQuery} placeholder="Search by name, concern or language" />

      {/* Filters use the same tracked-caps + underline language as every other
          selector in the app. Nothing here is a pill or a chip — a chip in this
          layout reads as a button, and these do not commit to anything. */}
      <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-rule px-5 py-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`caps-sm flex-none border-b-2 pb-1 transition-colors ${
              cat === f ? 'border-gold gold' : 'border-transparent t-faint'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reports sit above the roster: a report is the other way to get a
          reading, and the one that does not need a calendar. */}
      <section className="border-b border-rule px-5 py-5">
        <Kicker action="See all" to="/reports">
          Reports
        </Kicker>
        <Link
          to="/reports"
          className="pop-card mt-3 flex items-center gap-3 p-3 transition-colors hover:border-gold"
        >
          <Plate seed="reports" className="h-14 w-14 flex-none" />
          <span className="min-w-0 flex-1">
            <span className="block text-meta t-heading">Written readings, from ₹1,347</span>
            <span className="mt-1 block caps-sm t-faint">
              Natal · career · synastry · year ahead
            </span>
          </span>
          <span className="flex-none caps-sm gold">→</span>
        </Link>
      </section>

      <section className="px-5 py-6">
        <Kicker>{`${list.length} ${list.length === 1 ? 'person' : 'people'}`}</Kicker>
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

              {/* Chat and Book, on the row. Both were on the card in the
                  previous layout and both are how people actually start. */}
              <div className="mt-4 flex gap-3">
                <PopButton onClick={() => openChat('live')}>Chat</PopButton>
                <PopButton variant="gold" onClick={() => openBooking(c)}>
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
