import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clips, liveSessions, posts, reads } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Acts, Avatar, Button, Search, Section, Segmented, Tag } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

const TABS = [
  { key: 'posts', label: 'Notes' },
  { key: 'reads', label: 'Long' },
  { key: 'clips', label: 'Clips' },
  { key: 'live', label: 'Live' },
]

export default function Read() {
  const [tab, setTab] = useState('posts')
  const [query, setQuery] = useState('')

  return (
    <>
      <TopBar title="Read" />
      <Segmented items={TABS} value={tab} onChange={setTab} />

      {/* Live rail — the one part of the feed that expires. It sits above the
          search field because a room ending in nine minutes is not something
          you go looking for. */}
      <LiveRail />

      <Search value={query} onChange={setQuery} placeholder="Search writers and topics" />

      <div key={tab} className="animate-fade">
        {tab === 'posts' && <Notes query={query} />}
        {tab === 'reads' && <Long query={query} />}
        {tab === 'clips' && <Clips query={query} />}
        {tab === 'live' && <Live query={query} />}
      </div>

      <div className="h-8" />
    </>
  )
}

/** Case-insensitive match across whichever fields a record happens to carry. */
function matches(query, ...fields) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
}

function Empty({ query }) {
  return (
    <Section last>
      <p className="py-6 text-center text-meta text-t3">
        Nothing here matches &ldquo;{query.trim()}&rdquo;.
      </p>
    </Section>
  )
}

function LiveRail() {
  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule px-6 py-5">
      {liveSessions.map((l) => (
        <Link
          key={l.id}
          to={`/read/live/${l.id}`}
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
            {l.consultant.split(' ')[0]}
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

function Notes({ query }) {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const list = posts.filter((p) => matches(query, p.consultant, p.role, p.text, p.plate))

  if (!list.length) return <Empty query={query} />

  return (
    <>
      {list.map((p) => {
        const liked = hasFlag(`like:${p.id}`)
        return (
          <article key={p.id} className="section">
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
                {
                  label: 'Reply',
                  count: p.comments,
                  onClick: () => showToast('Replies — prototype only'),
                },
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
      })}
    </>
  )
}

function Long({ query }) {
  const { hasFlag, toggleFlag, showToast } = useStore()
  const list = reads.filter((b) => matches(query, b.title, b.excerpt, b.consultant, b.tag))

  if (!list.length) return <Empty query={query} />

  return (
    <>
      {list.map((b) => (
        <article key={b.id} className="section">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Tag>{b.tag}</Tag>
            <span className="text-micro uppercase tracking-caps text-t3 tnum">
              {b.readTime} · {b.date}
            </span>
          </div>
          <h2 className="text-title font-light">{b.title}</h2>
          <p className="mt-4 text-body text-t2">{b.excerpt}</p>
          <div className="mt-6">
            <Link
              to={`/consult/${b.consultantId}`}
              className="block transition-opacity hover:opacity-60"
            >
              <Byline initials={b.initials} name={b.consultant} meta={`${b.views} read`} />
            </Link>
          </div>

          <Acts
            className="mt-6"
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
      ))}
    </>
  )
}

function Clips({ query }) {
  const navigate = useNavigate()
  const list = clips.filter((c) => matches(query, c.caption, c.consultant))

  if (!list.length) return <Empty query={query} />

  return (
    <Section label="Short" last>
      {/* The grid is the index; the player is a separate full-bleed screen.
          Tapping a tile opens the player at that clip, not at the top. */}
      <ul className="grid grid-cols-2 gap-4">
        {list.map((c) => (
          <li key={c.id}>
            <Link to={`/read/clip/${c.id}`} className="block transition-opacity hover:opacity-60">
              <Plate seed={c.id} className="aspect-[3/4] w-full" />
              <p className="mt-3 text-meta text-t1">{c.caption}</p>
              <p className="mt-1 text-micro uppercase tracking-caps text-t3 tnum">
                {c.consultant} · {c.duration}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Button className="mt-10" variant="quiet" onClick={() => navigate(`/read/clip/${list[0].id}`)}>
        Play all
      </Button>
    </Section>
  )
}

function Live({ query }) {
  const list = liveSessions.filter((l) => matches(query, l.topic, l.consultant, l.tag))
  const liveNow = liveSessions.filter((l) => l.live).length

  if (!list.length) return <Empty query={query} />

  return (
    <Section label={`${liveNow} live now`} last>
      <p className="prose-c -mt-3 mb-8">
        Free to watch. Asking in the room is free too — it gets answered if it is useful to
        everyone, which yours may not be.
      </p>

      <ul>
        {list.map((l) => (
          <li key={l.id}>
            <Link
              to={`/read/live/${l.id}`}
              className="flex items-start gap-4 border-b border-rule py-5 transition-opacity hover:opacity-60"
            >
              <Avatar initials={l.initials} size={40} />
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2">
                  <span className="text-micro uppercase tracking-caps text-t1">
                    {l.live ? '● Live' : 'Soon'}
                  </span>
                  <span className="text-micro uppercase tracking-caps text-t3">{l.tag}</span>
                </span>
                <span className="block text-body text-t1">{l.topic}</span>
                <span className="mt-1 block text-micro uppercase tracking-caps text-t3 tnum">
                  {l.consultant} · {l.live ? `${l.viewers} watching` : l.startsIn}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
