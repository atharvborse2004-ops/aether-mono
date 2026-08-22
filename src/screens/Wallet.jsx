import { TopBar } from '../components/Chrome.jsx'
import { Kicker, PopButton, PopCard } from '../components/Pop.jsx'
import { rupees, useStore } from '../store.jsx'

/**
 * Wallet.
 *
 * The balance card is the one raised object on the screen — it is the thing
 * the screen is about, so it gets the offset block and everything else stays
 * flat.
 *
 * Since phase 2 the balance and the history are real, read back from the
 * server. Adding money is not: there is no payment provider until phase 3,
 * and a client-callable credit before then is a mint. So the top-up sheet,
 * the quick-recharge grid and the cashback label are gone rather than
 * pretending — a button that moves a real balance with no money behind it is
 * the one thing this screen must not do. To fund a test wallet, see the note
 * at the foot of backend/schema/003_wallets_ledger.sql.
 */
export default function Wallet() {
  const { balance, ledger, showToast } = useStore()

  return (
    <>
      <TopBar title="Wallet" back backTo="/profile" />

      {/* ── Balance ───────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <PopCard raised className="p-5">
          <p className="caps-sm t-faint">Available balance</p>
          <p className="mt-2 font-display text-huge leading-none tnum t-heading">
            {balance === null ? '—' : `₹${rupees(balance)}`}
          </p>
          <p className="mt-3 text-meta t-body">
            Sessions, question packs and course fees are drawn from here.
          </p>

          <div className="mt-6 flex gap-3">
            <PopButton size="sm" variant="gold" disabled>
              Add money
            </PopButton>
            <PopButton onClick={() => showToast('Statement — not built yet')}>
              Statement
            </PopButton>
          </div>
          <p className="mt-4 text-meta t-faint">
            Adding money opens when payments do, in phase 3.
          </p>
        </PopCard>
      </section>

      {/* ── Transactions ──────────────────────────────────────────────── */}
      <section className="border-t border-rule px-5 py-6">
        <Kicker action="All" onAction={() => showToast('Full history — not built yet')}>
          Recent transactions
        </Kicker>

        <ul className="mt-4">
          {ledger.map((t) => (
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
                {t.kind === 'credit' ? '+' : '−'}₹{rupees(t.amountPaise)}
              </span>
            </li>
          ))}
          {ledger.length === 0 && (
            <li className="py-4 text-meta t-faint">
              Nothing has moved through this wallet yet.
            </li>
          )}
        </ul>
      </section>

      <section className="border-t border-rule px-5 py-6">
        <p className="text-center text-meta t-faint">
          Every figure here is the server's. The balance is a sum of the
          entries below it, and neither can be edited from this device.
        </p>
      </section>

      <div className="h-8" />

    </>
  )
}
