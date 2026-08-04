import { Navigate, useParams } from 'react-router-dom'
import { clips } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Avatar, Button, Row, Section } from '../components/Primitives.jsx'

export default function Clip() {
  const { id } = useParams()
  const idx = clips.findIndex((c) => c.id === id)
  if (idx === -1) return <Navigate to="/read" replace />

  const c = clips[idx]
  const next = clips[(idx + 1) % clips.length]

  return (
    <>
      <TopBar title="Clip" back backTo="/read" sub={c.duration} />

      <Plate seed={c.id} className="aspect-[4/5] w-full">
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-rule bg-bg px-4 py-3">
          <span className="text-micro uppercase tracking-caps text-t3 tnum">{c.views} views</span>
          <span className="text-micro uppercase tracking-caps text-t3 tnum">{c.duration}</span>
        </span>
      </Plate>

      <Section label="Caption">
        <p className="horoscope">{c.caption}</p>
      </Section>

      <Section label="Posted by">
        <div className="flex items-center gap-4">
          <Avatar initials={c.initials} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-body text-t1">{c.consultant}</p>
            <p className="mt-1 text-micro uppercase tracking-caps text-t3 tnum">
              {c.likes} saved · {c.comments} replies
            </p>
          </div>
        </div>
        <Button to={`/consult/${c.consultantId}`} className="mt-8">
          Book a session
        </Button>
      </Section>

      <Section label="Next" last>
        <Row to={`/read/clip/${next.id}`} title={next.caption} note={next.consultant} />
        <Row to="/read" title="Back to Read" />
      </Section>

      <div className="h-8" />
    </>
  )
}
