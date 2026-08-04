import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, consultants, timeSlots } from '../data/mock.js'
import { Sheet, TopBar } from '../components/Chrome.jsx'
import { Avatar, Button, Field, Search, Section, Ticks } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/** Slots already taken today. Fixed rather than random so the UI is stable. */
const TAKEN = ['13:30', '18:30']

export default function Consult() {
  const { showToast } = useStore()
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
      <TopBar title="Consult" sub={`${consultants.filter((c) => c.online).length} online now`} />

      <Search value={query} onChange={setQuery} placeholder="Search by name, concern or language" />

      {/* Filters use the same tracked-caps + underline language as every other
          selector in the app. Nothing here is a pill or a chip — a chip in this
          layout reads as a button, and these do not commit to anything. */}
      <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule px-6 py-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`flex-none border-b pb-1 text-label uppercase tracking-label transition-colors ${
              cat === f ? 'border-t1 text-t1' : 'border-transparent text-t3'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Section label={`${list.length} ${list.length === 1 ? 'person' : 'people'}`} last>
        <ul>
          {list.map((c) => (
            <li key={c.id} className="border-b border-rule py-5">
              <Link
                to={`/consult/${c.id}`}
                className="flex items-start gap-4 transition-opacity hover:opacity-60"
              >
                <Avatar initials={c.initials} size={44} />

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
                <Button
                  variant="quiet"
                  onClick={() => showToast(`Chat request sent to ${c.name.split(' ')[0]}`)}
                >
                  Chat
                </Button>
                <Button variant="solid" onClick={() => openBooking(c)}>
                  Book a slot
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <p className="py-10 text-center text-meta text-t3">
            Nobody matches that. Clear the search or pick another category.
          </p>
        )}
      </Section>

      <div className="h-8" />

      <Sheet open={!!booking} onClose={() => setBooking(null)} title="Book a slot">
        {booking && (
          <>
            <div className="mb-10 flex items-center gap-4">
              <Avatar initials={booking.initials} size={44} />
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

            <Button
              className="mt-10"
              variant="solid"
              disabled={!slot}
              onClick={() => {
                showToast(`Booked · ${booking.name.split(' ')[0]} · today ${slot}`)
                setBooking(null)
              }}
            >
              {slot ? `Confirm ${slot}` : 'Pick a time'}
            </Button>
            <p className="mt-5 text-center text-meta text-t3">
              Prototype — no payment is taken and nothing is booked.
            </p>
          </>
        )}
      </Sheet>
    </>
  )
}
