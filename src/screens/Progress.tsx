import { useLiveQuery } from 'dexie-react-hooks'
import { db, useSettings, type SetLog } from '../db'
import { exercises, getExercise } from '../data'
import { addDays, dateKey, fromKey, planFor, shortDate, weekStart } from '../lib/plan'
import { PainChart } from '../components/PainChart'

const TREND_DAYS = 56
const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const pad2 = (n: number) => String(n).padStart(2, '0')

function doneOn(logs: SetLog[], key: string): Set<string> {
  return new Set(logs.filter((l) => l.date === key && !l.skipped && l.source !== 'quick').map((l) => l.exerciseId))
}

export function Progress() {
  const settings = useSettings()
  const logs = useLiveQuery(() => db.setLogs.toArray()) ?? []
  const checkIns = useLiveQuery(() => db.checkIns.toArray()) ?? []
  const now = new Date()
  const todayKey = dateKey(now)

  // ----- This week -----
  const monday = weekStart(now)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    const key = dateKey(d)
    const plan = planFor(settings.phase, d)
    const done = doneOn(logs, key)
    return {
      key,
      d,
      planned: plan.length,
      done: plan.filter((e) => done.has(e.id)).length,
      future: key > todayKey,
    }
  })
  const activeDays = week.filter((w) => w.done > 0).length
  const weekKeys = new Set(week.map((w) => w.key))
  const quickThisWeek = new Set(logs.filter((l) => l.source === 'quick' && weekKeys.has(l.date)).map((l) => l.sessionId)).size

  // ----- Symptoms over the trend window -----
  const startKey = dateKey(addDays(now, -(TREND_DAYS - 1)))
  const recent = checkIns.filter((c) => c.date >= startKey).sort((a, b) => a.date.localeCompare(b.date))
  const headacheDays = recent.filter((c) => c.headache !== 'none').length
  const armDays = recent.filter((c) => c.armFatigueOrTingling).length

  // ----- Exercise history -----
  const byExercise = exercises
    .map((ex) => {
      const mine = logs.filter((l) => l.exerciseId === ex.id && !l.skipped)
      const dates = [...new Set(mine.map((l) => l.date))].sort().reverse()
      return { ex, mine, dates }
    })
    .filter((g) => g.dates.length > 0)

  return (
    <>
      <header className="screen-head">
        <p className="label">
          <span>Week of {shortDate(monday)}</span>
          <span>Last {TREND_DAYS / 7} weeks</span>
        </p>
        <h1>Progress</h1>
      </header>

      <section aria-labelledby="week-h">
        <h2 id="week-h">This week</h2>
        <div className="week">
          {week.map((w, i) => {
            const frac = w.planned ? w.done / w.planned : 0
            return (
              <div key={w.key} className={w.key === todayKey ? 'week-day is-today' : 'week-day'}>
                <span className="label">{dayLetters[i]}</span>
                <span className={w.future ? 'week-cell future' : 'week-cell'} aria-hidden="true">
                  <span className="week-fill" style={{ height: `${frac * 100}%` }} />
                </span>
                <span className="mono week-count">
                  {w.future ? '' : `${w.done}/${w.planned}`}
                </span>
                <span className="sr-only">
                  {w.d.toLocaleDateString('en-US', { weekday: 'long' })}: {w.future ? 'coming up' : `${w.done} of ${w.planned} done`}
                </span>
              </div>
            )
          })}
        </div>
        <div className="stats">
          <div className="stat">
            <span className="label">Days moving</span>
            <span className="mono stat-n">{pad2(activeDays)}</span>
          </div>
          <div className="stat">
            <span className="label">Extra chin nods</span>
            <span className="mono stat-n">{pad2(quickThisWeek)}</span>
          </div>
        </div>
        {activeDays > 0 && <p className="muted">Every day you show up counts.</p>}
      </section>

      <section aria-labelledby="pain-h">
        <h2 id="pain-h">Right neck and shoulder pain</h2>
        {recent.length >= 2 ? (
          <PainChart checkIns={recent} end={now} days={TREND_DAYS} />
        ) : (
          <p className="muted">Your pain trend shows up here after a few daily check-ins on Today.</p>
        )}
        <div className="stats">
          <div className="stat">
            <span className="label">Headache days</span>
            <span className="mono stat-n">{pad2(headacheDays)}</span>
          </div>
          <div className="stat">
            <span className="label">Arm symptom days</span>
            <span className="mono stat-n">{pad2(armDays)}</span>
          </div>
        </div>

        {recent.length > 0 && (
          <details className="disclosure">
            <summary>Check-ins as a table</summary>
            <table className="data-table mono">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Pain</th>
                  <th scope="col">Head</th>
                  <th scope="col">Arm</th>
                </tr>
              </thead>
              <tbody>
                {[...recent].reverse().map((c) => (
                  <tr key={c.date}>
                    <td>{shortDate(fromKey(c.date))}</td>
                    <td>{c.painRightNeckShoulder}</td>
                    <td>{c.headache}</td>
                    <td>{c.armFatigueOrTingling ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </section>

      <section aria-labelledby="hist-h">
        <h2 id="hist-h">Exercise history</h2>
        {byExercise.length === 0 && <p className="muted">Sets you log in a session show up here.</p>}
        <ul className="history">
          {byExercise.map(({ ex, mine, dates }) => (
            <li key={ex.id}>
              <details className="disclosure">
                <summary>
                  <span className="exercise-row-name">{getExercise(ex.id)?.name}</span>
                  <span className="exercise-row-dose">Last {shortDate(fromKey(dates[0]))}</span>
                </summary>
                <table className="data-table mono">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Reps</th>
                      <th scope="col">Load</th>
                      <th scope="col">Feel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dates.slice(0, 12).map((date) => {
                      const sets = mine.filter((l) => l.date === date).sort((a, b) => a.setIndex - b.setIndex)
                      const ticked = sets.every((s) => s.source === 'tick')
                      const timed = sets.some((s) => s.reps === 0 && s.holdSeconds)
                      return (
                        <tr key={date}>
                          <td>{shortDate(fromKey(date))}</td>
                          <td>{timed ? sets.map((s) => `${s.holdSeconds}s`).join(' ') : sets.map((s) => s.reps).join(' ')}</td>
                          <td>{sets[sets.length - 1].load ?? ''}</td>
                          <td>{ticked ? 'ticked' : sets.map((s) => s.effort?.[0] ?? '').join(' ')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </details>
            </li>
          ))}
        </ul>
        {byExercise.length > 0 && <p className="label">Feel: e easy, r just right, h hard</p>}
      </section>
    </>
  )
}
