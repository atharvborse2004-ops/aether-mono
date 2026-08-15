import { useState } from 'react'
import { Link } from 'react-router-dom'
import { chartHouses, placements, user } from '../data/mock.js'
import { TopBar } from '../components/Chrome.jsx'
import ChartWheel from '../components/ChartWheel.jsx'
import { ChartNorth, ChartSouth } from '../components/ChartSquare.jsx'
import { useStore } from '../store.jsx'
import { Field, Section, Segmented, Stub } from '../components/Primitives.jsx'

const SYSTEMS = ['vedic', 'south', 'western']
const NOTE = { vedic: 'northNote', south: 'southNote', western: 'westernNote' }

/**
 * Table view is the default, not the diagram.
 *
 * A wheel is beautiful and illegible to anyone who has not been taught to read
 * one. The table carries the same data in a form you can scan, and the wheel is
 * one tap away for people who want it. Every row drills into a placement page.
 */
export default function Chart() {
  const [view, setView] = useState('table')
  const { chartSystem, setChartSystem, t } = useStore()

  return (
    <>
      <TopBar title="Your chart" sub={`${user.birthDate} · ${user.birthTime}`} />
      {/* Two switches, not one four-way. The first is *what you are looking
          at* — the numbers or the diagram — and the second is *which
          tradition's diagram*. Folding them together would put "Table" beside
          "South Indian" as though they were the same kind of choice. */}
      <Segmented
        items={[
          { key: 'table', label: t('chart.table') },
          { key: 'chart', label: t(`chart.${chartSystem}`) },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'table' ? (
        <div key="table" className="animate-fade">
          <Section label="Placements">
            {/* Column headers, so the four numbers are not a guessing game. */}
            <div className="grid grid-cols-[2.5rem_1fr_4.5rem_2rem] items-baseline gap-3 border-b border-rule pb-2">
              <span className="label text-left">Body</span>
              <span className="label text-left">Sign</span>
              <span className="label text-left">Degree</span>
              <span className="label text-left">Hs</span>
            </div>

            <ul>
              {placements.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/chart/${p.id}`}
                    className="grid grid-cols-[2.5rem_1fr_4.5rem_2rem] items-baseline gap-3 border-b border-rule py-4 transition-opacity hover:opacity-60"
                  >
                    <span className="text-body text-t2">{p.glyph}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-body text-t1">
                        {p.body} in {p.sign}
                      </span>
                      <span className="mt-1 block text-meta text-t3">{p.line}</span>
                    </span>
                    <span className="text-meta text-t2 tnum">{p.degree}</span>
                    <span className="text-meta text-t2 tnum">{p.house}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-meta text-t3">
              Tap any row for the long version.
            </p>
          </Section>

          <Section label="Houses" last>
            <ul className="grid grid-cols-2 gap-x-6">
              {chartHouses.map((h) => (
                <li
                  key={h.house}
                  className="flex items-baseline justify-between gap-3 border-b border-rule py-3"
                >
                  <span className="text-meta text-t3 tnum">{h.house}</span>
                  <span className="flex-1 text-meta text-t2">{h.sign}</span>
                  <span className="text-meta text-t1 tnum">{h.planets.join(' ') || '—'}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : (
        <div key="chart" className="animate-fade">
          <Section label="Whole sign · Lahiri ayanamsa">
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
              {SYSTEMS.map((sys) => (
                <button
                  key={sys}
                  type="button"
                  aria-pressed={chartSystem === sys}
                  onClick={() => setChartSystem(sys)}
                  className="pill caps-sm flex-none"
                >
                  {t(`chart.${sys}`)}
                </button>
              ))}
            </div>

            {chartSystem === 'vedic' && <ChartNorth size={280} />}
            {chartSystem === 'south' && <ChartSouth size={280} />}
            {chartSystem === 'western' && <ChartWheel size={280} />}

            <Stub className="mt-8" />
            <p className="prose-c mt-8">{t(`chart.${NOTE[chartSystem]}`)}</p>
            {chartSystem === 'south' && (
              <p className="mt-3 text-meta text-t3">
                {t('chart.ascendant')} · {chartHouses.find((h) => h.house === 1).sign}
              </p>
            )}
          </Section>

          <Section label="Birth data" last>
            <Field k="Date" v={user.birthDate} />
            <Field k="Time" v={user.birthTime} />
            <Field k="Place" v={user.birthPlace} />
            <Field k="Source" v="NASA JPL" />
          </Section>
        </div>
      )}

      <div className="h-8" />
    </>
  )
}
