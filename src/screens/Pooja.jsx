import { useState } from 'react'
import { poojaCategories, poojaIncludes, poojas, timeSlots } from '../data/mock.js'
import { Sheet, TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Field } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Pooja.
 *
 * Booked like a session but delivered by a pandit, and what is being sold is
 * the ritual rather than the hour — so these cards lead with what the pooja is
 * FOR, not with a per-minute rate. Half the reason people abandon a booking
 * like this is not knowing whether the thing applies to them.
 */
export default function Pooja() {
  const { showToast } = useStore()
  const [cat, setCat] = useState('All')
  const [booking, setBooking] = useState(null)
  const [slot, setSlot] = useState(null)

  const list = cat === 'All' ? poojas : poojas.filter((p) => p.category === cat)

  return (
    <>
      <TabHeader />

      <section className="px-5 pb-2 pt-5">
        <PopCard raised className="overflow-hidden">
          <Plate seed="pooja-hero" variant="contour" className="!rounded-none h-32 w-full !shadow-none" />
          <div className="p-5">
            <p className="caps-sm gold">Performed, not sold</p>
            <p className="mt-2 text-lead leading-tight t-heading">
              A pandit, the samagri, and someone who turns up on the right lunar date.
            </p>
            <p className="mt-2 text-meta t-body">
              You do not need to source anything or know the muhurat. Pick the ritual; we handle
              the rest of it.
            </p>
          </div>
        </PopCard>
      </section>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4">
        {poojaCategories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className="pill caps-sm"
          >
            {c}
          </button>
        ))}
      </div>

      <section className="border-b border-rule px-5 py-6">
        <Kicker>{`${list.length} ${list.length === 1 ? 'ritual' : 'rituals'}`}</Kicker>
        <ul className="mt-4 space-y-3">
          {list.map((p) => (
            <li key={p.id} className="pop-card p-4">
              <div className="flex items-start gap-3">
                <Plate seed={p.id} className="h-16 w-16 flex-none" />
                <div className="min-w-0 flex-1">
                  <p className="text-body t-heading">{p.name}</p>
                  <p className="mt-1 caps-sm t-faint tnum">
                    {p.duration} · {p.pandits} pandits
                  </p>
                </div>
                <PopTag tone="gold">₹{p.price.toLocaleString('en-IN')}</PopTag>
              </div>

              <p className="mt-3 text-meta t-sub">
                <span className="caps-sm t-faint">For · </span>
                {p.forWhat}
              </p>
              <p className="mt-2 text-meta t-body">{p.line}</p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Ask about ${p.name}`}
                  onClick={() => showToast('A pandit will call you back')}
                  className="pill knob !h-10 !w-10 flex-none justify-center"
                >
                  <Icon name="phone" size={18} />
                </button>
                <PopButton
                  variant="gold"
                  className="flex-1"
                  full={false}
                  onClick={() => {
                    setBooking(p)
                    setSlot(null)
                  }}
                >
                  Book this pooja
                </PopButton>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 py-6">
        <Kicker>What the price covers</Kicker>
        <ul className="mt-3">
          {poojaIncludes.map((i) => (
            <li key={i} className="flex items-start gap-3 border-b border-rule py-3 last:border-b-0">
              <span className="mt-0.5 flex-none gold" aria-hidden="true">
                <Icon name="check" size={16} weight={2.1} />
              </span>
              <span className="text-meta t-sub">{i}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-meta t-faint">
          A pooja is a thing you do, not a thing that is done to you. Book it for a reason you
          could say out loud.
        </p>
      </section>

      <div className="h-24" />

      <Sheet open={!!booking} onClose={() => setBooking(null)} title={booking ? booking.name : ''}>
        {booking && (
          <>
            <p className="text-meta t-body">{booking.line}</p>

            <p className="label mb-4 mt-8 text-left">Start time</p>
            <div className="mb-8 grid grid-cols-3 gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={slot === t}
                  onClick={() => setSlot(t)}
                  className="pill caps-sm justify-center tnum"
                >
                  {t}
                </button>
              ))}
            </div>

            <Field k="Ritual" v={booking.name} />
            <Field k="Runs for" v={booking.duration} />
            <Field k="When" v={slot ? `Today, ${slot}` : 'Not picked yet'} />
            <Field k="Total" v={`₹${booking.price.toLocaleString('en-IN')}`} />

            <PopButton
              variant="gold"
              className="mt-8"
              disabled={!slot}
              onClick={() => {
                setBooking(null)
                showToast(`Booked · ${booking.name} at ${slot}`)
              }}
            >
              {slot ? `Confirm ${slot}` : 'Pick a time'}
            </PopButton>
            <p className="mt-5 text-center text-meta t-faint">
              Prototype — no payment is taken and no pandit is booked.
            </p>
          </>
        )}
      </Sheet>
    </>
  )
}
