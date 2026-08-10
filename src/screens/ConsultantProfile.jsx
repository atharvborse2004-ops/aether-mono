import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { bookedSlots, consultants, SESSION, timeSlots } from '../data/mock.js'
import { Sheet, TopBar } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import Plate from '../components/Plate.jsx'
import { PopButton } from '../components/Pop.jsx'
import {
  Acts,
  Avatar,
  Button,
  Field,
  firstName,
  Section,
  Segmented,
  Stub,
  Tag,
  Ticks,
} from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

const TABS = [
  { key: 'about', label: 'About' },
  { key: 'work', label: 'Work' },
  { key: 'reviews', label: 'Reviews' },
]

/** Star distribution, as a share of all reviews. */
const DISTRIBUTION = [
  [5, 92],
  [4, 6],
  [3, 1],
  [2, 0.6],
  [1, 0.4],
]

export default function ConsultantProfile() {
  const { id } = useParams()
  const { showToast, hasFlag, toggleFlag, openChat } = useStore()
  const [tab, setTab] = useState('about')
  const [sheet, setSheet] = useState(false)
  const [slot, setSlot] = useState(null)

  const c = consultants.find((x) => x.id === id)
  if (!c) return <Navigate to="/consult" replace />

  const following = hasFlag(`follow:${c.id}`)

  /* One length now, so `price` is the whole story. */

  const openSheet = () => {
    setSlot(null)
    setSheet(true)
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title={c.name}
        back
        backTo="/consult"
        sub={c.online ? 'Online now' : 'Offline'}
        right={
          <button
            type="button"
            onClick={() => showToast('Profile link copied')}
            className="text-label uppercase tracking-label text-t2"
          >
            Share
          </button>
        }
      />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* No banner. A cover image on a profile this dense pushes the name,
            the numbers and the description below the fold, and it carried no
            information — it was a generated plate of the same art as the
            intro clip. The identity block leads instead. */}
        <section className="px-5 pb-6 pt-6">
          <div className="flex items-start gap-4">
            <Avatar initials={c.initials} size={76} />
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="truncate text-lead font-semibold t-heading">{c.name}</h1>
              <p className="mt-0.5 truncate text-meta t-body">{c.specialization}</p>

              {/* Rating, reviews, experience and followers as one small line
                  under the name, the way a social profile reads them. They
                  were a four-column bordered grid taking 90px of height to
                  say four short numbers. */}
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] t-faint tnum">
                <span className="font-bold t-sub">{c.rating}</span> rating
                <span aria-hidden="true">·</span>
                <span className="font-bold t-sub">{c.reviewCount.toLocaleString('en-IN')}</span>{' '}
                reviews
                <span aria-hidden="true">·</span>
                <span className="font-bold t-sub">{c.experience}</span>
                <span aria-hidden="true">·</span>
                <span className="font-bold t-sub">{c.followers}</span> followers
              </p>
            </div>
          </div>

          {/* The description. It was buried in the About tab; on a profile it
              is the thing you read right after the name. */}
          <p className="mt-4 text-meta leading-relaxed t-sub">{c.bio}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.credentials.map((cr) => (
              <Tag key={cr}>{cr}</Tag>
            ))}
          </div>

          {/* Follow, message and call. The last two are glyphs — a labelled
              button for each would take the whole row and say less. */}
          <div className="mt-5 flex items-center gap-2">
            <PopButton
              className="flex-1"
              full={false}
              variant={following ? 'ghost' : 'default'}
              onClick={() =>
                toggleFlag(`follow:${c.id}`, {
                  on: `Following ${firstName(c.name)}`,
                  off: `Unfollowed ${firstName(c.name)}`,
                })
              }
            >
              {following ? 'Following' : 'Follow'}
            </PopButton>
            <button
              type="button"
              aria-label={`Message ${firstName(c.name)}`}
              onClick={() => openChat('live')}
              className="pill knob !h-10 !w-10 flex-none justify-center"
            >
              <Icon name="chat" size={18} />
            </button>
            <button
              type="button"
              aria-label={`Call ${firstName(c.name)}`}
              onClick={() => showToast(`Calling ${firstName(c.name)} — prototype only`)}
              className="pill knob !h-10 !w-10 flex-none justify-center"
            >
              <Icon name="phone" size={18} />
            </button>
          </div>

          {/* Intro recording. */}
          <button
            type="button"
            onClick={() => showToast('Intro recording — prototype only')}
            className="mt-5 block w-full text-left transition-opacity hover:opacity-70"
          >
            <Plate seed={`${c.id}-intro`} variant="orbit" className="aspect-video w-full">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-2 rounded-full bg-surface/90 px-3.5 py-2 shadow-sm caps-sm t-sub">
                  ▶ Meet {firstName(c.name)} · 1:24
                </span>
              </span>
            </Plate>
          </button>
        </section>

        <Segmented items={TABS} value={tab} onChange={setTab} />

        <div key={tab} className="animate-fade">
          {tab === 'about' && <About c={c} />}
          {tab === 'work' && <Work c={c} />}
          {tab === 'reviews' && <Reviews c={c} />}
        </div>

        <Section label="Book" last>
          <Stub className="mb-8" />
          <p className="prose-c mb-8">
            Bring the question you have been rewriting in your head. Not the polite version of it.
          </p>
          <Button onClick={openSheet} variant="solid">
            Book a session · ₹{c.price.toLocaleString('en-IN')}
          </Button>
        </Section>

        <div className="h-8" />
      </div>

      {/* Sticky footer. The price and the one action follow you down the page,
          which is the difference between a profile and a brochure. */}
      <div className="flex flex-none items-center gap-4 border-t border-rule bg-bg px-6 py-4">
        <div className="min-w-0">
          <p className="text-lead font-light tnum">₹{c.price.toLocaleString('en-IN')}</p>
          <p className="mt-0.5 text-micro uppercase tracking-caps text-t3">
            {SESSION.label} · {SESSION.promise}
          </p>
        </div>
        <Button onClick={openSheet} variant="solid" className="flex-1">
          Book a call
        </Button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={`Book ${firstName(c.name)}`}>
        <p className="label text-left mb-4">Available today</p>
        <div className="mb-10 grid grid-cols-3 gap-3">
          {timeSlots.map((t) => {
            const taken = bookedSlots.includes(t)
            return (
              <Button
                key={t}
                variant={slot === t ? 'solid' : 'quiet'}
                disabled={taken}
                onClick={() => setSlot(t)}
              >
                {taken ? <s>{t}</s> : t}
              </Button>
            )
          })}
        </div>

        <Field k="Consultant" v={c.name} />
        <Field k="When" v={slot ? `Today, ${slot}` : 'Not picked yet'} />
        <Field k="Length" v={SESSION.label} />
        <Field k="Questions" v={SESSION.promise} />
        <Field k="Total" v={`₹${c.price.toLocaleString('en-IN')}`} />

        <Button
          className="mt-10"
          variant="solid"
          disabled={!slot}
          onClick={() => {
            setSheet(false)
            showToast(`Booked · today ${slot}`)
          }}
        >
          {slot ? `Confirm ${slot}` : 'Pick a time'}
        </Button>
        <p className="mt-5 text-center text-meta text-t3">
          Prototype — no payment is taken and nothing is booked.
        </p>
      </Sheet>
    </div>
  )
}

