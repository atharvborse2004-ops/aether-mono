import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookedSlots, bookings, timeSlots, weekDays } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopAvatar, PopButton, PopTag } from '../components/Pop.jsx'
import { firstName } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Sessions — the queue, the day, and what you are open for.
 *
 * Accept/decline rides the store's existing `flags` Set rather than adding a
 * status slice: two namespaced keys per booking, sticky across navigation, and
 * `toggleFlag` already handles the toast.
 *
 * ponytail: two booleans standing in for a four-state lifecycle. If a third
 * action appears (reschedule), this wants a real status map in the store.
 */

/**
 * How each channel is actually delivered. The consultant's whole job runs
 * through these, so each start button goes somewhere real rather than firing
 * the same toast three times.
 */
const CHANNELS = {
  Chat: { icon: 'chat', verb: 'Open chat' },
  Call: { icon: 'phone', verb: 'Start call' },
  Live: { icon: 'live', verb: 'Go live' },
}

export default function ProSessions() {
  const { hasFlag, toggleFlag, showToast, openChat } = useStore()
  const navigate = useNavigate()
  const [day, setDay] = useState('Thu')

  /** Chat opens the panel, live opens the room, a call is the one stub. */
  const start = (b) => {
    if (b.kind === 'Chat') return openChat('live')
    if (b.kind === 'Live') return navigate('/live/l1')
    return showToast(`Calling ${firstName(b.client)} — prototype only`)
  }

  const decided = (b) => (hasFlag(`accept:${b.id}`) ? 'confirmed' : hasFlag(`decline:${b.id}`) ? 'declined' : b.status)

  const pending = bookings.filter((b) => decided(b) === 'pending')
  const today = bookings.filter((b) => decided(b) === 'confirmed')
  const done = bookings.filter((b) => decided(b) === 'done')

  return (
    <>
      <TabHeader
        action={
          pending.length > 0 ? (
            <PopTag tone="gold">{pending.length} waiting</PopTag>
          ) : null
        }
      />

      {/* ── Requests ───────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>{pending.length === 0 ? 'No requests waiting' : `${pending.length} requests`}</Kicker>

        {pending.length === 0 ? (
          <p className="mt-3 text-meta t-faint">
            Everything is answered. The queue fills again when someone books.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((b) => (
              <li key={b.id} className="pop-card p-4">
                <div className="flex items-start gap-3">
                  <PopAvatar initials={b.initials} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-meta t-heading">{b.client}</p>
                    <p className="mt-0.5 caps-sm t-faint tnum">
                      {b.kind} · {b.duration} · {b.when}
                    </p>
                  </div>
                  <p className="flex-none text-meta gold tnum">₹{b.price.toLocaleString('en-IN')}</p>
                </div>

                {b.note && <p className="mt-3 text-meta t-sub">“{b.note}”</p>}

                <div className="mt-4 flex items-center gap-2">
                  <PopButton
                    size="sm"
                    variant="gold"
                    full={false}
                    className="flex-1"
                    onClick={() =>
                      toggleFlag(`accept:${b.id}`, {
                        on: `Accepted · ${firstName(b.client)} at ${b.at}`,
                        off: 'Acceptance undone',
                      })
                    }
                  >
                    <Icon name="check" size={15} weight={2.1} />
                    <span className="ml-1.5">Accept</span>
                  </PopButton>
                  <PopButton
                    size="sm"
                    variant="ghost"
                    full={false}
                    className="flex-1"
                    onClick={() =>
                      toggleFlag(`decline:${b.id}`, {
                        on: `Declined · ${firstName(b.client)}`,
                        off: 'Back in the queue',
                      })
                    }
                  >
                    <Icon name="close" size={15} weight={2.1} />
                    <span className="ml-1.5">Decline</span>
                  </PopButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Today ──────────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>{`${today.length} confirmed`}</Kicker>
        <ul className="mt-4 space-y-2">
          {today.map((b) => (
            <li key={b.id} className="pop-inset flex items-center gap-3 p-3">
              <span className="w-12 flex-none text-meta tnum t-heading">{b.at}</span>
              <PopAvatar initials={b.initials} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-meta t-heading">{b.client}</span>
                <span className="mt-0.5 block caps-sm t-faint">
                  {b.kind} · {b.duration}
                </span>
              </span>
              {b.startsIn === 'Now' ? (
                <span className="badge-live flex-none">● Now</span>
              ) : (
                <span className="flex-none caps-sm t-faint tnum">in {b.startsIn}</span>
              )}
              <button
                type="button"
                aria-label={`${CHANNELS[b.kind].verb} with ${firstName(b.client)}`}
                onClick={() => start(b)}
                className="pill knob !h-9 !w-9 flex-none justify-center"
              >
                <Icon name={CHANNELS[b.kind].icon} size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Availability ───────────────────────────────────────────────────
          A week rather than a single day. Sold slots come from the same
          `bookedSlots` the seeker's booking sheet reads, so the two views
          cannot disagree about what is gone. */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Availability</Kicker>
        <p className="mt-2 text-meta t-body">
          Tap to close a slot. Struck-through slots are already sold and cannot be pulled.
        </p>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {weekDays.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={day === d}
              onClick={() => setDay(d)}
              className="pill caps-sm flex-none"
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {timeSlots.map((t) => {
            // Only today's sales are known; other days are all open.
            const sold = day === 'Thu' && bookedSlots.includes(t)
            const closed = hasFlag(`closed:${day}:${t}`)
            return (
              <button
                key={t}
                type="button"
                disabled={sold}
                aria-pressed={!sold && !closed}
                onClick={() =>
                  toggleFlag(`closed:${day}:${t}`, {
                    on: `${day} ${t} closed`,
                    off: `${day} ${t} open again`,
                  })
                }
                className="pill caps-sm justify-center tnum"
              >
                {sold ? <s>{t}</s> : t}
              </button>
            )
          })}
        </div>

        <p className="mt-4 caps-sm t-faint">
          {timeSlots.filter((t) => !hasFlag(`closed:${day}:${t}`) && !(day === 'Thu' && bookedSlots.includes(t))).length}{' '}
          open on {day}
        </p>
      </section>

      {/* ── Done ───────────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Kicker action="Earnings" to="/pro/earnings">
          Finished
        </Kicker>
        <ul className="mt-3">
          {done.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-4 border-b border-rule py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-meta t-sub">{b.client}</span>
                <span className="mt-0.5 block caps-sm t-faint">{b.when}</span>
              </span>
              <span className="flex-none text-meta tnum t-heading">
                ₹{b.price.toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="h-24" />
    </>
  )
}
