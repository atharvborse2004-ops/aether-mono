import { useState } from 'react'
import { TAROT_PRICE, tarotDecks } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Stub } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Tarot — one free card a week, then priced per pull.
 *
 * Four decks by tradition rather than one Western pack. The cards differ; the
 * register does not, because a card here describes a position you are already
 * in rather than promising an outcome.
 *
 * The free pull is tracked on the store's `flags` Set (`tarot:usedFree`), so it
 * survives navigation without a new state slice. Paid pulls go through
 * `spend()`, which already refuses and toasts when the wallet is short — the
 * one place this screen can fail, handled by the thing that handles it
 * everywhere else.
 *
 * ponytail: "weekly" is a single flag, not a dated window. Nothing in this app
 * persists across a reload, so a real week boundary would need a clock and a
 * store that remembers — add both together or neither.
 */
export default function Tarot() {
  const { showToast, hasFlag, toggleFlag, spend, balance } = useStore()
  const [deck, setDeck] = useState(tarotDecks[0])
  const [card, setCard] = useState(null)

  const usedFree = hasFlag('tarot:usedFree')

  const pull = () => {
    // First of the week is free; after that each card is charged, and spend()
    // returns false when the wallet cannot cover it.
    if (usedFree) {
      if (!spend(TAROT_PRICE, `Tarot · ${deck.name}`)) return
    } else {
      toggleFlag('tarot:usedFree')
      showToast('Your free card this week')
    }

    const pool = deck.cards.filter((c) => c.id !== card?.id)
    setCard(pool[Math.floor(Math.random() * pool.length)])
  }

  const canAfford = !usedFree || balance >= TAROT_PRICE

  return (
    <>
      <TopBar
        title="Tarot"
        back
        backTo="/home"
        sub={usedFree ? `₹${TAROT_PRICE} a card` : 'One free this week'}
      />

      {/* ── Deck ───────────────────────────────────────────────────────── */}
      <section className="px-4 pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {tarotDecks.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={deck.id === d.id}
              onClick={() => {
                setDeck(d)
                setCard(null)
              }}
              className="pill caps-sm"
            >
              {d.tradition}
            </button>
          ))}
        </div>
        <p className="mt-3 text-meta t-body">
          <span className="caps-sm t-faint">{deck.name} · </span>
          {deck.line}
        </p>
      </section>

      {/* ── The pull ───────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        {card ? (
          <>
            <PopCard raised className="overflow-hidden">
              <Plate
                seed={card.id}
                variant="engraving"
                className="!rounded-none aspect-[3/4] w-full !shadow-none"
              >
                <span className="absolute left-3 top-3">
                  <PopTag>{deck.tradition}</PopTag>
                </span>
              </Plate>
              <div className="p-5 text-center">
                <p className="caps-sm gold">{card.name}</p>
                <Stub className="my-4" />
                <p className="text-read t-heading">{card.line}</p>
              </div>
            </PopCard>

            <div className="mt-6 flex items-center gap-2">
              <PopButton
                variant="ghost"
                className="flex-1"
                full={false}
                disabled={!canAfford}
                onClick={pull}
              >
                {canAfford ? `Another · ₹${TAROT_PRICE}` : 'Top up to pull'}
              </PopButton>
              <PopButton variant="gold" className="flex-1" full={false} to="/consult">
                Read it properly
              </PopButton>
            </div>

            {!canAfford && (
              <PopButton variant="ghost" to="/wallet" className="mt-3">
                Add money
              </PopButton>
            )}

            <p className="mt-6 text-center text-meta t-faint">
              One card is a prompt, not a reading. A tarot reader will do the other twenty minutes.
            </p>
          </>
        ) : (
          <div className="text-center">
            <Plate seed={`back-${deck.id}`} variant="contour" className="mx-auto aspect-[3/4] w-2/3" />
            <p className="mx-auto mt-8 max-w-measure text-read t-sub">
              Hold the question you actually came with. Not the tidy version.
            </p>
            <PopButton variant="gold" className="mt-8" disabled={!canAfford} onClick={pull}>
              {usedFree ? `Pull a card · ₹${TAROT_PRICE}` : 'Pull your free card'}
            </PopButton>
            <p className="mt-4 caps-sm t-faint">
              {usedFree
                ? `Free card used · ₹${TAROT_PRICE} each after that`
                : 'One free every week · then ₹' + TAROT_PRICE}
            </p>
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
