import { useState } from 'react'
import { topUpAmounts, walletTransactions } from '../data/mock.js'
import { Sheet, TopBar } from '../components/Chrome.jsx'
import { Kicker, PopButton, PopCard, PopTag } from '../components/Pop.jsx'
import { useStore } from '../store.jsx'

/**
 * Wallet.
 *
 * The balance card is the one raised object on the screen — it is the thing
 * the screen is about, so it gets the offset block and everything else stays
 * flat. Top-up runs through a sheet rather than a route so the balance stays
 * on screen while you choose an amount.
 */
export default function Wallet() {
  const { balance, ledger, addMoney, showToast } = useStore()
  const [sheet, setSheet] = useState(false)
  const [amount, setAmount] = useState(topUpAmounts[1])
  const [custom, setCustom] = useState('')

  // Session top-ups sit above the seeded history rather than replacing it.
  const rows = [...ledger, ...walletTransactions]

  const chosen = custom.trim() ? Number(custom.replace(/[^0-9]/g, '')) : amount
  const valid = Number.isFinite(chosen) && chosen >= 100 && chosen <= 100000

  const confirm = () => {
    if (!valid) return
    addMoney(chosen)
    setSheet(false)
    setCustom('')
  }

  return (
    <>
      <TopBar title="Wallet" back backTo="/profile" />

      {/* ── Balance ───────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <PopCard raised className="p-5">
          <p className="caps-sm t-faint">Available balance</p>
          <p className="mt-2 font-display text-huge leading-none tnum t-heading">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="mt-3 text-meta t-body">
            Sessions, question packs and course fees are drawn from here.
          </p>

          <div className="mt-6 flex gap-3">
            <PopButton size="sm" variant="gold" onClick={() => setSheet(true)}>
              Add money
            </PopButton>
            <PopButton onClick={() => showToast('Statement — prototype only')}>
              Statement
            </PopButton>
          </div>
        </PopCard>
      </section>

      {/* ── Quick recharge ────────────────────────────────────────────── */}
      <section className="border-t border-rule px-5 py-6">
        <Kicker>Quick recharge</Kicker>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {topUpAmounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAmount(a)
                setCustom('')
                setSheet(true)
              }}
              className="pop-card px-3 py-4 text-left transition-colors hover:border-gold"
            >
              <span className="block text-lead tnum t-heading">₹{a.toLocaleString('en-IN')}</span>
              {a >= 2000 && <span className="mt-1 block caps-sm gold">+2% cashback</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Transactions ──────────────────────────────────────────────── */}
      <section className="border-t border-rule px-5 py-6">
        <Kicker action="All" onAction={() => showToast('Full history — prototype only')}>
          Recent transactions
        </Kicker>

        <ul className="mt-4">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 border-b border-rule py-3.5 last:border-b-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-meta t-heading">{t.label}</span>
                <span className="mt-1 block caps-sm t-faint tnum">
                  {t.date} · {t.method}
                </span>
              </span>
              <span
                className={`flex-none text-meta tnum ${t.kind === 'credit' ? 'text-ok' : 't-sub'}`}
              >
                {t.kind === 'credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-rule px-5 py-6">
        <p className="text-center text-meta t-faint">
          Prototype wallet. No payment is taken and the balance resets on reload.
        </p>
      </section>

      <div className="h-8" />

      {/* ── Top-up sheet ──────────────────────────────────────────────── */}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Add money">
        <p className="caps-sm t-faint">Choose an amount</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {topUpAmounts.map((a) => {
            const on = !custom.trim() && amount === a
            return (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a)
                  setCustom('')
                }}
                aria-pressed={on}
                className="pill justify-center text-lead tnum !px-3 !py-3.5"
              >
                ₹{a.toLocaleString('en-IN')}
              </button>
            )
          })}
        </div>

        <p className="mt-8 caps-sm t-faint">Or type one</p>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          inputMode="numeric"
          placeholder="₹ amount"
          aria-label="Custom amount"
          className="mt-3 w-full border-b border-rule bg-transparent pb-3 text-title tnum t-heading outline-none transition-colors placeholder:text-t4 focus:border-gold"
        />
        {custom.trim() && !valid && (
          <p className="mt-2 text-meta text-live">Enter between ₹100 and ₹1,00,000.</p>
        )}

        <div className="mt-8 flex items-baseline justify-between border-t border-stroke pt-4">
          <span className="caps-sm t-faint">New balance</span>
          <span className="text-lead tnum t-heading">
            ₹{(balance + (valid ? chosen : 0)).toLocaleString('en-IN')}
          </span>
        </div>

        <PopButton size="sm" variant="gold" disabled={!valid} onClick={confirm} className="mt-6">
          {valid ? `Add ₹${chosen.toLocaleString('en-IN')}` : 'Choose an amount'}
        </PopButton>

        <div className="mt-5 flex items-center justify-center gap-2">
          <PopTag>UPI</PopTag>
          <PopTag>Card</PopTag>
          <PopTag>Netbanking</PopTag>
        </div>
        <p className="mt-4 text-center text-meta t-faint">
          Prototype — no payment method is charged.
        </p>
      </Sheet>
    </>
  )
}
