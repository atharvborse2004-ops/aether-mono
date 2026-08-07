import { Link } from 'react-router-dom'
import { consultants, liveSessions } from '../data/mock.js'
import { TabHeader } from '../components/Chrome.jsx'
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
  const { showToast, hasFlag, toggleFlag } = useStore()

  const liveNow = liveSessions.filter((l) => l.live)
  const upcoming = liveSessions.filter((l) => !l.live)
  const online = consultants.filter((c) => c.online)

  return (
    <>
      <TabHeader action={<PopTag tone="live">● {liveNow.length} on air</PopTag>} />

      {/* ── The circular CTA ──────────────────────────────────────────────
          One object, centred, with a hard halo instead of a blurred glow —
          NeoPOP has no blur, so the "glow" is drawn as concentric rings. */}
      <section className="border-b border-rule px-5 py-10 text-center">
        <Link
          to={liveNow[0] ? `/live/${liveNow[0].id}` : '/consult'}
          className="is-round mx-auto flex h-40 w-40 flex-col items-center justify-center border-2 border-gold bg-surface transition-transform active:translate-y-[2px]"
          style={{ boxShadow: '0 0 0 1px rgba(212,162,76,0.4), 0 0 0 10px rgba(212,162,76,0.07)' }}
        >
          <span className="caps-sm gold">Join</span>
          <span className="mt-1 font-display text-title leading-none t-heading">Live</span>
          <span className="mt-1.5 caps-sm t-faint tnum">{liveNow.length} on air</span>
        </Link>

        <p className="mx-auto mt-8 max-w-measure text-meta t-body">
          Free to watch. Asking in the room is free too — it gets answered if it is useful to
          everyone, which yours may not be.
        </p>
      </section>

      {/* ── Live now ──────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Live now</Kicker>
        <ul className="mt-4 space-y-5">
          {liveNow.map((l) => (
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
                <div className="flex-none text-right">
                  <p className="text-meta gold tnum">₹{c.price}</p>
                  <PopButton
                    onClick={() => showToast(`Call requested · ${firstName(c.name)}`)}
                    full={false}
                    className="mt-2 px-3 py-1.5"
                  >
                    Call
                  </PopButton>
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
