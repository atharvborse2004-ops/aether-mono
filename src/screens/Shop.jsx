import { useState } from 'react'
import { products, shopCategories } from '../data/mock.js'
import { TopBar, BarAction } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import { Button, Section } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

export default function Shop() {
  const { cartCount, addToCart } = useStore()
  const [cat, setCat] = useState('All')
  const filters = ['All', ...shopCategories]
  const list = cat === 'All' ? products : products.filter((p) => p.category === cat)

  return (
    <>
      <TopBar
        title="Shop"
        back
        backTo="/me"
        right={<BarAction label="Cart" badge={cartCount}>Cart</BarAction>}
      />

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

      <Section label={`${list.length} items`} last>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10">
          {list.map((p) => (
            <li key={p.id}>
              <Plate seed={p.id} className="aspect-square w-full" />
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
          ))}
        </ul>

        <p className="mt-12 text-center text-meta text-t3">
          A stone does not fix a transit. It is a reminder you paid for. Buy it knowing that.
        </p>
      </Section>

      <div className="h-8" />
    </>
  )
}
