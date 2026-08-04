import { useState } from 'react'
import { products, shopCategories, user } from '../data/mock.js'
import { TopBar, BarAction } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Button, Search, Section, Stub, TextLink } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

export default function Shop() {
  const { cartCount, addToCart, showToast } = useStore()
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  const filters = ['All', ...shopCategories]
  const q = query.trim().toLowerCase()
  const list = products.filter((p) => {
    const inCat = cat === 'All' || p.category === cat
    const inQuery = !q || [p.name, p.subtitle, p.category].some((f) => f.toLowerCase().includes(q))
    return inCat && inQuery
  })

  return (
    <>
      <TopBar
        title="Shop"
        back
        backTo="/me"
        right={
          <BarAction
            onClick={() => showToast(`${cartCount} in cart`)}
            label="Cart"
            badge={cartCount}
          >
            Cart
          </BarAction>
        }
      />

      <Search value={query} onChange={setQuery} placeholder="Search stones, maalas and kits" />

      <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-rule px-6 py-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={cat === f}
            onClick={() => setCat(f)}
            className={`flex-none border-b pb-1 text-label uppercase tracking-label transition-colors ${
              cat === f ? 'border-t1 text-t1' : 'border-transparent text-t3'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Chart-derived suggestion. Framed as a convention people follow, not as
          a claim about what the stone does — the disclaimer at the foot of this
          page has to stay true of everything above it. */}
      <Section label="For your chart" tight>
        <p className="prose-c">
          For a {user.sunSign} sun with Saturn in the 12th, the two most commonly named are{' '}
          <TextLink onClick={() => setQuery('Sapphire')}>Blue Sapphire</TextLink> and{' '}
          <TextLink onClick={() => setQuery('Rudraksha')}>5 Mukhi Rudraksha</TextLink>. Commonly
          named is not the same as proven.
        </p>
      </Section>

      <Section label={`${list.length} ${list.length === 1 ? 'item' : 'items'}`} last>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10">
          {list.map((p) => {
            const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : null
            return (
              <li key={p.id}>
                <Plate seed={p.id} className="aspect-square w-full">
                  {off > 0 && (
                    <span className="absolute left-2 top-2 border border-rule bg-bg px-2 py-1 text-micro uppercase tracking-caps text-t1 tnum">
                      {off}% off
                    </span>
                  )}
                </Plate>
                <p className="mt-3 text-body text-t1">{p.name}</p>
                <p className="mt-1 text-meta text-t3">{p.subtitle}</p>

                <p className="mt-3 flex items-baseline gap-2 tnum">
                  <span className="text-body text-t1">₹{p.price.toLocaleString('en-IN')}</span>
                  {p.mrp && (
                    <span className="text-meta text-t4 line-through">
                      ₹{p.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </p>

                {p.recommendedBy && (
                  <p className="mt-2 text-micro uppercase tracking-caps text-t3">
                    Named by {p.recommendedBy}
                  </p>
                )}

                <Button className="mt-4" onClick={() => addToCart(p)}>
                  Add
                </Button>
              </li>
            )
          })}
        </ul>

        {list.length === 0 && (
          <p className="py-10 text-center text-meta text-t3">
            Nothing matches that. Clear the search or pick another category.
          </p>
        )}

        {cartCount > 0 && (
          <>
            <Stub className="my-10" />
            <Button variant="solid" onClick={() => showToast('Checkout — prototype only')}>
              Checkout · {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Button>
          </>
        )}

        <p className="mt-12 text-center text-meta text-t3">
          A stone does not fix a transit. It is a reminder you paid for. Buy it knowing that.
        </p>
      </Section>

      <div className="h-8" />
    </>
  )
}
