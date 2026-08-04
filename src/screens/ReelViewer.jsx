import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { clips } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import ReelFeed from '../components/ReelFeed.jsx'

/** Standalone reel route. The player itself is shared with Home → Reels. */
export default function ReelViewer() {
  const { id } = useParams()
  const startIndex = clips.findIndex((c) => c.id === id)
  const [index, setIndex] = useState(Math.max(0, startIndex))

  if (startIndex === -1) return <Navigate to="/home" replace />

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Reels" back backTo="/home" sub={`${index + 1} of ${clips.length}`} />
      <div className="min-h-0 flex-1">
        <ReelFeed startId={id} onIndexChange={setIndex} syncUrl />
      </div>
    </div>
  )
}