function About({ c }) {
  return (
    <>
      {/* The bio and credentials moved up into the identity block — repeating
          them here would be the same paragraph twice on one screen. */}
      <Section label="Practical">
        <Field k="Speaks" v={c.languages.join(' · ')} />
        <Field k="Category" v={c.category} />
        <Field k="Experience" v={c.experience} />
        <Field k="Status" v={c.online ? 'Online now' : 'Offline'} />
      </Section>

      <Section label="What a session is">
        <Field k="Length" v={SESSION.label} />
        <Field k="Questions" v={SESSION.promise} />
        <Field k="Price" v={`₹${c.price.toLocaleString('en-IN')}`} />
        <p className="mt-6 text-center text-meta text-t3">
          One length, one price. Ask as much as you like inside it — if the call runs over, it
          runs over.
        </p>
      </Section>
    </>
  )
}

function Work({ c }) {
  return (
    <Section label={`${c.content.length} pieces`}>
      <ul>
        {c.content.map((p) => (
          <li
            key={p.id}
            className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5"
          >
            <span className="min-w-0 truncate text-body text-t2">{p.title}</span>
            <span className="flex-none text-micro uppercase tracking-caps text-t3 tnum">
              {p.type} · {p.views}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/home" className="act-link mt-6 inline-block text-meta">
        See everything in the feed
      </Link>
    </Section>
  )
}

function Reviews({ c }) {
  const { showToast } = useStore()

  return (
    <Section label={`${c.reviewCount.toLocaleString('en-IN')} reviews`}>
      {/* The distribution, drawn as rules. A single average hides whether the
          rating is a consensus or a fight. */}
      <div className="flex items-center gap-6 border-b border-rule pb-8">
        <div className="flex-none text-center">
          <p className="text-display font-light tnum">{c.rating}</p>
          <Ticks value={Math.round(c.rating)} className="mt-2 w-16" />
        </div>
        <ul className="min-w-0 flex-1">
          {DISTRIBUTION.map(([stars, pct]) => (
            <li key={stars} className="flex items-center gap-3 py-1">
              <span className="w-2 flex-none text-micro text-t3 tnum">{stars}</span>
              <span className="h-[2px] flex-1 bg-rule">
                <span className="block h-full bg-t1" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 flex-none text-right text-micro text-t3 tnum">{pct}%</span>
            </li>
          ))}
        </ul>
      </div>

      <ul>
        {c.reviews.map((r) => (
          <li key={r.id} className="border-b border-rule py-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-meta text-t1">{r.name}</span>
              <span className="flex items-center gap-3">
                <Ticks value={r.rating} className="w-12" />
                <span className="text-micro uppercase tracking-caps text-t3">{r.ago}</span>
              </span>
            </div>
            <p className="mt-3 text-body text-t2">{r.text}</p>
          </li>
        ))}
      </ul>

      <Acts
        className="mt-6 justify-center"
        items={[
          {
            label: `All ${c.reviewCount.toLocaleString('en-IN')} reviews`,
            onClick: () => showToast('Full review list — prototype only'),
          },
        ]}
      />
    </Section>
  )
}
