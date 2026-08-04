import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clips, liveSessions, posts, reads } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Avatar, Section, Segmented, Tag } from '../components/Primitives.jsx'

const TABS = [
  { key: 'posts', label: 'Notes' },
  { key: 'reads', label: 'Long' },
  { key: 'clips', label: 'Clips' },
  { key: 'live', label: 'Live' },
]

export default function Read() {
  const [tab, setTab] = useState('posts')

  return (
    <>
      <TopBar title="Read" />
      <Segmented items={TABS} value={tab} onChange={setTab} />

      <div key={tab} className="animate-fade">
        {tab === 'posts' && <Notes />}
        {tab === 'reads' && <Long />}
        {tab === 'clips' && <Clips />}
        {tab === 'live' && <Live />}
      </div>

      <div className="h-8" />
    </>
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

function Notes() {
  return (
    <>
      {posts.map((p) => (
        <article key={p.id} className="section">
          <Link to={`/consult/${p.consultantId}`} className="block transition-opacity hover:opacity-60">
            <Byline initials={p.initials} name={p.consultant} role={p.role} meta={p.time} />
          </Link>

          <p className="mt-6 text-read text-t1">{p.text}</p>

          {p.plate && <Plate seed={p.id} className="mt-6 h-40 w-full" label={p.plate} />}

          <p className="mt-6 text-micro uppercase tracking-caps text-t3 tnum">
            {p.likes.toLocaleString('en-IN')} saved · {p.comments} replies
          </p>
        </article>
      ))}
    </>
  )
}

function Long() {
  return (
    <>
      {reads.map((b) => (
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
        </article>
      ))}
    </>
  )
}

function Clips() {
  return (
    <Section label="Short" last>
      <ul className="grid grid-cols-2 gap-4">
        {clips.map((c) => (
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
    </Section>
  )
}

function Live() {
  return (
    <Section label="Rooms" last>
      <ul>
        {liveSessions.map((l) => (
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
