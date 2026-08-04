import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { consultants, timeSlots } from '../data/mock.js'
import { Sheet, TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
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

/** Slots already taken today. Fixed rather than random so the UI is stable. */
const TAKEN = ['11:00', '18:30']

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
  const { showToast, hasFlag, toggleFlag } = useStore()
  const [tab, setTab] = useState('about')
  const [sheet, setSheet] = useState(false)
  const [duration, setDuration] = useState(null)
  const [slot, setSlot] = useState(null)

  const c = consultants.find((x) => x.id === id)
  if (!c) return <Navigate to="/consult" replace />

  const following = hasFlag(`follow:${c.id}`)

  // Priced per session against the 15-minute base, rounded to the nearest ten,
  // so the number under each length is the number you actually pay.
  const priceFor = (mins) => Math.round((c.price * (parseInt(mins, 10) / 15)) / 10) * 10
  const shown = duration || c.slots[0]

  const openSheet = () => {
    setDuration((d) => d || c.slots[0])
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
        <Plate seed={c.id} className="h-40 w-full" />

        <section className="section pt-8">
          <div className="flex items-center gap-4">
            <Avatar initials={c.initials} size={52} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lead font-light">{c.name}</h1>
              <p className="mt-1 truncate text-meta text-t3">{c.specialization}</p>
            </div>
          </div>

          {/* Stats strip — left-aligned columns on a real grid, not centered. */}
          <dl className="mt-8 grid grid-cols-4 border-y border-rule">
            {[
              ['Rating', c.rating],
              ['Reviews', c.reviewCount.toLocaleString('en-IN')],
              ['Exp', c.experience],
              ['Follow', c.followers],
            ].map(([k, v], i) => (
              <div key={k} className={`py-4 ${i > 0 ? 'border-l border-rule pl-3' : ''}`}>
                <dt className="text-micro uppercase tracking-caps text-t3">{k}</dt>
                <dd className="mt-1 text-body text-t1 tnum">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex gap-3">
            <Button
              variant={following ? 'solid' : 'quiet'}
              onClick={() =>
                toggleFlag(`follow:${c.id}`, {
                  on: `Following ${firstName(c.name)}`,
                  off: `Unfollowed ${firstName(c.name)}`,
                })
              }
            >
              {following ? 'Following' : 'Follow'}
            </Button>
            <Button
              variant="quiet"
              onClick={() => showToast(`Message sent to ${firstName(c.name)}`)}
            >
              Message
            </Button>
          </div>

          {/* Intro recording. A plate, a duration and a label — the same
              placeholder language every other piece of media uses here. */}
          <button
            type="button"
            onClick={() => showToast('Intro recording — prototype only')}
            className="mt-6 block w-full text-left transition-opacity hover:opacity-60"
          >
            <Plate seed={`${c.id}-intro`} variant="orbit" className="aspect-video w-full">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="border border-t1 bg-bg px-4 py-2 text-label uppercase tracking-label text-t1">
                  ▶ Meet {firstName(c.name)} · 1:24
                </span>
              </span>
            </Plate>
          </button>
        </section>

        <Segmented items={TABS} value={tab} onChange={setTab} />

        <div key={tab} className="animate-fade">
          {tab === 'about' && <About c={c} shown={shown} priceFor={priceFor} onPick={setDuration} />}
          {tab === 'work' && <Work c={c} />}
          {tab === 'reviews' && <Reviews c={c} />}
        </div>

        <Section label="Book" last>
          <Stub className="mb-8" />
          <p className="prose-c mb-8">
            Bring the question you have been rewriting in your head. Not the polite version of it.
          </p>
          <Button onClick={openSheet} variant="solid">
            Book a session · ₹{priceFor(shown).toLocaleString('en-IN')}
          </Button>
        </Section>

        <div className="h-8" />
      </div>

      {/* Sticky footer. The price and the one action follow you down the page,
          which is the difference between a profile and a brochure. */}
      <div className="flex flex-none items-center gap-4 border-t border-rule bg-bg px-6 py-4">
        <div className="min-w-0">
          <p className="text-lead font-light tnum">₹{priceFor(shown).toLocaleString('en-IN')}</p>
          <p className="mt-0.5 text-micro uppercase tracking-caps text-t3">Per session · {shown}</p>
        </div>
        <Button onClick={openSheet} variant="solid" className="flex-1">
          Book a call
        </Button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={`Book ${firstName(c.name)}`}>
        <p className="label text-left mb-4">Length</p>
        <div className="mb-10 flex gap-3">
          {c.slots.map((s) => (
            <Button
              key={s}
              variant={shown === s ? 'solid' : 'quiet'}
              onClick={() => setDuration(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <p className="label text-left mb-4">Available today</p>
        <div className="mb-10 grid grid-cols-3 gap-3">
          {timeSlots.map((t) => {
            const taken = TAKEN.includes(t)
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
        <Field k="Length" v={shown} />
        <Field k="Total" v={`₹${priceFor(shown).toLocaleString('en-IN')}`} />

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

function About({ c, shown, priceFor, onPick }) {
  return (
    <>
      <Section label="In their words">
        <p className="text-read text-t2">{c.bio}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {c.credentials.map((cr) => (
            <Tag key={cr}>{cr}</Tag>
          ))}
        </div>
      </Section>

      <Section label="Practical">
        <Field k="Speaks" v={c.languages.join(' · ')} />
        <Field k="Category" v={c.category} />
        <Field k="Experience" v={c.experience} />
        <Field k="Status" v={c.online ? 'Online now' : 'Offline'} />
      </Section>

      {/* Length picker, with the real price under each option rather than one
          headline rate that turns out to be the shortest call. */}
      <Section label="Choose a session">
        <div className="flex gap-3">
          {c.slots.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={shown === s}
              onClick={() => onPick(s)}
              className={`flex-1 border px-2 py-4 text-center transition-colors ${
                shown === s ? 'border-t1 bg-t1 text-bg' : 'border-rule text-t2 hover:border-t1'
              }`}
            >
              <span className="block text-label uppercase tracking-label">{s}</span>
              <span className="mt-1.5 block text-meta tnum">
                ₹{priceFor(s).toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-meta text-t3">
          Priced per session, not per minute. If the call runs over, it runs over.
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
