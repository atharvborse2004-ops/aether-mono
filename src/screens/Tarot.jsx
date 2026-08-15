import { useState } from 'react'
import { TAROT_PRICE, tarotDecks } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Stub } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Tarot — two free cards a week, then priced per pull.
 *
 * Five decks by tradition rather than one Western pack. The cards differ; the
 * register does not, because a card here describes a position you are already
 * in rather than promising an outcome.
 *
 * Bhaktamar is the odd one and leads the row: 48 real painted faces out of
 * `public/cards/`, plus the shloka in Sanskrit and English, a question and a
 * remedy per card. The other four are six cards of drawn artwork each.
 * Everything optional on a card is gated on the field being there, so the two
 * shapes share one renderer.
 *
 * **Price is not shown until a card has been pulled.** Leading with "₹11 after
 * your free ones" sells before the thing has been handed over; the screen asks
 * for the question first and settles up afterwards.
 *
 * The free pulls are two flags on the store's `flags` Set rather than a
 * counter, because `flags` is a Set of strings and that is the extensibility
 * hatch this app already has — two entries beat a new store slice. Paid pulls
 * go through `spend()`, which already refuses and toasts when the wallet is
 * short.
 *
 * ponytail: "weekly" is a pair of flags, not a dated window. Nothing in this
 * app persists across a reload, so a real week boundary would need a clock and
 * a store that remembers — add both together or neither.
 */
const FREE_PULLS = 2
const FREE_KEYS = ['tarot:free1', 'tarot:free2']

export default function Tarot() {
  const { showToast, hasFlag, toggleFlag, spend, balance, lang, t } = useStore()
  const [deck, setDeck] = useState(tarotDecks[0])
  const [card, setCard] = useState(null)

  const usedFree = FREE_KEYS.filter(hasFlag).length
  const freeLeft = FREE_PULLS - usedFree
  const paying = freeLeft <= 0

  const pull = () => {
    // Two a week are free; after that each card is charged, and spend()
    // returns false when the wallet cannot cover it.
    if (paying) {
      if (!spend(TAROT_PRICE, `Tarot · ${deck.name}`)) return
    } else {
      toggleFlag(FREE_KEYS[usedFree])
      showToast(t(freeLeft === 1 ? 'tarot.lastFree' : 'tarot.oneMore'))
    }

    const pool = deck.cards.filter((c) => c.id !== card?.id)
    setCard(pool[Math.floor(Math.random() * pool.length)])
  }

  const canAfford = !paying || balance >= TAROT_PRICE

  return (
    <>
      <TopBar
        title={t('tarot.title')}
        back
        backTo="/home"
        sub={
          card
            ? paying
              ? `₹${TAROT_PRICE} ${t('tarot.aCard')}`
              : `${freeLeft} ${t('tarot.freeLeft')}`
            : null
        }
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
              {lang === 'hi' ? d.traditionHi : d.tradition}
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
                    <PopTag>{lang === 'hi' ? deck.traditionHi : deck.tradition}</PopTag>
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
                    <PopTag>{lang === 'hi' ? deck.traditionHi : deck.tradition}</PopTag>
                  </span>
                </Plate>
              )}
              {/* The shloka comes straight off the face, before any reading
                  of it — the verse is the card, the meaning is our gloss on
                  it. Sanskrit first, then English. */}
              {card.sa ? (
                <div className="border-t border-stroke p-5">
                  <p className="caps-sm t-faint">
                    {t('tarot.shloka')} {card.no}
                  </p>
                  <p lang="sa" className="mt-2 text-read leading-relaxed t-body">
                    {card.sa}
                  </p>
                  <p className="mt-2 text-meta italic t-faint">{card.iast}</p>
                  {card.en && (
                    <>
                      <Stub className="my-4" />
                      <p className="text-meta t-sub">{card.en}</p>
                    </>
                  )}
                </div>
              ) : null}
            </PopCard>

            {/* What the card means. Title, the line under it, and the virtue
                it is asking for. */}
            <div className="pop-inset mt-4 p-5 text-center">
              <p className="caps-sm gold">{card.name}</p>
              {card.sub && <p className="mt-1.5 text-meta t-faint">{card.sub}</p>}
              <Stub className="my-4" />
              <p className="text-read t-heading">{card.line}</p>
              {card.virtue && <p className="mt-4 caps-sm t-faint">{card.virtue}</p>}
            </div>

            {card.ask && <CardDetail card={card} />}

            <div className="mt-6 flex items-center gap-2">
              <PopButton
                variant="ghost"
                className="flex-1"
                full={false}
                disabled={!canAfford}
                onClick={pull}
              >
                {canAfford ? `${t('tarot.another')} · ₹${TAROT_PRICE}` : t('tarot.topUp')}
              </PopButton>
              <PopButton variant="gold" className="flex-1" full={false} to="/consult">
                {t('tarot.askReader')}
              </PopButton>
            </div>

            {!canAfford && (
              <PopButton variant="ghost" to="/wallet" className="mt-3">
                {t('a.addMoney')}
              </PopButton>
            )}

            <p className="mt-6 text-center text-meta t-faint">
              {t('tarot.prompt')}
            </p>
          </>
        ) : (
          <div className="text-center">
            <Plate seed={`back-${deck.id}`} variant="contour" className="mx-auto aspect-[3/4] w-2/3" />
            <p className="mx-auto mt-8 max-w-measure text-read t-sub">
              {t('tarot.hold')}
            </p>
            <PopButton variant="gold" className="mt-8" disabled={!canAfford} onClick={pull}>
              {paying ? `${t('tarot.pull')} · ₹${TAROT_PRICE}` : t('tarot.pull')}
            </PopButton>
            {/* Nothing about cost before the first pull. Once you have paid
                once you already know the terms, so the reminder is only
                withheld from someone who has not seen a card yet. */}
            {paying && (
              <p className="mt-4 caps-sm t-faint">
                {t('tarot.freeUsed', { price: TAROT_PRICE })}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="border-t border-rule px-5 py-6">
        <Kicker action={t('tarot.askStars')} to="/ask">
          {t('tarot.stuck')}
        </Kicker>
        <p className="mt-2 text-meta t-body">
          {t('tarot.notDecide')}
        </p>
      </section>

      <div className="h-8" />
    </>
  )
}

/**
 * The long half of a Bhaktamar card: what to sit with, and what to do.
 *
 * Only this deck carries a question and a remedy, so the block gates on the
 * fields rather than on the deck id — a second scripture deck will get it for
 * free. The shloka used to live here and now sits on the card itself, because
 * the verse is the card rather than a footnote to it.
 */
function CardDetail({ card }) {
  const { t } = useStore()
  return (
    <div className="pop-inset mt-4 p-4">
      <p className="caps-sm t-faint">{t('tarot.askYourself')}</p>
      <p className="mt-1.5 text-meta t-heading">{card.ask}</p>

      <Stub className="my-4" />

      <p className="caps-sm t-faint">{t('tarot.remedy')}</p>
      <p className="mt-1.5 text-meta t-body">{card.remedy}</p>
    </div>
  )
}
