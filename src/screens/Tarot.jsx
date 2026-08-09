import { useState } from 'react'
import { tarotCards } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopButton, PopCard } from '../components/Pop.jsx'
import { Stub } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * One card, free, once you ask for it.
 *
 * A three-card spread would be the obvious thing to build and the wrong one:
 * the value here is a single sentence you can carry, and three of them is a
 * horoscope. The draw is deliberate — a card dealt before you have a question
 * is a card you scroll past.
 */
export default function Tarot() {
  const { showToast } = useStore()
  const [card, setCard] = useState(null)

  const draw = () => {
    // A different card than the one showing, so a second pull always moves.
    const pool = tarotCards.filter((c) => c.id !== card?.id)
    setCard(pool[Math.floor(Math.random() * pool.length)])
  }

  return (
    <>
      <TopBar title="Tarot" back backTo="/home" sub="Free · one card" />

      <section className="px-5 py-8">
        {card ? (
          <>
            <PopCard raised className="overflow-hidden">
              <Plate seed={card.id} variant="engraving" className="!rounded-none aspect-[3/4] w-full !shadow-none" />
              <div className="p-5 text-center">
                <p className="caps-sm gold">{card.name}</p>
                <Stub className="my-4" />
                <p className="text-read t-heading">{card.line}</p>
              </div>
            </PopCard>

            <div className="mt-6 flex items-center gap-2">
              <PopButton variant="ghost" className="flex-1" full={false} onClick={draw}>
                Pull another
              </PopButton>
              <PopButton
                variant="gold"
                className="flex-1"
                full={false}
                to="/consult"
              >
                Read it properly
              </PopButton>
            </div>

            <p className="mt-6 text-center text-meta t-faint">
              One card is a prompt, not a reading. A tarot reader will do the other twenty
              minutes.
            </p>
          </>
        ) : (
          <div className="text-center">
            <Plate seed="tarot-back" variant="contour" className="mx-auto aspect-[3/4] w-2/3" />
            <p className="mt-8 mx-auto max-w-measure text-read t-sub">
              Hold the question you actually came with. Not the tidy version.
            </p>
            <PopButton variant="gold" className="mt-8" onClick={draw}>
              Pull a card
            </PopButton>
            <p className="mt-4 caps-sm t-faint">Free · no session needed</p>
          </div>
        )}
      </section>

      <section className="border-t border-rule px-5 py-6">
        <Kicker action="Ask the stars" to="/ask">
          Still stuck
        </Kicker>
        <p className="mt-2 text-meta t-body">
          A card will not decide it for you. Neither will a reader, but a reader will at least
          argue back.
        </p>
      </section>

      <div className="h-8" />
    </>
  )
}
