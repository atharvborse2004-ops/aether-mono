import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  clips,
  earnings,
  earningsSeries,
  insights,
  liveSessions,
  mine,
  payouts,
  posts,
  pro,
  proLedger,
  proMetrics,
  reads,
  referrals,
  topUpAmounts,
  warnings,
} from '../data/mock.js'
import { Sheet, TabHeader } from '../components/Chrome.jsx'
import Plate from '../components/Plate.jsx'
import Icon from '../components/Icon.jsx'
import { Kicker, PopAvatar, PopButton, PopCard, PopTag, Stat } from '../components/Pop.jsx'
import { Avatar, Field, Row, Segmented, Tag, Ticks } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

const TABS = [
  { key: 'content', label: 'Content' },
  { key: 'insights', label: 'Insights' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'settings', label: 'Settings' },
]

/**
 * Everything the consultant has published, pulled out of the shared lists
 * rather than stored again. Each item keeps the route its viewer already
 * lives at, so a tile opens the real screen a client would see.
 */
const published = [
  ...mine(clips).map((x) => ({ id: x.id, kind: 'Reel', title: x.caption, meta: `${x.views} views`, to: `/reels/${x.id}` })),
  ...mine(reads).map((x) => ({ id: x.id, kind: 'Article', title: x.title, meta: `${x.views} read`, to: `/read/${x.id}` })),
  ...mine(posts).map((x) => ({ id: x.id, kind: 'Note', title: x.text, meta: `${x.likes} likes`, to: '/home' })),
  ...mine(liveSessions).map((x) => ({ id: x.id, kind: 'Live', title: x.topic, meta: `${x.viewers || '—'} watching`, to: `/live/${x.id}` })),
]

export default function ProProfile() {
  const { tab = 'content' } = useParams()
  const navigate = useNavigate()

  if (!TABS.some((t) => t.key === tab)) return <Navigate to="/pro/profile" replace />

  return (
    <>
      <TabHeader />

      {/* Identity. The same block a client sees on /consult/a1 — same order,
          same inline stats line — so the consultant recognises his own page. */}
      <section className="px-5 pb-6 pt-6">
        <div className="flex items-start gap-4">
          <Avatar initials={pro.initials} size={76} />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate text-lead font-semibold t-heading">{pro.name}</h1>
            <p className="mt-0.5 truncate text-meta t-body">{pro.specialization}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] t-faint tnum">
              <span className="font-bold t-sub">{pro.rating}</span> rating
              <span aria-hidden="true">·</span>
              <span className="font-bold t-sub">{pro.reviewCount.toLocaleString('en-IN')}</span> reviews
              <span aria-hidden="true">·</span>
              <span className="font-bold t-sub">{pro.experience}</span>
              <span aria-hidden="true">·</span>
              <span className="font-bold t-sub">{pro.followers}</span> followers
            </p>
          </div>
        </div>

        <p className="mt-4 text-meta leading-relaxed t-sub">{pro.bio}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {pro.credentials.map((cr) => (
            <Tag key={cr}>{cr}</Tag>
          ))}
        </div>

        {/* The whole public surface — About, Work, Reviews, the booking sheet —
            already exists at /consult/:id and stays in sync for free. Linking
            to it beats rebuilding it here and then watching the two drift. */}
        <div className="mt-5">
          <Row to={`/consult/${pro.id}`} title="View your public page" note="Exactly what a client sees" />
        </div>
      </section>

      <Segmented
        items={TABS}
        value={tab}
        onChange={(k) => navigate(k === 'content' ? '/pro/profile' : `/pro/profile/${k}`)}
      />

      <div key={tab} className="animate-fade">
        {tab === 'content' && <Content />}
        {tab === 'insights' && <Insights />}
        {tab === 'reviews' && <Reviews />}
        {tab === 'earnings' && <Earnings />}
        {tab === 'settings' && <Settings />}
      </div>

      <div className="h-24" />
    </>
  )
}

