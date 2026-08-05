import { Link } from 'react-router-dom'
import {
  clips,
  courses,
  days,
  feed,
  liveSessions,
  posts,
  products,
  reads,
  user,
} from '../data/mock.js'
import Plate from '../components/Plate.jsx'
import { Kicker, PopAvatar, PopBar, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Acts, firstName } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/** Every feed record resolves against one of these by `refId`. */
const SOURCES = {
  post: posts,
  reel: clips,
  article: reads,
  live: liveSessions,
  course: courses,
  product: products,
}

/**
 * Home — one stream, mixed formats.
 *
 * The previous build split this into Feed / Reels / Live behind a switcher.
 * That is gone: reels, notes, articles, live rooms, courses, products and the
 * daily reading now interleave in a single scroll, and `kind` on each record
 * decides how the card renders. Nothing is duplicated — feed entries carry a
 * `refId` into the existing collections, so a card always resolves to real
 * data and stays in sync with the screen it links to.
 */
export default function Home() {
  const items = feed
    .map((f) => {
      if (f.kind === 'reading') return { ...f, data: days[f.refId] }
      const found = SOURCES[f.kind]?.find((x) => x.id === f.refId)
      return found ? { ...f, data: found } : null
    })
    .filter(Boolean)

  return (
    <>
      <Header />

      <div className="divide-y divide-rule">
        {items.map((item) => {
          switch (item.kind) {
            case 'post':
              return <PostCard key={item.id} post={item.data} />
            case 'reel':
              return <ReelCard key={item.id} reel={item.data} />
            case 'reading':
              return <ReadingCard key={item.id} day={item.data} />
            case 'article':
              return <ArticleCard key={item.id} read={item.data} />
            case 'live':
              return <LiveCard key={item.id} room={item.data} />
            case 'course':
              return <CourseCard key={item.id} course={item.data} />
            case 'product':
              return <ProductCard key={item.id} product={item.data} />
            default:
              return null
          }
        })}
      </div>

      <div className="px-5 py-10 text-center">
        <p className="caps-sm t-faint">End of today&apos;s feed</p>
      </div>

      {/* Clears the floating AI button and the tab bar. */}
      <div className="h-24" />
    </>
  )
}

function Header() {
  const { openChat, setHoroscopeOpen } = useStore()

  return (
    <header className="sticky top-0 z-20 flex flex-none items-center gap-3 border-b border-stroke bg-bg px-4 py-3">
      <Link to="/profile" aria-label="Your profile" className="transition-opacity hover:opacity-70">
        <PopAvatar initials={user.initials} size={34} />
      </Link>
      <p className="flex-1 font-display text-lead leading-none t-heading">Veda</p>
      {/* A focused action, not a redirect. This used to navigate to
          Profile > Horoscope, which took you out of the tab you were on. */}
      <button
        type="button"
        onClick={() => setHoroscopeOpen(true)}
        className="caps-sm border border-stroke px-2.5 py-1.5 t-body transition-colors hover:border-gold hover:text-gold"
      >
        Horoscope
      </button>
      {/* Alerts are gone — this opens the chat panel instead. */}
      <button
        type="button"
        onClick={() => openChat('live')}
        aria-label="Messages"
        className="caps-sm relative border border-stroke px-2.5 py-1.5 t-body transition-colors hover:border-gold hover:text-gold"
      >
        Chat
        <span className="absolute -right-1 -top-1 block h-2 w-2 bg-gold" />
      </button>
    </header>
  )
}

/** Shared byline. Keeps every card's attribution identical. */
function Byline({ initials, name, meta, to, note }) {
  const inner = (
    <>
      <PopAvatar initials={initials} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-meta t-heading">{name}</span>
        {note && <span className="block caps-sm t-faint">{note}</span>}
      </span>
      {meta && <span className="flex-none caps-sm t-faint tnum">{meta}</span>}
    </>
  )
  if (to) {
    return (
      <Link to={to} className="flex items-center gap-3 transition-opacity hover:opacity-70">
        {inner}
      </Link>
    )
  }
  return <div className="flex items-center gap-3">{inner}</div>
}

