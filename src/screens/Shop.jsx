import { useState } from 'react'
import { products, shopCategories, user } from '../data/mock.js'
import Plate from '../components/Plate.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { Search } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Shop — a premium storefront.
 *
 * Two densities on purpose: a wide hero card for the chart-matched pick, then
 * a two-up grid for everything else. A single uniform grid reads as a
 * catalogue; the break gives the screen a front page.
 */
export default function Shop() {
  const { cartCount, addToCart, buyNow, setCartOpen, showToast } = useStore()
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  const filters = ['All', ...shopCategories]
  const q = query.trim().toLowerCase()
  const list = products.filter((p) => {
    const inCat = cat === 'All' || p.category === cat
    const inQuery = !q || [p.name, p.subtitle, p.category].some((f) => f.toLowerCase().includes(q))
    return inCat && inQuery
  })

  // The chart-matched pick leads the page when no filter is narrowing things.
  const hero = cat === 'All' && !q ? list.find((p) => p.recommendedBy) : null
  const rest = hero ? list.filter((p) => p.id !== hero.id) : list

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-none items-center justify-between gap-3 border-b border-stroke bg-bg px-5 py-4">
        <div className="min-w-0">
          <p className="font-display text-lead leading-none t-heading">Shop</p>
          <p className="mt-1 caps-sm t-faint">Stones, rituals and reports</p>
        </div>
        {/* The cart opens the sheet. It used to only fire a toast, which is
            why the badge counted up all demo with nowhere to go. */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`Cart, ${cartCount} items`}
          className="caps-sm flex-none border border-stroke px-3 py-2 t-body transition-colors hover:border-gold hover:text-gold"
        >
          Cart <span className="gold tnum">{cartCount}</span>
        </button>
      </header>

      <Search value={query} onChange={setQuery} placeholder="Search stones, maalas and kits" />

      <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-rule px-5 py-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`caps-sm flex-none border-b-2 pb-1 transition-colors ${
              cat === f ? 'border-gold gold' : 'border-transparent t-faint'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Chart-matched hero ────────────────────────────────────────── */}
      {hero && (
        <section className="border-b border-rule px-5 py-6">
          <Kicker>Matched to your chart</Kicker>
          <PopCard raised className="mt-4 overflow-hidden">
            <Plate seed={hero.id} className="aspect-[16/10] w-full">
              <span className="absolute left-3 top-3">
                <PopTag tone="gold">{hero.category}</PopTag>
              </span>
            </Plate>
            <div className="p-5">
              <p className="text-lead t-heading">{hero.name}</p>
              <p className="mt-1 text-meta t-faint">{hero.subtitle}</p>
              <p className="mt-3 text-meta t-body">
                Commonly named for a {user.sunSign} sun with Saturn in the 12th. Commonly named is
                not the same as proven.
              </p>

              <div className="mt-5 flex items-center gap-2">
                <p className="flex-1 text-title gold tnum">
                  ₹{hero.price.toLocaleString('en-IN')}
                </p>
                <PopButton size="sm" full={false} onClick={() => addToCart(hero)}>
                  Add to cart
                </PopButton>
                <PopButton size="sm" full={false} variant="gold" onClick={() => buyNow(hero)}>
                  Buy now
                </PopButton>
              </div>
            </div>
          </PopCard>
        </section>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Kicker>{`${rest.length} ${rest.length === 1 ? 'item' : 'items'}`}</Kicker>

        {rest.length === 0 ? (
          <p className="py-12 text-center text-meta t-faint">
            Nothing matches that. Clear the search or pick another category.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4">
            {rest.map((p) => {
              const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : null
              return (
                <li key={p.id}>
                  <PopCard className="flex h-full flex-col">
                    <Plate seed={p.id} className="aspect-square w-full">
                      {off > 0 && !p.soldOut && (
                        <span className="caps-sm absolute left-2 top-2 bg-gold px-1.5 py-0.5 text-bg tnum">
                          {off}% off
                        </span>
                      )}
                      {p.soldOut && (
                        <span className="absolute inset-0 flex items-center justify-center bg-bg/70">
                          <span className="caps-sm border border-live px-2 py-1 text-live">
                            Sold out
                          </span>
                        </span>
                      )}
                    </Plate>

                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-meta t-heading">{p.name}</p>
                      <p className="mt-1 text-meta t-faint">{p.subtitle}</p>

                      <p className="mt-2 flex items-baseline gap-2 tnum">
                        <span className="text-body gold">₹{p.price.toLocaleString('en-IN')}</span>
                        {p.mrp && (
                          <span className="caps-sm t-faint line-through">
                            ₹{p.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </p>

                      {p.recommendedBy && (
                        <p className="mt-2 caps-sm t-faint">Named by {p.recommendedBy}</p>
                      )}

                      {/* Two actions per listing, both compact. A sold-out
                          product keeps the row so the grid stays even, but
                          neither control is live. */}
                      <div className="mt-auto flex gap-1.5 pt-3">
                        <PopButton
                          size="sm"
                          disabled={p.soldOut}
                          onClick={() => addToCart(p)}
                          className="flex-1"
                          full={false}
                        >
                          {p.soldOut ? 'Sold out' : 'Add'}
                        </PopButton>
                        {!p.soldOut && (
                          <PopButton
                            size="sm"
                            variant="gold"
                            full={false}
                            onClick={() => buyNow(p)}
                            className="flex-1"
                          >
                            Buy
                          </PopButton>
                        )}
                      </div>
                    </div>
                  </PopCard>
                </li>
              )
            })}
          </ul>
        )}

        {cartCount > 0 && (
          <PopButton size="sm" variant="gold" onClick={() => setCartOpen(true)} className="mt-8">
            View cart · {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </PopButton>
        )}

        <p className="mt-8 text-center text-meta t-faint">
          A stone does not fix a transit. It is a reminder you paid for. Buy it knowing that.
        </p>
      </section>

      <div className="h-24" />
    </>
  )
}
