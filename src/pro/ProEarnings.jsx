import { useState } from 'react'
import { earnings, earningsSeries, payouts, proLedger, referrals, topUpAmounts } from '../data/mock.js'
import { Sheet, TabHeader } from '../components/Chrome.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopAvatar, PopButton, PopCard, PopTag, Stat } from '../components/Pop.jsx'
import { Field } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

/**
 * Earnings — structurally the mirror of the seeker's Wallet screen: a balance
 * card, figures, a ledger, a sheet. Where it differs is that every row carries
 * gross, the platform's cut and net. A consultant ledger whose rows are all
 * credits of the sticker price is the one thing that makes this look fake.
 */
export default function ProEarnings() {
  const { showToast } = useStore()
  const [sheet, setSheet] = useState(false)
  const [amount, setAmount] = useState(earnings.available)

  const fee = Math.round((amount * earnings.commissionPct) / 100)

  return (
    <>
      <TabHeader />

      {/* ── The balance ────────────────────────────────────────────────── */}
      <section className="px-5 pb-2 pt-5">
        <PopCard raised className="p-5">
          <p className="caps-sm t-faint">Available to withdraw</p>
          <p className="mt-2 font-display text-huge leading-none tnum t-heading">
            ₹{earnings.available.toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-meta t-body">
            ₹{earnings.pending.toLocaleString('en-IN')} still clearing. Next payout{' '}
            {earnings.nextPayoutOn}.
          </p>

          <div className="mt-5 flex items-center gap-2">
            <PopButton variant="gold" className="flex-1" full={false} onClick={() => setSheet(true)}>
              Withdraw
            </PopButton>
            <PopButton
              variant="ghost"
              className="flex-1"
              full={false}
              onClick={() => showToast('Statement — prototype only')}
            >
              Statement
            </PopButton>
          </div>
        </PopCard>
      </section>

      {/* ── Figures ────────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="This month" value={`₹${(earnings.thisMonth / 1000).toFixed(1)}k`} />
          <Stat label="Clearing" value={`₹${(earnings.pending / 1000).toFixed(1)}k`} />
          <Stat label="Lifetime" value={`₹${(earnings.lifetime / 100000).toFixed(1)}L`} />
        </div>
      </section>

      {/* ── Last seven days ────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Last 7 days</Kicker>
        <Bars data={earningsSeries} />
      </section>

      {/* ── Per-session ledger ─────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Sessions</Kicker>
        <ul className="mt-3">
          {proLedger.map((r) => (
            <li
              key={r.id}
              className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-meta t-sub">{r.label}</span>
                <span className="mt-0.5 block caps-sm t-faint tnum">
                  {r.date} · ₹{r.gross.toLocaleString('en-IN')} − ₹{r.fee}
                </span>
              </span>
              <span className="flex-none text-meta tnum text-ok">
                +₹{r.net.toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Referrals ──────────────────────────────────────────────────────
          Sits with the money because that is what it is: another line of
          revenue, not a social feature. */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Referrals</Kicker>

        <PopCard className="mt-4 p-4">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="caps-sm t-faint">Your code</span>
              <span className="mt-1 block font-display text-lead tnum t-heading">
                {referrals.code}
              </span>
            </span>
            <button
              type="button"
              aria-label="Share your code"
              onClick={() => showToast('Code copied')}
              className="pill knob !h-10 !w-10 flex-none justify-center"
            >
              <Icon name="share" size={17} />
            </button>
          </div>
          <p className="mt-3 text-meta t-body">
            Bring another reader in. You earn ₹{referrals.perJoin.toLocaleString('en-IN')} once
            they finish their first paid session — not when they sign up.
          </p>
        </PopCard>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Invited" value={referrals.invited} />
          <Stat label="Joined" value={referrals.joined} />
          <Stat label="Earned" value={`₹${(referrals.earned / 1000).toFixed(1)}k`} />
        </div>

        <ul className="mt-5">
          {referrals.list.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0"
            >
              <PopAvatar initials={r.initials} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-meta t-heading">{r.name}</span>
                <span className="mt-0.5 block caps-sm t-faint">Joined {r.joined}</span>
              </span>
              {r.earned > 0 ? (
                <span className="flex-none text-meta tnum text-ok">
                  +₹{r.earned.toLocaleString('en-IN')}
                </span>
              ) : (
                <PopTag>{r.status}</PopTag>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Payouts ────────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Kicker>Payouts</Kicker>
        <ul className="mt-3">
          {payouts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 border-b border-rule py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block text-meta tnum t-heading">
                  ₹{p.amount.toLocaleString('en-IN')}
                </span>
                <span className="mt-0.5 block caps-sm t-faint">
                  {p.date} · {p.method}
                </span>
              </span>
              <PopTag>{p.status}</PopTag>
            </li>
          ))}
        </ul>
      </section>

      <div className="h-24" />

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Withdraw">
        <p className="label mb-4 text-left">Amount</p>
        <div className="mb-8 grid grid-cols-3 gap-2">
          {[...topUpAmounts, earnings.available].map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={amount === a}
              onClick={() => setAmount(a)}
              className="pill caps-sm justify-center tnum"
            >
              ₹{a.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <Field k="Gross" v={`₹${amount.toLocaleString('en-IN')}`} />
        <Field k={`Platform fee · ${earnings.commissionPct}%`} v={`−₹${fee.toLocaleString('en-IN')}`} />
        <Field k="You receive" v={`₹${(amount - fee).toLocaleString('en-IN')}`} />
        <Field k="To" v="HDFC ••4412" />

        <PopButton
          variant="gold"
          className="mt-8"
          disabled={amount > earnings.available}
          onClick={() => {
            setSheet(false)
            showToast(`Withdrawal requested · ₹${(amount - fee).toLocaleString('en-IN')}`)
          }}
        >
          {amount > earnings.available ? 'More than you have' : 'Request withdrawal'}
        </PopButton>
        <p className="mt-5 text-center text-meta t-faint">
          Prototype — no money moves and no account is debited.
        </p>
      </Sheet>
    </>
  )
}

/**
 * Seven bars. Heights go through `style`, never an interpolated class —
 * Tailwind scans source text, so `h-[${n}px]` is a class that is never
 * generated and a bar that never renders. `PopBar` and `Ruler` do the same.
 */
function Bars({ data }) {
  const max = Math.max(...data.map((d) => d.value))
  const best = data.find((d) => d.value === max)

  return (
    <>
      <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
        {data.map((d) => (
          <span key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="w-full rounded-t-md bg-gold-fill"
              style={{ height: `${Math.max(6, (d.value / max) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[10px] t-faint">
            {d.label}
          </span>
        ))}
      </div>
      <p className="mt-4 text-meta t-body">
        Best day was {best.label} at ₹{max.toLocaleString('en-IN')}. Weekends carry this practice.
      </p>
    </>
  )
}
