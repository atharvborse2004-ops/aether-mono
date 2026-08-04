import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { clips } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Acts, Avatar, Button } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Vertical clip player.
 *
 * Snap-scrolls one clip per screen, the way the format is understood
 * everywhere else — a static page with a "next" link is a different product.
 * What is *not* borrowed is the overlay: text laid over the frame is
 * unreadable at the contrast this palette runs at, so the caption and the
 * actions sit in a hairline-separated strip beneath the plate instead.
 */
export default function Clip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scroller = useRef(null)

  const startIndex = clips.findIndex((c) => c.id === id)
  const [index, setIndex] = useState(Math.max(0, startIndex))
  const [paused, setPaused] = useState(false)

  // Jump straight to the tapped clip rather than animating past the others.
  useEffect(() => {
    const el = scroller.current
    if (el && startIndex > 0) el.scrollTop = el.clientHeight * startIndex
  }, [startIndex])

  // Keep the URL and the counter honest while scrolling, so backing out of the
  // fourth clip and returning lands you on the fourth clip.
  const onScroll = () => {
    const el = scroller.current
    if (!el || !el.clientHeight) return
    const next = Math.round(el.scrollTop / el.clientHeight)
    if (next !== index && clips[next]) {
      setIndex(next)
      navigate(`/read/clip/${clips[next].id}`, { replace: true })
    }
  }

  if (startIndex === -1) return <Navigate to="/read" replace />

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Clips" back backTo="/read" sub={`${index + 1} of ${clips.length}`} />

      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar min-h-0 flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-contain"
      >
        {clips.map((c, i) => (
          <ClipFrame
            key={c.id}
            clip={c}
            paused={paused}
            onTogglePlay={() => setPaused((p) => !p)}
            isLast={i === clips.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

function ClipFrame({ clip: c, paused, onTogglePlay, isLast }) {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const liked = hasFlag(`like:${c.id}`)

  return (
    <section className="flex h-full snap-start snap-always flex-col">
      {/* The frame. Tapping it toggles playback — the only gesture this
          screen claims beyond the scroll itself. */}
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={paused ? 'Play' : 'Pause'}
        className="relative min-h-0 flex-1"
      >
        <Plate seed={c.id} className="h-full w-full">
          {/* Progress. A hairline that fills, not a bar that floats. */}
          <span className="absolute inset-x-0 top-0 h-[2px] bg-rule">
            <span className={`block h-full w-1/3 bg-t1 ${paused ? '' : 'animate-breathe'}`} />
          </span>

          {/* On a solid chip, not bare over the engraving — grey caps laid
              straight onto line art are unreadable at any contrast. */}
          <span className="absolute bottom-3 left-3 border border-rule bg-bg px-2 py-1 text-micro uppercase tracking-caps text-t2 tnum">
            {c.views} views · {c.duration}
          </span>

          {paused && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-t1 bg-bg px-4 py-2 text-label uppercase tracking-label text-t1">
              Paused
            </span>
          )}
        </Plate>
      </button>

      {/* The strip. Caption, byline and actions all sit on solid ground. */}
      <div className="flex-none border-t border-rule px-6 py-5">
        <p className="text-read text-t1">{c.caption}</p>
        <p className="mt-2 text-micro uppercase tracking-caps text-t3">{c.audio}</p>

        <div className="mt-5 flex items-center gap-3">
          <Link
            to={`/consult/${c.consultantId}`}
            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-60"
          >
            <Avatar initials={c.initials} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-meta text-t1">{c.consultant}</span>
              <span className="block text-micro uppercase tracking-caps text-t3">
                {isLast ? 'Last clip' : 'Swipe up for the next'}
              </span>
            </span>
          </Link>
          <Button to={`/consult/${c.consultantId}`} variant="solid" className="w-auto flex-none px-4">
            Book
          </Button>
        </div>

        <Acts
          className="mt-5"
          items={[
            {
              label: 'Like',
              onLabel: 'Liked',
              on: liked,
              count: c.likes,
              onClick: () => toggleFlag(`like:${c.id}`),
            },
            {
              label: 'Reply',
              count: c.comments,
              onClick: () => showToast('Replies — prototype only'),
            },
            { label: 'Share', onClick: () => showToast('Clip link copied') },
            {
              label: 'Save',
              onLabel: 'Saved',
              on: hasFlag(`save:${c.id}`),
              onClick: () =>
                toggleFlag(`save:${c.id}`, {
                  on: 'Saved to your clips',
                  off: 'Removed from your clips',
                }),
            },
          ]}
        />
      </div>
    </section>
  )
}
