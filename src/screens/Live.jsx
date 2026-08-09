import { Link } from 'react-router-dom'
import { consultants, liveSessions } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopAvatar, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { firstName } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Live — astrologers and sessions.
 *
 * The centrepiece is a round CTA, borrowed from CRED's circular payment
 * accent. It is the one curved shape on the screen (the floating AI button is
 * the other in the app), which is precisely why it reads as the action rather
 * than as decoration.
 */
export default function Live() {
  const { showToast, hasFlag, toggleFlag, openChat } = useStore()

  const liveNow = liveSessions.filter((l) => l.live)
  // The top room plays in full; the others list beneath it.
  const [featured, ...rest] = liveNow
  const upcoming = liveSessions.filter((l) => !l.live)
  const online = consultants.filter((c) => c.online)

  return (
    <>
      <TabHeader action={<PopTag tone="live">● {liveNow.length} on air</PopTag>} />

      {/* ── The featured stream ────────────────────────────────────────
          A tab about video should open with video. This was a 160px circle
          reading "Join Live" above a paragraph — an ad for the content rather
          than the content. The top room now plays full-bleed at 4:5, and the
          join action sits on it. */}
      {featured && (
        <section className="px-4 pt-4">
          <Link to={`/live/${featured.id}`} className="relative block overflow-hidden rounded-2xl shadow-lg">
            <Plate seed={featured.id} variant="orbit" className="!rounded-none aspect-[4/5] w-full !shadow-none" />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent"
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
        </section>
      )}

      {/* ── Live now ──────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Also on air</Kicker>
        <ul className="mt-4 space-y-5">
          {rest.map((l) => (
            <li key={l.id}>
              <Link to={`/live/${l.id}`} className="block transition-opacity hover:opacity-80">
                <Plate seed={l.id} variant="orbit" className="aspect-video w-full">
                  <span className="absolute left-3 top-3">
                    <span className="badge-live">● Live</span>
                  </span>
                  <span className="caps-sm absolute right-3 top-3 border border-stroke bg-bg px-2 py-1 t-sub tnum">
                    {l.viewers} watching
                  </span>
                </Plate>

                <div className="mt-3 flex items-start gap-3">
                  <PopAvatar initials={l.initials} size={34} online />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body t-heading">{l.topic}</span>
                    <span className="mt-1 block caps-sm t-faint tnum">
                      {l.consultant} · started {l.startedAgo} ago
                    </span>
                  </span>
                  <PopTag tone="live">{l.tag}</PopTag>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Astrologers online ────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker action="See all" to="/consult">
          Astrologers online
        </Kicker>
        <ul className="mt-4 space-y-3">
          {online.map((c) => (
            <li key={c.id}>
              <PopCard className="flex items-center gap-3 p-3">
                <Link to={`/consult/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <PopAvatar initials={c.initials} size={40} online />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-meta t-heading">{c.name}</span>
                    <span className="mt-0.5 block truncate caps-sm t-faint">
                      {c.specialization}
                    </span>
                  </span>
                </Link>
                <div className="flex flex-none items-center gap-2">
                  <p className="text-meta gold tnum">₹{c.price}</p>
                  <button
                    type="button"
                    aria-label={`Message ${firstName(c.name)}`}
                    onClick={() => openChat('live')}
                    className="pill knob !h-9 !w-9 flex-none justify-center"
                  >
                    <Icon name="chat" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Call ${firstName(c.name)}`}
                    onClick={() => showToast(`Calling ${firstName(c.name)} — prototype only`)}
                    className="pill knob !h-9 !w-9 flex-none justify-center"
                  >
                    <Icon name="phone" size={16} />
                  </button>
                </div>
              </PopCard>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Upcoming ──────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Kicker>Upcoming</Kicker>
        <ul className="mt-4 space-y-3">
          {upcoming.map((l) => {
            const reminded = hasFlag(`remind:${l.id}`)
            return (
              <li key={l.id}>
                <PopCard className="p-4">
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
                    onClick={() =>
                      toggleFlag(`remind:${l.id}`, {
                        on: 'You will be reminded',
                        off: 'Reminder removed',
                      })
                    }
                    className="mt-4"
                  >
                    {reminded ? 'Reminder set' : 'Remind me'}
                  </PopButton>
                </PopCard>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="h-24" />
    </>
  )
}
