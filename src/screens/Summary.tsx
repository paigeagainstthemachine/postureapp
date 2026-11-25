import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, useSettings, type SetLog } from '../db'
import { exercises, phaseLabel } from '../data'
import { addDays, counted, dateKey, dayPlan, fromKey, shortDate } from '../lib/plan'
import { PainChart } from '../components/PainChart'
import { href } from '../router'

const RANGES = [4, 6, 8]

function longDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
const fmt = (n: number | undefined) => (n === undefined ? '' : n.toFixed(1))

/**
 * One printable page for a physical therapist. Facts only: what was logged,
 * counted and averaged. No interpretation.
 */
export function Summary() {
  const settings = useSettings()
  const [weeks, setWeeks] = useState(8)
  const logs = useLiveQuery(() => db.setLogs.toArray()) ?? []
  const checkIns = useLiveQuery(() => db.checkIns.toArray()) ?? []
  const lightDays = new Set((useLiveQuery(() => db.days.toArray()) ?? []).filter((d) => d.light).map((d) => d.date))

  const end = new Date()
  const start = addDays(end, -(weeks * 7 - 1))
  const startKey = dateKey(start)
  const endKey = dateKey(end)
  const inRange = <T extends { date: string }>(xs: T[]) => xs.filter((x) => x.date >= startKey && x.date <= endKey)
  const ci = inRange(checkIns).sort((a, b) => a.date.localeCompare(b.date))
  const lg = inRange(logs).filter((l) => !l.skipped)

  // Rolling 7-day blocks, oldest first.
  const blocks = Array.from({ length: weeks }, (_, i) => {
    const from = addDays(start, i * 7)
    const to = addDays(from, 6)
    const fk = dateKey(from)
    const tk = dateKey(to)
    const c = ci.filter((x) => x.date >= fk && x.date <= tk)
    const l = lg.filter((x) => x.date >= fk && x.date <= tk)
    const days = Array.from({ length: 7 }, (_, d) => addDays(from, d)).filter((d) => dateKey(d) <= endKey)
    const planned = days.filter((d) => !lightDays.has(dateKey(d)) && counted(dayPlan(settings.phase, d).items).length > 0).length
    const active = new Set(l.filter((x) => x.source !== 'quick').map((x) => x.date)).size
    return {
      from,
      to,
      checkIns: c.length,
      painAvg: avg(c.map((x) => x.painRightNeckShoulder)),
      painMax: c.length ? Math.max(...c.map((x) => x.painRightNeckShoulder)) : undefined,
      headache: c.filter((x) => x.headache !== 'none').length,
      headacheBad: c.filter((x) => x.headache === 'bad').length,
      arm: c.filter((x) => x.armFatigueOrTingling).length,
      active,
      planned,
      light: days.filter((d) => lightDays.has(dateKey(d))).length,
      chinExtra: new Set(l.filter((x) => x.source === 'quick').map((x) => x.sessionId)).size,
    }
  })

  const headacheDates = ci.filter((x) => x.headache !== 'none')
  const armDates = ci.filter((x) => x.armFatigueOrTingling)

  const byExercise = exercises
    .map((ex) => {
      const mine = lg.filter((l: SetLog) => l.exerciseId === ex.id && l.source !== 'quick')
      const sorted = [...mine].sort((a, b) => a.at - b.at)
      const last = sorted[sorted.length - 1]
      const efforts = mine.filter((m) => m.effort)
      return {
        ex,
        days: new Set(mine.map((m) => m.date)).size,
        sets: mine.length,
        lastLoad: [...sorted].reverse().find((m) => m.load && m.load !== 'none')?.load,
        lastDate: last?.date,
        hard: efforts.filter((m) => m.effort === 'hard').length,
        rated: efforts.length,
      }
    })
    .filter((r) => r.sets > 0)

  return (
    <article className="summary">
      <div className="no-print">
        <a className="back" href={href({ name: 'progress' })}>Progress</a>
        <div className="choice-row summary-range" role="radiogroup" aria-label="Weeks to include">
          {RANGES.map((w) => (
            <button key={w} className="choice mono" role="radio" aria-checked={weeks === w} onClick={() => setWeeks(w)}>
              {w} weeks
            </button>
          ))}
        </div>
      </div>

      <header className="summary-head">
        <p className="label">Posture plan summary</p>
        <h1>Summary for physical therapy</h1>
        <p className="mono">
          {longDate(start)} to {longDate(end)} · {weeks} weeks
        </p>
        <p className="mono">
          {phaseLabel[settings.phase]}
          {settings.phase2StartDate ? ` · Phase 2 started ${longDate(fromKey(settings.phase2StartDate))}` : ''}
        </p>
        <p className="muted small">
          Self-reported daily check-ins and logged exercise from my phone. {ci.length} check-ins in this period.
        </p>
      </header>

      <section>
        <h2>Symptoms worth mentioning</h2>
        <ul className="plain-list summary-flags">
          <li>
            <strong>Right arm fatigue or tingling:</strong> {armDates.length} {armDates.length === 1 ? 'day' : 'days'}
            {armDates.length > 0 && <span className="mono"> ({armDates.map((c) => shortDate(fromKey(c.date))).join(', ')})</span>}
          </li>
          <li>
            <strong>Headaches:</strong> {headacheDates.length} {headacheDates.length === 1 ? 'day' : 'days'}
            {headacheDates.length > 0 && (
              <>
                , {headacheDates.filter((c) => c.headache === 'bad').length} rated bad
                <span className="mono"> ({headacheDates.map((c) => `${shortDate(fromKey(c.date))}${c.headache === 'bad' ? '*' : ''}`).join(', ')})</span>
              </>
            )}
          </li>
          <li>
            <strong>Right neck and shoulder pain:</strong>{' '}
            {ci.length ? `average ${fmt(avg(ci.map((c) => c.painRightNeckShoulder)))} out of 10, highest ${Math.max(...ci.map((c) => c.painRightNeckShoulder))}` : 'no check-ins'}
          </li>
        </ul>
        {headacheDates.some((c) => c.headache === 'bad') && <p className="muted small">* rated bad</p>}
      </section>

      <section>
        <h2>Pain trend</h2>
        {ci.length >= 2 ? (
          <PainChart checkIns={ci} end={end} days={weeks * 7} />
        ) : (
          <p className="muted">Not enough check-ins for a trend yet.</p>
        )}
      </section>

      <section>
        <h2>Week by week</h2>
        <table className="data-table mono summary-table">
          <thead>
            <tr>
              <th scope="col">Week of</th>
              <th scope="col">Pain avg</th>
              <th scope="col">Max</th>
              <th scope="col">Headache</th>
              <th scope="col">Arm</th>
              <th scope="col">Exercise days</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.from.getTime()}>
                <td>{shortDate(b.from)}</td>
                <td>{fmt(b.painAvg)}</td>
                <td>{b.painMax ?? ''}</td>
                <td>{b.headache}{b.headacheBad ? ` (${b.headacheBad} bad)` : ''}</td>
                <td>{b.arm}</td>
                <td>
                  {b.active}/{b.planned}
                  {b.light ? ` · ${b.light} rest` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Pain is 0 to 10. Headache and arm columns count days. Exercise days: days with logged exercise out of planned days.</p>
      </section>

      <section>
        <h2>Exercises</h2>
        {byExercise.length === 0 ? (
          <p className="muted">No exercise logged in this period.</p>
        ) : (
          <table className="data-table summary-table">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Days</th>
                <th scope="col">Sets</th>
                <th scope="col">Last load</th>
                <th scope="col">Rated hard</th>
              </tr>
            </thead>
            <tbody>
              {byExercise.map((r) => (
                <tr key={r.ex.id}>
                  <td>{r.ex.name}</td>
                  <td className="mono">{r.days}</td>
                  <td className="mono">{r.sets}</td>
                  <td className="mono">{r.lastLoad ?? ''}</td>
                  <td className="mono">{r.rated ? `${r.hard}/${r.rated} sets` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="bottom-action no-print">
        <button className="btn-primary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
    </article>
  )
}
