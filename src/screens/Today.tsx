import { db, useLogsForDate, useSettings, type SetLog } from '../db'
import { formatDose, getExercise, phase1, phaseLabel, type Exercise } from '../data'
import { dateKey, parseCount, planFor, sidesFor } from '../lib/plan'
import { href } from '../router'
import { unlockAudio } from '../lib/cues'
import { CheckInCard } from '../components/CheckInCard'

const QUICK_ID = 'chin_nod'

function dayLabel(d: Date) {
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${wd} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Done today = at least one set logged, from a session or a tick. */
function doneIds(logs: SetLog[]): Set<string> {
  return new Set(logs.filter((l) => !l.skipped && l.source !== 'quick').map((l) => l.exerciseId))
}

export function Today() {
  const now = new Date()
  const today = dateKey(now)
  const settings = useSettings()
  const logs = useLogsForDate(today)
  const plan = planFor(settings.phase, now)
  const done = doneIds(logs)
  const doneCount = plan.filter((e) => done.has(e.id)).length
  const allDone = plan.length > 0 && doneCount === plan.length

  const quickEx = getExercise(QUICK_ID)
  const quickTarget = settings.phase === 'phase1' ? phase1.extra_chin_nod_sessions_per_day : 0
  const quickDone = new Set(logs.filter((l) => l.source === 'quick').map((l) => l.sessionId)).size

  async function toggle(ex: Exercise) {
    const mine = logs.filter((l) => l.exerciseId === ex.id && l.source !== 'quick')
    if (mine.length === 0) {
      // Tick: log the prescribed dose as done.
      const rx = ex.rx[settings.phase]!
      const reps = parseCount(rx.reps).min
      const at = Date.now()
      const rows: Omit<SetLog, 'id'>[] = []
      for (let s = 0; s < rx.sets; s++) {
        for (const side of sidesFor(rx)) {
          rows.push({
            date: today,
            at,
            exerciseId: ex.id,
            setIndex: s,
            side,
            reps,
            holdSeconds: rx.hold_seconds,
            load: rx.load,
            skipped: false,
            source: 'tick',
          })
        }
      }
      await db.setLogs.bulkAdd(rows as SetLog[])
      return
    }
    const fromSession = mine.some((l) => l.source === 'player')
    if (fromSession && !confirm(`Remove today's logged sets for ${ex.name}?`)) return
    await db.setLogs.bulkDelete(mine.map((l) => l.id))
  }

  return (
    <div className="today">
      <header className="screen-head">
        <p className="label">
          <span>{dayLabel(now)}</span>
          <span>{phaseLabel[settings.phase]}</span>
        </p>
        <h1>Today</h1>
      </header>

      <div className="progress" aria-label={`${doneCount} of ${plan.length} done`}>
        <div className="progress-cells" aria-hidden="true">
          {plan.map((e) => (
            <span key={e.id} className={done.has(e.id) ? 'cell on' : 'cell'} />
          ))}
        </div>
        <span className="mono progress-count" aria-hidden="true">
          {String(doneCount).padStart(2, '0')}/{String(plan.length).padStart(2, '0')}
        </span>
      </div>

      <ul className="check-list">
        {plan.map((ex, i) => {
          const isDone = done.has(ex.id)
          return (
            <li key={ex.id} className={isDone ? 'check-row done' : 'check-row'}>
              <span className="row-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <a className="check-text" href={href({ name: 'exercise', id: ex.id })}>
                <span className="exercise-row-name">{ex.name}</span>
                <span className="exercise-row-dose">{formatDose({ ...ex.rx[settings.phase]!, times_per_day: undefined })}</span>
              </a>
              <button
                className="check-box"
                role="checkbox"
                aria-checked={isDone}
                aria-label={`${ex.name} done`}
                onClick={() => toggle(ex)}
              >
                {isDone ? '✓' : ''}
              </button>
            </li>
          )
        })}
      </ul>

      {allDone && <p className="all-done">All done for today. Nice work.</p>}

      <CheckInCard date={today} />

      {quickEx && quickTarget > 0 && (
        <div className="quick">
          <div>
            <p className="label">Extra chin nods</p>
            <p className="mono quick-count">
              {quickDone}
              <span className="muted">/{quickTarget}</span>
            </p>
          </div>
          <a className="btn-outline" href={href({ name: 'quick', id: QUICK_ID })} onClick={unlockAudio}>
            Start {quickEx.rx[settings.phase]!.reps} × {quickEx.rx[settings.phase]!.hold_seconds}s
          </a>
        </div>
      )}

      <div className="bottom-action">
        <a className="btn-primary" href={href({ name: 'session' })} onClick={unlockAudio}>
          {allDone ? 'Go again' : doneCount > 0 ? 'Continue session' : 'Start session'}
        </a>
      </div>
    </div>
  )
}
