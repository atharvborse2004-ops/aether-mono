import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { days, liveSessions, posts, reads, user } from '../data/mock.js'
import Plate from '../components/Plate.jsx'
import ReelFeed from '../components/ReelFeed.jsx'
import {
  Acts,
  Avatar,
  firstName,
  Search,
  Section,
  Segmented,
  Tag,
} from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

const MODES = [
  { key: 'feed', label: 'Feed' },
  { key: 'reels', label: 'Reels' },
  { key: 'live', label: 'Live' },
]

/**
 * Home — three modes behind one switcher, matching the reference app's
 * information architecture exactly: Feed / Reels / Live.
 *
 * The header is a hairline strip rather than floating glass. The reference
 * floats a blurred pill over the timeline; at this palette a blur over white
 * is invisible, so the same job is done by a rule and a sticky position.
 */
export default function Home() {
  const [mode, setMode] = useState('feed')

  return (
    <div className="flex h-full flex-col">
      {/* Header. Avatar into Profile, wordmark, horoscope shortcut, alerts —
          the same four slots as the reference, in the same order. */}
      <header className="sticky top-0 z-20 flex flex-none items-center gap-3 border-b border-rule bg-bg px-4 py-3">
        <Link to="/profile" aria-label="Your profile" className="transition-opacity hover:opacity-60">
          <Avatar initials={user.initials} size={32} />
        </Link>
        <p className="flex-1 text-label uppercase tracking-caps text-t1">Aether</p>
        <Link
          to="/horoscope"
          className="border border-rule px-2.5 py-1 text-micro uppercase tracking-caps text-t2 transition-colors hover:border-t1 hover:text-t1"
        >
          Horoscope
        </Link>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="text-micro uppercase tracking-caps text-t2 transition-opacity hover:opacity-60"
        >
          Alerts <span className="text-t1">●</span>
        </Link>
      </header>

      <Segmented items={MODES} value={mode} onChange={setMode} className="flex-none" />

      {mode === 'reels' ? (
        <div className="min-h-0 flex-1">
          <ReelFeed />
        </div>
      ) : (
        <div key={mode} className="no-scrollbar min-h-0 flex-1 animate-fade overflow-y-auto">
          {mode === 'feed' && <Feed />}
          {mode === 'live' && <Live />}
          <div className="h-8" />
        </div>
      )}
    </div>
  )
}

/** Case-insensitive match across whichever fields a record happens to carry. */
function matches(query, ...fields) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
}

function LiveRail() {
  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule px-6 py-5">
      {liveSessions.map((l) => (
        <Link
          key={l.id}
          to={`/live/${l.id}`}
          className="flex w-14 flex-none flex-col items-center gap-2 transition-opacity hover:opacity-60"
        >
          {/* A live room gets a solid ring, a scheduled one a hairline. That is
              the whole status language — no red dot, no gradient. */}
          <span className={`p-[3px] ${l.live ? 'bg-t1' : 'border border-rule'}`}>
            <span className="block bg-bg p-[2px]">
              <Avatar initials={l.initials} size={38} />
            </span>
          </span>
          <span className="w-full truncate text-center text-micro uppercase tracking-caps text-t3">
            {firstName(l.consultant)}
          </span>
        </Link>
      ))}
    </div>
  )
}

function Byline({ initials, name, role, meta }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar initials={initials} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-meta text-t1">{name}</p>
        {role && <p className="truncate text-micro uppercase tracking-caps text-t3">{role}</p>}
      </div>
      {meta && <span className="flex-none text-micro uppercase tracking-caps text-t3">{meta}</span>}
    </div>
  )
}

