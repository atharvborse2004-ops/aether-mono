import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { consultants, timeSlots } from '../data/mock.js'
import { Sheet, TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Avatar, Button, Field, Section, Stub, Tag, Ticks } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

export default function ConsultantProfile() {
  const { id } = useParams()
  const { showToast } = useStore()
  const [sheet, setSheet] = useState(false)
  const [duration, setDuration] = useState(null)
  const [slot, setSlot] = useState(null)

  const c = consultants.find((x) => x.id === id)
  if (!c) return <Navigate to="/consult" replace />

  const openSheet = () => {
    setDuration(c.slots[0])
    setSlot(timeSlots[0])
    setSheet(true)
  }

  return (
    <>
      <TopBar
        title={c.name}
        back
        backTo="/consult"
        sub={c.online ? 'Online now' : 'Offline'}
      />

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
          <Button onClick={() => showToast(`Following ${c.name.split(' ')[0]}`)} variant="quiet">
            Follow
          </Button>
          <Button onClick={openSheet} variant="solid">
            Book · ₹{c.price}
          </Button>
        </div>
      </section>

      <Section label="In their words">
        <p className="text-read text-t2">{c.bio}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {c.credentials.map((cr) => (
            <Tag key={cr}>{cr}</Tag>
          ))}
        </div>
      </Section>

      <Section label="Languages">
        <Field k="Speaks" v={c.languages.join(' · ')} />
        <Field k="Formats" v={c.slots.join(' · ')} />
        <Field k="Rate" v={`₹${c.price} per session`} />
      </Section>

      <Section label="Their work">
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
        <Link to="/read" className="act-link mt-6 inline-block text-meta">
          See everything in Read
        </Link>
      </Section>

      <Section label={`${c.reviews.length} reviews`}>
        <ul>
          {c.reviews.map((r) => (
            <li key={r.id} className="border-b border-rule py-5 last:border-b-0">
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
      </Section>

      <Section label="Book" last>
        <Stub className="mb-8" />
        <p className="prose-c mb-8">
          Bring the question you have been rewriting in your head. Not the polite version of it.
        </p>
        <Button onClick={openSheet} variant="solid">
          Book a session · ₹{c.price}
        </Button>
      </Section>

      <div className="h-8" />

      <Sheet open={sheet} onClose={() => setSheet(false)} title={`Book ${c.name}`}>
        <p className="label text-left mb-4">Length</p>
        <div className="mb-10 flex gap-3">
          {c.slots.map((s) => (
            <Button
              key={s}
              variant={duration === s ? 'solid' : 'quiet'}
              onClick={() => setDuration(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <p className="label text-left mb-4">Today</p>
        <div className="mb-10 grid grid-cols-3 gap-3">
          {timeSlots.map((t) => (
            <Button key={t} variant={slot === t ? 'solid' : 'quiet'} onClick={() => setSlot(t)}>
              {t}
            </Button>
          ))}
        </div>

        <Field k="Consultant" v={c.name} />
        <Field k="When" v={`Today, ${slot}`} />
        <Field k="Length" v={duration} />
        <Field k="Total" v={`₹${c.price}`} />

        <Button
          className="mt-10"
          variant="solid"
          onClick={() => {
            setSheet(false)
            showToast(`Booked · today ${slot}`)
          }}
        >
          Confirm
        </Button>
        <p className="mt-5 text-center text-meta text-t3">
          Prototype — no payment is taken and nothing is booked.
        </p>
      </Sheet>
    </>
  )
}