function Content() {
  return (
    <section className="px-5 py-6">
      <Kicker action="Post something" to="/pro/studio">
        {`${published.length} published`}
      </Kicker>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {published.map((p) => (
          <li key={`${p.kind}-${p.id}`}>
            <Link to={p.to} className="block">
              <Plate seed={p.id} className="aspect-square w-full">
                <span className="absolute left-1.5 top-1.5">
                  <PopTag tone={p.kind === 'Live' ? 'live' : 'default'}>{p.kind}</PopTag>
                </span>
              </Plate>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-tight t-sub">{p.title}</p>
              <p className="mt-0.5 text-[10px] t-faint tnum">{p.meta}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Insights ─────────────────────────────────────────────────────────────
   Reach, who it reached, when they are awake, and what is slipping. The last
   of those is the only part that asks for an action, so it is visually
   separated and every item links to the screen that fixes it. */

function Insights() {
  return (
    <>
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Last 7 days</Kicker>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            label="Reach"
            value={`${(insights.reach / 1000).toFixed(1)}k`}
            sub={`${insights.reachDeltaPct > 0 ? '↑' : '↓'} ${Math.abs(insights.reachDeltaPct)}%`}
          />
          <Stat
            label="Profile views"
            value={insights.profileViews.toLocaleString('en-IN')}
            sub={`${insights.profileViewsDeltaPct > 0 ? '↑' : '↓'} ${Math.abs(insights.profileViewsDeltaPct)}%`}
          />
          <Stat label="New followers" value={`+${insights.followersGained}`} sub={`${insights.saves} saves`} />
        </div>
      </section>

      {/* ── Who saw it ───────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Who saw your work</Kicker>
        <ul className="mt-4 space-y-3">
          {insights.viewers.map((v) => (
            <li key={v.label} className="flex items-center gap-3">
              <span className="w-24 flex-none text-meta t-sub">{v.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                <span
                  className="block h-full rounded-full bg-gold-fill"
                  style={{ width: `${v.pct}%` }}
                />
              </span>
              <span className="w-9 flex-none text-right text-meta tnum t-heading">{v.pct}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 caps-sm t-faint">Mostly from {insights.topCities.join(' · ')}</p>
      </section>

      {/* ── When to post ─────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>When they are awake</Kicker>
        <div className="mt-4 flex h-20 items-end gap-1" aria-hidden="true">
          {insights.byHour.map((v, i) => {
            const max = Math.max(...insights.byHour)
            const peak = v === max
            return (
              <span
                key={i}
                className={`flex-1 rounded-t-sm ${peak ? 'bg-gold-fill' : 'bg-black/15'}`}
                style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
              />
            )
          })}
        </div>
        <div className="mt-2 flex justify-between caps-sm t-faint tnum">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>12a</span>
        </div>
        <p className="mt-4 text-meta t-body">
          Your audience is on at <span className="gold">{insights.bestWindow}</span>. Posting
          before six in the evening costs you roughly a third of the reach.
        </p>
      </section>

      {/* ── Per piece ────────────────────────────────────────────────── */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>How each piece did</Kicker>
        <ul className="mt-3">
          {insights.topContent.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 border-b border-rule py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-meta t-sub">{c.title}</span>
                <span className="mt-0.5 flex items-center gap-1.5 caps-sm t-faint tnum">
                  <Icon name="eye" size={13} />
                  {c.views.toLocaleString('en-IN')} · {c.kind}
                </span>
              </span>
              <span
                className={`flex-none text-meta tnum ${c.vsAvgPct >= 0 ? 'text-ok' : 'text-live'}`}
              >
                {c.vsAvgPct >= 0 ? '+' : ''}
                {c.vsAvgPct}%
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 caps-sm t-faint">Against your own average, not the platform's.</p>
      </section>

      {/* ── What is slipping ─────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Kicker>Worth fixing</Kicker>
        <ul className="mt-4 space-y-3">
          {warnings.map((w) => (
            <li key={w.id}>
              <Link to={w.to} className="pop-card pop-tap block p-4">
                <span className="flex items-start gap-3">
                  <span
                    className={`flex-none ${w.tone === 'bad' ? 'text-live' : 'gold'}`}
                    aria-hidden="true"
                  >
                    <Icon name="alert" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-meta t-heading">{w.title}</span>
                    <span className="mt-1 block text-meta t-body">{w.line}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Reviews() {
  return (
    <section className="px-5 py-6">
      <Kicker>{`${pro.reviewCount.toLocaleString('en-IN')} reviews`}</Kicker>

      <div className="mt-4 flex items-center gap-5 border-b border-rule pb-6">
        <div className="flex-none text-center">
          <p className="font-display text-display tnum t-heading">{pro.rating}</p>
          <Ticks value={Math.round(pro.rating)} className="mt-2 w-16" />
        </div>
        <p className="min-w-0 flex-1 text-meta t-body">
          Clients rate the session, not the news in it. A four is usually a chart you did not
          want to hear read out.
        </p>
      </div>

      <ul>
        {pro.reviews.map((r) => (
          <li key={r.id} className="border-b border-rule py-5 last:border-b-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-meta t-heading">{r.name}</span>
              <span className="flex items-center gap-3">
                <Ticks value={r.rating} className="w-12" />
                <span className="caps-sm t-faint">{r.ago}</span>
              </span>
            </div>
            <p className="mt-3 text-meta t-sub">{r.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Earnings ─────────────────────────────────────────────────────────────
   Structurally the mirror of the seeker's Wallet screen: a balance card,
   figures, a ledger, a sheet. Where it differs is that every row carries
   gross, the platform's cut and net — a consultant ledger whose rows are all
   credits of the sticker price is the one thing that makes this look fake.
   Ported from the old standalone /pro/earnings route unchanged, minus its
   own TabHeader (Profile owns one now). */

function Earnings() {
  const { showToast } = useStore()
  const [sheet, setSheet] = useState(false)
  const [amount, setAmount] = useState(earnings.available)

  const fee = Math.round((amount * earnings.commissionPct) / 100)

  const answerRate = Math.round((proMetrics.callsAttended / proMetrics.callsRequested) * 100)
  const missed = proMetrics.callsRequested - proMetrics.callsAttended
  // `Bars` wants {label, value}; the reply series is seven bare minutes.
  const replySeries = proMetrics.replyByDay.map((value, i) => ({
    label: earningsSeries[i].label,
    value,
  }))

  return (
    <>
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

      {/* ── How she is performing ───────────────────────────────────────
          Answer rate and reply speed live with the money because that is what
          they are: the two things that decide whether a request becomes a
          session. A missed call is a refund and a slow reply is a cancelled
          booking. */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Performance</Kicker>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PopCard className="p-4">
            <p className="caps-sm t-faint">Median reply</p>
            <p className="mt-1.5 text-lead tnum t-heading">{proMetrics.medianReplyMins} min</p>
            <p className="mt-1 caps-sm tnum text-ok">
              Target {proMetrics.replyTargetMins} min
            </p>
          </PopCard>
          <PopCard className="p-4">
            <p className="caps-sm t-faint">Calls attended</p>
            <p className="mt-1.5 text-lead tnum t-heading">
              {proMetrics.callsAttended}
              <span className="t-faint">/{proMetrics.callsRequested}</span>
            </p>
            <p className="mt-1 caps-sm tnum t-body">{answerRate}% answered</p>
          </PopCard>
        </div>

        <div className="mt-3">
          <Field k="Sessions completed" v={proMetrics.sessionsCompleted} />
          <Field k="Repeat clients" v={`${proMetrics.repeatClientPct}%`} />
          <Field k="Rating" v={proMetrics.ratingAvg} />
        </div>

        <p className="mt-4 caps-sm t-faint">Median reply, last 7 days · minutes</p>
        <Bars data={replySeries} />
        <p className="mt-3 text-meta t-faint">
          {missed} requests went unanswered. Each one was a session someone booked
          elsewhere.
        </p>
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

function Settings() {
  const { showToast } = useStore()

  return (
    <>
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Practice</Kicker>
        <div className="mt-2">
          <Row
            onClick={() => showToast('Pricing — prototype only')}
            title="Session pricing"
            note={`From ₹${pro.price.toLocaleString('en-IN')} · ${pro.slots.join(' · ')}`}
          />
          <Row to="/pro/consult" title="Availability" note="Which slots you are open for" />
          <Row
            onClick={() => showToast('Languages — prototype only')}
            title="Languages"
            note={pro.languages.join(' · ')}
          />
          <Row
            onClick={() => showToast('Payout settings — prototype only')}
            title="Payout account"
            note="HDFC ••4412"
          />
        </div>
      </section>

      <section className="px-5 py-6">
        <Kicker>Account</Kicker>
        <div className="mt-2">
          {/* Switching sides is a plain link — the URL is what decides which
              app you are in, so there is no state to flip. */}
          <Row to="/home" title="Switch to seeking" note="Browse Veda as a client" />
          <Row onClick={() => showToast('Help — prototype only')} title="Help & support" />
        </div>
        <p className="mt-6 text-meta t-faint">
          Prototype. Nothing here is saved and no session is really booked.
        </p>
      </section>
    </>
  )
}