function Feed() {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const [query, setQuery] = useState('')

  // Notes and long reads are zip-merged into one stream rather than siloed —
  // the reference app mixes formats in a single timeline and so does this.
  const timeline = useMemo(() => {
    const out = []
    for (let i = 0; i < Math.max(posts.length, reads.length); i += 1) {
      if (posts[i]) out.push({ kind: 'post', data: posts[i] })
      if (reads[i]) out.push({ kind: 'read', data: reads[i] })
    }
    return out
  }, [])

  const list = timeline.filter(({ kind, data }) =>
    kind === 'post'
      ? matches(query, data.consultant, data.role, data.text, data.plate)
      : matches(query, data.title, data.excerpt, data.consultant, data.tag),
  )

  return (
    <>
      <LiveRail />
      <Search value={query} onChange={setQuery} placeholder="Search writers and topics" />

      {list.length === 0 && (
        <p className="py-16 text-center text-meta text-t3">
          Nothing here matches &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {list.map(({ kind, data }) =>
        kind === 'post' ? (
          <PostRow key={data.id} post={data} />
        ) : (
          <ReadRow key={data.id} read={data} />
        ),
      )}

      {/* Horoscope teaser closes the timeline, deep-linking into the tab. */}
      {list.length > 0 && (
        <Section label="Today's reading" last>
          <p className="mx-auto max-w-[16ch] text-center text-title font-light">
            {days.today.headline}
          </p>
          <p className="prose-c mt-6">{days.today.body}</p>
          <Link
            to="/horoscope"
            className="act-link mt-8 block text-center text-label uppercase tracking-label"
          >
            Yesterday, today &amp; tomorrow
          </Link>
        </Section>
      )}
    </>
  )

  function PostRow({ post: p }) {
    const liked = hasFlag(`like:${p.id}`)
    return (
      <article className="section">
        <Link
          to={`/consult/${p.consultantId}`}
          className="block transition-opacity hover:opacity-60"
        >
          <Byline initials={p.initials} name={p.consultant} role={p.role} meta={p.time} />
        </Link>

        <p className="mt-6 text-read text-t1">{p.text}</p>

        {p.plate && <Plate seed={p.id} className="mt-6 h-40 w-full" label={p.plate} />}

        <Acts
          className="mt-7"
          items={[
            {
              label: 'Like',
              onLabel: 'Liked',
              on: liked,
              count: (p.likes + (liked ? 1 : 0)).toLocaleString('en-IN'),
              onClick: () => toggleFlag(`like:${p.id}`),
            },
            { label: 'Reply', count: p.comments, onClick: () => showToast('Replies — prototype only') },
            { label: 'Share', count: p.shares, onClick: () => showToast('Note copied') },
            {
              label: 'Save',
              onLabel: 'Saved',
              on: hasFlag(`save:${p.id}`),
              onClick: () =>
                toggleFlag(`save:${p.id}`, {
                  on: 'Saved to your reading list',
                  off: 'Removed from your reading list',
                }),
            },
          ]}
        />
      </article>
    )
  }

  function ReadRow({ read: b }) {
    return (
      <article className="section">
        <div className="mb-5 flex items-center gap-3">
          <Avatar initials={b.initials} size={24} />
          <span className="truncate text-meta text-t1">{b.consultant}</span>
          <span className="truncate text-micro uppercase tracking-caps text-t3">
            published an article
          </span>
          <span className="ml-auto flex-none text-micro uppercase tracking-caps text-t3">
            {b.date}
          </span>
        </div>

        {/* Link-preview treatment, so an article never reads as a note. */}
        <Link
          to={`/read/${b.id}`}
          className="flex gap-4 border border-rule p-3 transition-opacity hover:opacity-60"
        >
          <Plate seed={b.id} className="h-[68px] w-[68px] flex-none" />
          <span className="min-w-0 flex-1">
            <span className="block text-micro uppercase tracking-caps text-t3">{b.tag}</span>
            <span className="mt-1 block text-body text-t1">{b.title}</span>
            <span className="mt-1.5 block text-micro uppercase tracking-caps text-t3 tnum">
              {b.readTime} · {b.views} read
            </span>
          </span>
        </Link>

        <Acts
          className="mt-5"
          items={[
            {
              label: 'Save for later',
              onLabel: 'Saved for later',
              on: hasFlag(`save:${b.id}`),
              onClick: () =>
                toggleFlag(`save:${b.id}`, {
                  on: 'Saved to your reading list',
                  off: 'Removed from your reading list',
                }),
            },
            { label: 'Share', onClick: () => showToast('Article link copied') },
          ]}
        />
      </article>
    )
  }
}

function Live() {
  const liveNow = liveSessions.filter((l) => l.live).length

  return (
    <Section label={`${liveNow} live now`} last>
      <p className="prose-c -mt-3 mb-8">
        Free to watch. Asking in the room is free too — it gets answered if it is useful to
        everyone, which yours may not be.
      </p>

      <ul>
        {liveSessions.map((l) => (
          <li key={l.id}>
            <Link
              to={`/live/${l.id}`}
              className="block border-b border-rule py-5 transition-opacity hover:opacity-60"
            >
              <Plate seed={l.id} variant="orbit" className="aspect-video w-full">
                <span className="absolute left-3 top-3 border border-rule bg-bg px-2 py-1 text-micro uppercase tracking-caps text-t1">
                  {l.live ? '● Live' : 'Soon'}
                </span>
                {l.viewers && (
                  <span className="absolute right-3 top-3 border border-rule bg-bg px-2 py-1 text-micro uppercase tracking-caps text-t2 tnum">
                    {l.viewers}
                  </span>
                )}
              </Plate>

              {/* items-start, not items-center: the topic runs to two lines
                  and a vertically-centred avatar floats against it. */}
              <span className="mt-4 flex items-start gap-3">
                <Avatar initials={l.initials} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-t1">{l.topic}</span>
                  <span className="mt-1 block text-micro uppercase tracking-label text-t3 tnum">
                    {l.consultant} · {l.live ? `${l.startedAgo} ago` : l.startsIn}
                  </span>
                </span>
                <span className="flex-none">
                  <Tag>{l.tag}</Tag>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
