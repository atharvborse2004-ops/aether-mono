import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookedSlots, bookings, pro, timeSlots, weekDays } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopAvatar, PopButton, PopTag } from '../components/Pop.jsx'
import { Segmented, firstName } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Consult — everything that runs today's practice, bundled: who is asking,
 * who is booked, and how you reach them. Sessions/Chat/Call are one screen
 * rather than three routes because they are three views onto the same
 * roster, not three separate places (mirrors how Live folded into the
 * seeker's own Consult tab as a mode).
 */
const TABS = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'chat', label: 'Chat' },
  { key: 'call', label: 'Call' },
]

export default function ProConsult() {
  const { hasFlag, toggleFlag, openChat } = useStore()
  const [tab, setTab] = useState('sessions')

  const pending = bookings.filter((b) => decided(b, hasFlag) === 'pending')

  // Online/offline rides the same flags Set the slot grid below uses — a
  // namespaced key, no new store slice. `pro.online` is the seed default;
  // the flag only ever pushes it to offline.
  const online = pro.online && !hasFlag(`offline:${pro.id}`)

  return (
    <>
      <TabHeader
        action={pending.length > 0 ? <PopTag tone="gold">{pending.length} waiting</PopTag> : null}
      />

      {/* ── Availability, on the main app ─────────────────────────────────
          The one control that isn't a subsection: whether clients see you as
          bookable at all. Separate from the per-slot grid further down,
          which is about *when*, not *whether*. */}
      <section className="px-5 pb-2 pt-5">
        <div className="pop-card flex items-center gap-3 p-4">
          <span
            className={`h-2.5 w-2.5 flex-none rounded-full ${online ? 'bg-ok' : 'bg-t4'}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-meta t-heading">
              {online ? 'Online to clients' : 'Offline'}
            </span>
            <span className="mt-0.5 block caps-sm t-faint">
              {online
                ? 'Visible and bookable on the main app'
                : 'Hidden from new bookings until you go back online'}
            </span>
          </span>
          <PopButton
            size="sm"
            variant={online ? 'ghost' : 'gold'}
            full={false}
            onClick={() =>
              toggleFlag(`offline:${pro.id}`, {
                on: 'You are offline to clients',
                off: 'You are online again',
              })
            }
          >
            {online ? 'Go offline' : 'Go online'}
          </PopButton>
        </div>
      </section>

      <div className="px-4 pt-4">
        <Segmented items={TABS} value={tab} onChange={setTab} />
      </div>

      <div key={tab} className="animate-fade">
        {tab === 'sessions' && <Sessions />}
        {tab === 'chat' && <Chat onOpen={() => openChat('live')} />}
        {tab === 'call' && <Call />}
      </div>

      <div className="h-24" />
    </>
  )
}

function decided(b, hasFlag) {
  return hasFlag(`accept:${b.id}`) ? 'confirmed' : hasFlag(`decline:${b.id}`) ? 'declined' : b.status
}

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

/**
 * Sessions — the queue, the day, and what you are open for. Ported from the
 * old standalone /pro/sessions route unchanged, minus its own TabHeader
 * (Consult owns one now).
 *
 * ponytail: two booleans standing in for a four-state lifecycle. If a third
 * action appears (reschedule), this wants a real status map in the store.
 */
function Sessions() {
  const { hasFlag, toggleFlag, showToast, openChat } = useStore()
  const navigate = useNavigate()
  const [day, setDay] = useState('Thu')

  /** Chat opens the panel, live opens the room, a call is the one stub. */
  const start = (b) => {
    if (b.kind === 'Chat') return openChat('live')
    if (b.kind === 'Live') return navigate('/live/l1')
    return showToast(`Calling ${firstName(b.client)} — prototype only`)
  }

  const decidedStatus = (b) => decided(b, hasFlag)

  const pending = bookings.filter((b) => decidedStatus(b) === 'pending')
  const today = bookings.filter((b) => decidedStatus(b) === 'confirmed')
  const done = bookings.filter((b) => decidedStatus(b) === 'done')

  return (
    <>
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
              {/* Prototype-only: prefills /chart with this client's mock
                  birth data, but the diagram itself still renders the seed
                  user's own placements — there is no chart-calculation
                  service yet. Chart.jsx flags that on screen rather than
                  presenting a stranger's chart as if it were really computed. */}
              <Link
                to={`/chart?name=${encodeURIComponent(b.client)}&date=${encodeURIComponent(b.birthDate)}&time=${encodeURIComponent(b.birthTime)}`}
                aria-label={`View ${firstName(b.client)}'s kundli`}
                className="pill knob !h-9 !w-9 flex-none justify-center"
              >
                <Icon name="kundli" size={16} />
              </Link>
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
        <Kicker action="Earnings" to="/pro/profile/earnings">
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
    </>
  )
}

/** Chat — the store already owns the whole inbox; this is the entry point. */
function Chat({ onOpen }) {
  return (
    <section className="px-5 py-6">
      <Kicker>Messages</Kicker>
      <button type="button" onClick={onOpen} className="pop-card pop-tap mt-4 flex w-full items-center gap-3 p-4">
        <span className="pill knob !h-10 !w-10 flex-none justify-center">
          <Icon name="chat" size={18} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-meta t-heading">Open your inbox</span>
          <span className="mt-0.5 block caps-sm t-faint">Every client thread, in one panel</span>
        </span>
      </button>
    </section>
  )
}

/** Call — a stub like today. Real dialling needs a video/voice SDK (Phase 11, unbuilt). */
function Call() {
  const { showToast } = useStore()
  return (
    <section className="px-5 py-6">
      <Kicker>Incoming calls</Kicker>
      <button
        type="button"
        onClick={() => showToast('Calling — prototype only')}
        className="pop-card pop-tap mt-4 flex w-full items-center gap-3 p-4"
      >
        <span className="pill knob !h-10 !w-10 flex-none justify-center">
          <Icon name="phone" size={18} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-meta t-heading">Pick up</span>
          <span className="mt-0.5 block caps-sm t-faint">Prototype only — no call actually connects</span>
        </span>
      </button>
    </section>
  )
}
