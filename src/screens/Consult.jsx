import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, consultants } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import { Avatar, Section, Ticks } from '../components/Primitives.jsx'

export default function Consult() {
  const [cat, setCat] = useState('All')
  const list = cat === 'All' ? consultants : consultants.filter((c) => c.category === cat)
  const filters = ['All', ...categories]

  return (
    <>
      <TopBar title="Consult" sub={`${consultants.filter((c) => c.online).length} online now`} />

      {/* Filters use the same tracked-caps + underline language as every other
          selector in the app. Nothing here is a pill or a chip — a chip in this
          layout reads as a button, and these do not commit to anything. */}
      <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule px-6 py-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`flex-none border-b pb-1 text-label uppercase tracking-label transition-colors ${
              cat === f ? 'border-t1 text-t1' : 'border-transparent text-t3'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Section label={`${list.length} people`} last>
        <ul>
          {list.map((c) => (
            <li key={c.id}>
              <Link
                to={`/consult/${c.id}`}
                className="flex items-start gap-4 border-b border-rule py-5 transition-opacity hover:opacity-60"
              >
                <Avatar initials={c.initials} size={44} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-body text-t1">{c.name}</span>
                    {c.online && (
                      <span className="flex-none text-micro uppercase tracking-caps text-t2">
                        Online
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-meta text-t3">{c.specialization}</span>
                  <span className="mt-2 flex items-center gap-3">
                    <Ticks value={Math.round(c.rating)} className="w-16" />
                    <span className="text-micro uppercase tracking-caps text-t3 tnum">
                      {c.rating} · {c.experience} · {c.languages.join(', ')}
                    </span>
                  </span>
                </span>

                <span className="flex-none text-right">
                  <span className="block text-body text-t1 tnum">₹{c.price}</span>
                  <span className="block text-micro uppercase tracking-caps text-t3">Session</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <p className="py-10 text-center text-meta text-t3">Nobody in this category yet.</p>
        )}
      </Section>

      <div className="h-8" />
    </>
  )
}
