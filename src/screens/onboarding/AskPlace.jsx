import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionFrame from './QuestionFrame.jsx'
import { useStore } from '../../store.jsx'

const SUGGESTIONS = [
  { city: 'Pune, Maharashtra, India', coords: '18.5204° N · 73.8567° E' },
  { city: 'Mumbai, Maharashtra, India', coords: '19.0760° N · 72.8777° E' },
  { city: 'Bengaluru, Karnataka, India', coords: '12.9716° N · 77.5946° E' },
  { city: 'Delhi, India', coords: '28.6139° N · 77.2090° E' },
]

export default function AskPlace() {
  const navigate = useNavigate()
  const { setBirthField } = useStore()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)

  const matches = q
    ? SUGGESTIONS.filter((s) => s.city.toLowerCase().includes(q.toLowerCase()))
    : SUGGESTIONS

  return (
    <QuestionFrame
      question="And where?"
      hint="The city fixes your horizon. Everything angular in the chart is measured from it."
      canContinue={Boolean(picked)}
      nextLabel="Compute"
      onNext={() => {
        setBirthField('place', picked.city)
        navigate('/onboarding/computing')
      }}
    >
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setPicked(null)
        }}
        placeholder="City of birth"
        aria-label="City of birth"
        className="w-full border-b border-rule bg-transparent pb-3 text-center text-lead font-light text-t1 outline-none transition-colors placeholder:text-t4 focus:border-t1"
      />

      <ul className="mt-10">
        {matches.map((s) => {
          const active = picked?.city === s.city
          return (
            <li key={s.city}>
              <button
                type="button"
                onClick={() => setPicked(s)}
                aria-pressed={active}
                className="flex w-full items-center justify-between gap-4 border-b border-rule py-4 text-left transition-opacity hover:opacity-60"
              >
                <span className={`text-body ${active ? 'text-t1' : 'text-t2'}`}>{s.city}</span>
                <span className="flex-none text-micro uppercase tracking-caps text-t3 tnum">
                  {active ? 'Selected' : s.coords}
                </span>
              </button>
            </li>
          )
        })}
        {matches.length === 0 && (
          <li className="py-4 text-center text-meta text-t3">
            Nothing matches. This is a prototype — pick one of the four.
          </li>
        )}
      </ul>
    </QuestionFrame>
  )
}
