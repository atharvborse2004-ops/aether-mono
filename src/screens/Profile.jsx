import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { days, sessionHistory, user, walletTransactions } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import ChartWheel from '../components/ChartWheel.jsx'
import { Kicker, PopAvatar, PopBar, PopButton, PopCard, PopTag, Stat } from '../components/Pop.jsx'
import { Acts, Row, Segmented, Ticks } from '../components/Primitives.jsx'
import { useStore } from '../store.jsx'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'horoscope', label: 'Horoscope' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'settings', label: 'Settings' },
]

const SETTINGS = [
  { key: 'Language', value: 'English' },
  { key: 'Notifications', value: 'Daily at 08:00' },
  { key: 'Privacy & data', value: 'On device' },
  { key: 'Help & support', value: null },
]

/**
 * Profile.
 *
 * Horoscope is a tab in here rather than a separate page — the tab bar spends
 * its five slots on Home / Consult / Live / Academy / Shop, and the daily
 * reading belongs to the person, not to a destination. The URL still carries
 * the tab (`/profile/horoscope`) so it stays deep-linkable and the header
 * shortcut on Home can land straight on it.
 */
export default function Profile() {
  const { tab = 'overview' } = useParams()
  const navigate = useNavigate()

  if (!TABS.some((t) => t.key === tab)) return <Navigate to="/profile" replace />

  return (
    <>
      {/* hardBack: from Profile, "back" means Home — never an arbitrary
          previous screen. */}
      <TopBar title="Profile" back backTo="/home" hardBack />

      <section className="flex items-center gap-4 border-b border-stroke px-5 py-6">
        <PopAvatar initials={user.initials} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-title leading-none t-heading">{user.name}</h1>
          <p className="mt-2 caps-sm t-faint">
            {user.sunSign} · {user.moonSign} · {user.risingSign}
          </p>
        </div>
        <PopTag tone="gold">Member</PopTag>
      </section>

      <Segmented
        items={TABS}
        value={tab}
        onChange={(k) => navigate(k === 'overview' ? '/profile' : `/profile/${k}`)}
      />

      <div key={tab} className="animate-fade">
        {tab === 'overview' && <Overview />}
        {tab === 'horoscope' && <HoroscopeTab />}
        {tab === 'wallet' && <WalletTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>

      <div className="h-24" />
    </>
  )
}

/* ── Overview ────────────────────────────────────────────────────────────── */

function Overview() {
  const { showToast, questionsLeft, cartCount } = useStore()

  return (
    <>
      <section className="border-b border-rule px-5 py-6 text-center">
        <ChartWheel size={200} />
        <div className="mt-6 flex gap-3">
          <PopButton onClick={() => showToast('Kundli PDF downloaded')}>Download</PopButton>
          <PopButton onClick={() => showToast('Chart link copied')}>Share</PopButton>
        </div>
      </section>

      <section className="border-b border-rule px-5 py-6">
        <Kicker>Birth data</Kicker>
        <dl className="mt-4">
          {[
            ['Date', user.birthDate],
            ['Time', user.birthTime],
            ['Place', user.birthPlace],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-6 border-b border-rule py-3">
              <dt className="caps-sm t-faint">{k}</dt>
              <dd className="text-meta tnum t-heading">{v}</dd>
            </div>
          ))}
        </dl>
        <PopButton to="/onboarding/date" className="mt-5">
          Edit birth details
        </PopButton>
      </section>

      <section className="border-b border-rule px-5 py-6">
        <Kicker>Everything else</Kicker>
        <div className="mt-2">
          <Row to="/chart" title="Your full chart" note="Eight placements, plainly written" />
          <Row to="/people" title="People" note="Charts you have read against yours" />
          <Row to="/reports" title="Reports" note="Long-form readings, written once" />
          <Row to="/wallet" title="Wallet" note="Balance, top-up and history" />
          <Row to="/premium" title="Premium" note="Eros, packs and more questions" />
          <Row to="/academy" title="Academy" note="Courses, events and downloads" />
          <Row to="/ask" title="Ask the Stars" meta={`${questionsLeft} left`} />
          <Row to="/shop" title="Shop" meta={`${cartCount} in cart`} />
        </div>
      </section>

      <section className="px-5 py-6">
        <Kicker action="All" onAction={() => showToast('Full history — prototype only')}>
          Past sessions
        </Kicker>
        <ul className="mt-4">
          {sessionHistory.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => showToast(`Receipt · ${s.consultant}`)}
                className="flex w-full items-center gap-3 border-b border-rule py-3.5 text-left transition-opacity hover:opacity-70"
              >
                <PopAvatar initials={s.initials} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-meta t-heading">{s.consultant}</span>
                  <span className="mt-1 block caps-sm t-faint tnum">
                    {s.type} · {s.date}
                  </span>
                </span>
                <span className="flex-none text-right">
                  <span className="block text-meta tnum t-sub">
                    {s.amount ? `₹${s.amount.toLocaleString('en-IN')}` : '—'}
                  </span>
                  <span
                    className={`block caps-sm ${s.status === 'Completed' ? 'text-ok' : 'text-live'}`}
                  >
                    {s.status}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

/* ── Horoscope tab ───────────────────────────────────────────────────────── */

/**
 * The daily reading, as a tab. Summary cards, the three placements, the
 * current transit and a short reading — the compact version. The full
 * three-day view with Do/Don't and transits lives on `/horoscope`.
 */
function HoroscopeTab() {
  const { showToast, hasFlag, toggleFlag } = useStore()
  const day = days.today
  const transit = day.transits[0]

  return (
    <>
      {/* Summary cards */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker action="Full reading" to="/horoscope">
          Today
        </Kicker>

        <PopCard raised className="mt-4 p-5">
          <p className="caps-sm gold">{day.date}</p>
          <h2 className="mt-3 font-display text-title leading-tight t-heading">{day.headline}</h2>

          <dl className="mt-5 grid grid-cols-3 border-y border-stroke py-4">
            {[
              ['Mood', day.mood],
              ['Colour', day.luckyColour],
              ['Number', day.luckyNumber],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="caps-sm t-faint">{k}</dt>
                <dd className="mt-1 text-meta tnum t-heading">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="caps-sm t-faint">Day intensity</span>
              <span className="caps-sm gold tnum">{day.intensity}%</span>
            </div>
            <PopBar value={day.intensity} />
            <p className="mt-2 text-meta t-faint">
              How much the sky is asking of you, relative to your own average.
            </p>
          </div>
        </PopCard>
      </section>

      {/* Sun / Moon / Rising */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker action="Full chart" to="/chart">
          Your placements
        </Kicker>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['Sun', user.sunSign, 'how you push'],
            ['Moon', user.moonSign, 'how you feel'],
            ['Rising', user.risingSign, 'how you land'],
          ].map(([label, sign, note]) => (
            <PopCard key={label} className="p-3">
              <p className="caps-sm gold">{label}</p>
              <p className="mt-2 text-body t-heading">{sign}</p>
              <p className="mt-1 caps-sm t-faint">{note}</p>
            </PopCard>
          ))}
        </div>
      </section>

      {/* Current transit */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Current transit</Kicker>
        <PopCard className="mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-body t-heading">{transit.title}</p>
            <PopTag tone="gold">{transit.weight}</PopTag>
          </div>
          <p className="mt-2 caps-sm t-faint tnum">{transit.window}</p>
          <p className="mt-3 text-meta t-body">{transit.body}</p>
        </PopCard>
      </section>

      {/* Daily reading */}
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Daily reading</Kicker>
        <p className="mt-4 text-read t-sub">{day.body}</p>

        <PopCard className="mt-5 p-4">
          <p className="caps-sm gold">{day.focusLabel}</p>
          <p className="mt-2 text-body t-heading">{day.focus}</p>
        </PopCard>

        <Acts
          className="mt-5"
          items={[
            {
              label: 'Save',
              onLabel: 'Saved',
              on: hasFlag('save:day-today'),
              onClick: () =>
                toggleFlag('save:day-today', {
                  on: 'Saved to your readings',
                  off: 'Removed from your readings',
                }),
            },
            { label: 'Share', onClick: () => showToast('Reading copied') },
          ]}
        />
      </section>

      {/* Ratings */}
      <section className="px-5 py-6">
        <Kicker>Across four areas</Kicker>
        <ul className="mt-4">
          {Object.entries(day.ratings).map(([area, value]) => (
            <li key={area} className="flex items-center gap-4 border-b border-rule py-3.5">
              <span className="w-16 flex-none caps-sm t-faint">{area}</span>
              <Ticks value={value} className="flex-1" />
              <span className="w-8 flex-none text-right caps-sm tnum t-sub">{value}/5</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

/* ── Wallet tab ──────────────────────────────────────────────────────────── */

/** A compact wallet summary. The full screen lives at `/profile/wallet`. */
function WalletTab() {
  const { balance, ledger, questionsLeft } = useStore()
  const rows = [...ledger, ...walletTransactions].slice(0, 5)

  return (
    <>
      <section className="border-b border-rule px-5 py-6">
        <PopCard raised className="p-5">
          <p className="caps-sm t-faint">Available balance</p>
          <p className="mt-2 font-display text-display leading-none tnum t-heading">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <div className="mt-6 flex gap-3">
            <PopButton size="sm" to="/wallet" variant="gold">
              Add money
            </PopButton>
            <PopButton to="/wallet">Open wallet</PopButton>
          </div>
        </PopCard>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <PopCard className="p-4">
            <Stat label="Questions left" value={questionsLeft} />
          </PopCard>
          <PopCard className="p-4">
            <Stat label="Sessions" value={sessionHistory.length} sub="all time" />
          </PopCard>
        </div>
      </section>

      <section className="px-5 py-6">
        <Kicker action="All" to="/wallet">
          Recent
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
    </>
  )
}

/* ── Settings tab ────────────────────────────────────────────────────────── */

function SettingsTab() {
  const { showToast } = useStore()

  return (
    <>
      <section className="border-b border-rule px-5 py-6">
        <Kicker>Consulting</Kicker>
        <div className="mt-2">
          {/* Plain navigation — the URL is what decides which side you are on,
              so there is no role to toggle. */}
          <Row
            to="/pro/feed"
            title="Switch to consultant"
            note="Your sessions, your earnings, your page"
          />
        </div>
      </section>

      <section className="border-b border-rule px-5 py-6">
        <Kicker>Preferences</Kicker>
        <div className="mt-2">
          {SETTINGS.map((s) => (
            <Row
              key={s.key}
              onClick={() => showToast(`${s.key} — prototype only`)}
              title={s.key}
              meta={s.value}
            />
          ))}
        </div>
      </section>

      <section className="px-5 py-6">
        <Kicker>About</Kicker>
        <p className="mt-4 text-meta t-body">
          Veda. A front-end layout prototype — no backend, no auth, no network calls. Every value
          on screen comes from one hardcoded file, and nothing survives a reload.
        </p>
        <PopButton to="/onboarding" className="mt-5">
          Run onboarding again
        </PopButton>
        <Link to="/notifications" className="mt-4 block text-center caps-sm t-faint">
          Notification history
        </Link>
      </section>
    </>
  )
}
