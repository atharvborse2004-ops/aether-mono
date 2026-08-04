import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { liveChat, liveSessions } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Avatar, Button, Section } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

export default function LiveRoom() {
  const { id } = useParams()
  const { showToast } = useStore()
  const [chat, setChat] = useState(liveChat)
  const [draft, setDraft] = useState('')

  const room = liveSessions.find((l) => l.id === id)
  if (!room) return <Navigate to="/read" replace />

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setChat((c) => [...c, { id: `me-${c.length}`, name: 'You', initials: 'A', text }])
    setDraft('')
  }

  return (
    <>
      <TopBar
        title={room.live ? 'Live' : 'Scheduled'}
        back
        backTo="/read"
        sub={room.live ? `${room.viewers} watching` : room.startsIn}
      />

      <Plate seed={room.id} variant="orbit" className="aspect-video w-full">
        <span className="absolute left-3 top-3 border border-rule bg-bg px-2 py-1 text-micro uppercase tracking-caps text-t1">
          {room.live ? '● Live' : 'Soon'}
        </span>
      </Plate>

      <Section label={room.tag} tight>
        <h1 className="text-lead font-light">{room.topic}</h1>
        <div className="mt-5 flex items-center gap-3">
          <Avatar initials={room.initials} size={32} />
          <span className="flex-1 text-meta text-t2">{room.consultant}</span>
          <Button
            className="w-auto px-4"
            onClick={() => showToast(room.live ? 'Following' : 'You will be reminded')}
          >
            {room.live ? 'Follow' : 'Remind me'}
          </Button>
        </div>
      </Section>

      {room.live ? (
        <>
          <Section label="Room" tight>
            <ul>
              {chat.map((m) => (
                <li key={m.id} className="flex items-start gap-3 border-b border-rule py-3">
                  <Avatar initials={m.initials} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="text-micro uppercase tracking-caps text-t3">{m.name}</span>
                    <span className="mt-1 block text-meta text-t1">{m.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Say something"
                aria-label="Message"
                className="min-w-0 flex-1 border-b border-rule bg-transparent pb-2 text-body text-t1 outline-none transition-colors placeholder:text-t4 focus:border-t1"
              />
              <Button className="w-auto px-4" onClick={send} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
          </Section>

          <Section label="Or ask directly" last>
            <p className="prose-c mb-8">
              A room answers the questions that are useful to everyone. Yours might not be one of
              them.
            </p>
            <Button to={`/consult/${room.consultantId}`} variant="solid">
              Book a private session
            </Button>
          </Section>
        </>
      ) : (
        <Section label="Not started" last>
          <p className="horoscope">This one opens {room.startsIn}. Nothing to watch yet.</p>
          <Button to="/read" variant="quiet" className="mt-10">
            Back to Read
          </Button>
        </Section>
      )}

      <div className="h-8" />
    </>
  )
}