function PostCard({ post: p }) {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const liked = hasFlag(`like:${p.id}`)

  return (
    <article className="px-5 py-6">
      <Byline
        initials={p.initials}
        name={p.consultant}
        note={p.role}
        meta={p.time}
        to={`/consult/${p.consultantId}`}
      />
      <p className="mt-4 text-body t-sub">{p.text}</p>
      {p.plate && <Plate seed={p.id} className="mt-4 h-44 w-full" label={p.plate} />}

      <Acts
        className="mt-5"
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

function ReelCard({ reel: r }) {
  return (
    <article className="px-5 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Byline initials={r.initials} name={r.consultant} to={`/consult/${r.consultantId}`} />
        <PopTag>Reel</PopTag>
      </div>

      <Link to={`/reels/${r.id}`} className="block transition-opacity hover:opacity-80">
        <Plate seed={r.id} className="aspect-[4/5] w-full">
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="is-round flex h-12 w-12 items-center justify-center border border-gold bg-bg gold"
            >
              <span className="caps-sm leading-none">▶</span>
            </span>
          </span>
          <span className="caps-sm absolute bottom-3 left-3 border border-stroke bg-bg px-2 py-1 t-sub tnum">
            {r.views} · {r.duration}
          </span>
        </Plate>
        <p className="mt-3 text-body t-heading">{r.caption}</p>
      </Link>
      <p className="mt-1.5 caps-sm t-faint">{r.audio}</p>
    </article>
  )
}

/** The daily reading, inline. The product's core content, in the stream. */
function ReadingCard({ day }) {
  const { setHoroscopeOpen: setOpen } = useStore()
  return (
    <article className="px-5 py-6">
      <Kicker action="Read all" onAction={() => setOpen(true)}>
        Today&apos;s reading
      </Kicker>
      <PopCard raised className="mt-4 p-5">
        <p className="caps-sm gold">{day.date}</p>
        <h2 className="mt-3 font-display text-title leading-tight t-heading">{day.headline}</h2>
        <p className="mt-3 text-body t-body">{day.body}</p>

        <dl className="mt-5 grid grid-cols-3 border-t border-stroke pt-4">
          {[
            ['Mood', day.mood],
            ['Colour', day.luckyColour],
            ['Number', day.luckyNumber],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="caps-sm t-faint">{k}</dt>
              <dd className="mt-1 text-meta tnum t-heading">{v}</dd>
            </div>
          ))}
        </dl>
      </PopCard>
    </article>
  )
}

function ArticleCard({ read: b }) {
  const { hasFlag, toggleFlag } = useStore()

  return (
    <article className="px-5 py-6">
      <Byline
        initials={b.initials}
        name={b.consultant}
        note="published an article"
        meta={b.date}
        to={`/consult/${b.consultantId}`}
      />

      <Link to={`/read/${b.id}`} className="mt-4 block transition-opacity hover:opacity-80">
        <PopCard className="flex gap-4 p-3">
          <Plate seed={b.id} className="h-[72px] w-[72px] flex-none" />
          <span className="min-w-0 flex-1">
            <span className="caps-sm gold">{b.tag}</span>
            <span className="mt-1 block text-body t-heading">{b.title}</span>
            <span className="mt-1.5 block caps-sm t-faint tnum">
              {b.readTime} · {b.views} read
            </span>
          </span>
        </PopCard>
      </Link>

      <Acts
        className="mt-4"
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
        ]}
      />
    </article>
  )
}

function LiveCard({ room: l }) {
  return (
    <article className="px-5 py-6">
      <Link to={`/live/${l.id}`} className="block transition-opacity hover:opacity-80">
        <Plate seed={l.id} variant="orbit" className="aspect-video w-full">
          <span className="absolute left-3 top-3">
            {l.live ? (
              <span className="badge-live">● Live</span>
            ) : (
              <span className="caps-sm border border-stroke bg-bg px-2 py-1 t-sub">Soon</span>
            )}
          </span>
          {l.viewers && (
            <span className="caps-sm absolute right-3 top-3 border border-stroke bg-bg px-2 py-1 t-sub tnum">
              {l.viewers}
            </span>
          )}
        </Plate>

        <div className="mt-4 flex items-start gap-3">
          <PopAvatar initials={l.initials} size={32} online={l.live} />
          <span className="min-w-0 flex-1">
            <span className="block text-body t-heading">{l.topic}</span>
            <span className="mt-1 block caps-sm t-faint tnum">
              {firstName(l.consultant)} · {l.live ? `${l.startedAgo} ago` : l.startsIn}
            </span>
          </span>
          <PopTag tone={l.live ? 'live' : 'default'}>{l.tag}</PopTag>
        </div>
      </Link>
    </article>
  )
}

function CourseCard({ course: c }) {
  return (
    <article className="px-5 py-6">
      <Kicker action="Academy" to="/academy">
        Continue learning
      </Kicker>
      <PopCard className="mt-4 p-4">
        <div className="flex items-start gap-3">
          <Plate seed={c.id} className="h-16 w-16 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="text-body t-heading">{c.title}</p>
            <p className="mt-1 caps-sm t-faint tnum">
              {c.tutor} · {c.lessons} lessons
            </p>
          </div>
        </div>
        {c.progress > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="caps-sm t-faint">Progress</span>
              <span className="caps-sm gold tnum">{c.progress}%</span>
            </div>
            <PopBar value={c.progress} />
          </div>
        )}
        <PopButton size="sm" to="/academy" variant="gold" className="mt-4">
          {c.progress > 0 ? 'Resume' : 'Start course'}
        </PopButton>
      </PopCard>
    </article>
  )
}

function ProductCard({ product: p }) {
  const { addToCart } = useStore()
  const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : null

  return (
    <article className="px-5 py-6">
      <Kicker action="Shop" to="/shop">
        For your chart
      </Kicker>
      <PopCard className="mt-4 flex gap-4 p-3">
        <Plate seed={p.id} className="h-24 w-24 flex-none" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-body t-heading">{p.name}</p>
          <p className="mt-1 text-meta t-faint">{p.subtitle}</p>
          <p className="mt-2 flex items-baseline gap-2 tnum">
            <span className="text-lead gold">₹{p.price.toLocaleString('en-IN')}</span>
            {off > 0 && <span className="caps-sm t-faint">{off}% off</span>}
          </p>
          <PopButton onClick={() => addToCart(p)} full={false} className="mt-auto self-start px-4">
            Add
          </PopButton>
        </div>
      </PopCard>
    </article>
  )
}
