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
 * Five decks by tradition rather than one Western pack. The cards differ; the
 * register does not, because a card here describes a position you are already
 * in rather than promising an outcome.
 *
 * Bhaktamar is the odd one and leads the row: 48 real painted faces out of
 * `public/cards/`, plus a shloka, a question and a remedy per card. The other
 * four are six cards of drawn artwork each. Everything optional on a card is
 * gated on the field being there, so the two shapes share one renderer.
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
              {card.img ? (
                /* A painted deck. Only the Bhaktamar cards have faces; the
                   file sits in public/ so BASE_URL, not the bundler, resolves
                   it — GitHub Pages serves this app from a sub-path. */
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#e8e2d8]">
                  <img
                    src={`${import.meta.env.BASE_URL}cards/${card.img}`}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3">
                    <PopTag>{deck.tradition}</PopTag>
                  </span>
                  <span className="absolute right-3 top-3">
                    <PopTag tone="gold">{card.no}</PopTag>
                  </span>
                </div>
              ) : (
                <Plate
                  seed={card.id}
                  variant="engraving"
                  className="!rounded-none aspect-[3/4] w-full !shadow-none"
                >
                  <span className="absolute left-3 top-3">
                    <PopTag>{deck.tradition}</PopTag>
                  </span>
                </Plate>
              )}
              <div className="p-5 text-center">
                <p className="caps-sm gold">{card.name}</p>
                {card.sub && <p className="mt-1.5 text-meta t-faint">{card.sub}</p>}
                <Stub className="my-4" />
                <p className="text-read t-heading">{card.line}</p>
                {card.virtue && <p className="mt-4 caps-sm t-faint">{card.virtue}</p>}
              </div>
            </PopCard>

            {card.ask && <CardDetail card={card} />}

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

/**
 * The long half of a Bhaktamar card.
 *
 * Only this deck carries a shloka, a question and a remedy, so the block gates
 * on the fields rather than on the deck id — a second scripture deck will get
 * it for free.
 *
 * The Devanagari is set in whatever the system has; Plus Jakarta Sans covers
 * no Indic script, so pinning a family here would only pick a worse fallback
 * than the one the platform already chose.
 */
function CardDetail({ card }) {
  return (
    <div className="pop-inset mt-4 p-4">
      <p className="caps-sm t-faint">Ask yourself</p>
      <p className="mt-1.5 text-meta t-heading">{card.ask}</p>

      <Stub className="my-4" />

      <p className="caps-sm t-faint">Shloka {card.no}</p>
      <p lang="sa" className="mt-1.5 text-read leading-relaxed t-body">
        {card.sa}
      </p>
      <p className="mt-2 text-meta italic t-faint">{card.iast}</p>

      <Stub className="my-4" />

      <p className="caps-sm t-faint">Remedy</p>
      <p className="mt-1.5 text-meta t-body">{card.remedy}</p>
    </div>
  )
}
