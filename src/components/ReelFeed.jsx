import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clips } from '../data/mock.js'
import Plate from './Plate.jsx'
import {
  Acts,
  Avatar,
  Button,
  firstName,
} from './Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Vertical reel player.
 *
 * Snap-scrolls one reel per screen, the way the format is understood
 * everywhere else. Shared by the Home "Reels" mode and the standalone
 * `/reels/:id` route, which is why the chrome lives outside this component.
 *
 * What is deliberately NOT borrowed from the reference is the overlay: white
 * text laid over the frame is the reference app's least readable surface, and
 * at this palette it would be worse. The caption and the actions sit in a
 * hairline-separated strip beneath the plate instead — the frame stays a
 * frame, the text stays on paper.
 */
export default function ReelFeed({ startId, onIndexChange, syncUrl = false }) {
  const navigate = useNavigate()
  const scroller = useRef(null)

  const startIndex = Math.max(
    0,
    clips.findIndex((c) => c.id === startId),
  )
  const [index, setIndex] = useState(startIndex)
  const [paused, setPaused] = useState(false)

  // Jump straight to the tapped reel rather than animating past the others.
  useEffect(() => {
    const el = scroller.current
    if (el && startIndex > 0) el.scrollTop = el.clientHeight * startIndex
  }, [startIndex])

  const onScroll = () => {
    const el = scroller.current
    if (!el || !el.clientHeight) return
    const next = Math.round(el.scrollTop / el.clientHeight)
    if (next !== index && clips[next]) {
      setIndex(next)
      onIndexChange?.(next)
      if (syncUrl) navigate(`/reels/${clips[next].id}`, { replace: true })
    }
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain"
    >
      {clips.map((c, i) => (
        <ReelFrame
          key={c.id}
          reel={c}
          paused={paused}
          onTogglePlay={() => setPaused((p) => !p)}
          isLast={i === clips.length - 1}
        />
      ))}
    </div>
  )
}

function ReelFrame({ reel: c, paused, onTogglePlay, isLast }) {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const liked = hasFlag(`like:${c.id}`)
  const following = hasFlag(`follow:${c.consultantId}`)

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
        <div className="flex items-center gap-3">
          <Link
            to={`/consult/${c.consultantId}`}
            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-60"
          >
            <Avatar initials={c.initials} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-meta text-t1">{c.consultant}</span>
              <span className="block text-micro uppercase tracking-caps text-t3">
                {isLast ? 'Last reel' : 'Swipe up for the next'}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() =>
              toggleFlag(`follow:${c.consultantId}`, {
                on: `Following ${firstName(c.consultant)}`,
                off: `Unfollowed ${firstName(c.consultant)}`,
              })
            }
            className={`flex-none border px-3 py-1.5 text-micro uppercase tracking-caps transition-colors ${
              following ? 'border-t1 bg-t1 text-bg' : 'border-rule text-t2 hover:border-t1'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        <p className="mt-4 text-read text-t1">{c.caption}</p>
        <p className="mt-2 text-micro uppercase tracking-caps text-t3">{c.audio}</p>

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
            { label: 'Share', onClick: () => showToast('Reel link copied') },
            {
              label: 'Save',
              onLabel: 'Saved',
              on: hasFlag(`save:${c.id}`),
              onClick: () =>
                toggleFlag(`save:${c.id}`, {
                  on: 'Saved to your reels',
                  off: 'Removed from your reels',
                }),
            },
          ]}
        />

        {/* The commercial hook sits inside the content, not beside it. */}
        <Button to={`/consult/${c.consultantId}`} variant="solid" className="mt-5">
          Book a session
        </Button>
      </div>
    </section>
  )
}
