import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionFrame, { Slot } from './QuestionFrame.jsx'
import { useStore } from '../../store.jsx'

export default function AskDate() {
  const navigate = useNavigate()
  const { setBirthField } = useStore()
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')

  const valid = +d >= 1 && +d <= 31 && +m >= 1 && +m <= 12 && y.length === 4 && +y >= 1900

  return (
    <QuestionFrame
      question="When were you born?"
      hint="Date first. We will ask for the time separately, and we will be fussy about it."
      canContinue={valid}
      onNext={() => {
        setBirthField('date', `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`)
        navigate('/onboarding/time')
      }}
    >
      <div className="mx-auto grid max-w-[19rem] grid-cols-[1fr_1fr_1.5fr] gap-5">
        <Slot value={d} onChange={setD} placeholder="14" label="Day" max={2} />
        <Slot value={m} onChange={setM} placeholder="11" label="Month" max={2} />
        <Slot value={y} onChange={setY} placeholder="1996" label="Year" max={4} />
      </div>
    </QuestionFrame>
  )
}
