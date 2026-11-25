import { db, useLogsForDate, useSettings, type SetLog } from '../db'
import { formatDose, getExercise, phase1, phaseLabel, type Exercise } from '../data'
import {
  counted,
  dateKey,
  dayPlan,
  effectiveRx,
  parseCount,
  progressionOn,
  sidesFor,
  WALK_ID,
  type DayType,
  type PlanItem,
} from '../lib/plan'
import { href } from '../router'
import { unlockAudio } from '../lib/cues'
import { CheckInCard } from '../components/CheckInCard'
import { WeekCard } from '../components/WeekCard'

const QUICK_ID = 'chin_nod'

const dayTypeLabel: Record<DayType, string> = {
  daily: 'Daily block',
  strength: 'Strength day',
  walk: 'Walk day',
  optional_walk: 'Optional walk',
  rest: 'Rest day',
}

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
  const progression = progressionOn(settings.phase, settings.phase2StartDate, now)
  const plan = dayPlan(settings.phase, now)
  const target = counted(plan.items)
  const done = doneIds(logs)
  const doneCount = target.filter((i) => done.has(i.id)).length
  const allDone = target.length > 0 && doneCount === target.length
  const hasExercises = plan.items.some((i) => i.kind === 'exercise')

  const quickEx = getExercise(QUICK_ID)
  const quickTarget = settings.phase === 'phase1' ? phase1.extra_chin_nod_sessions_per_day : 0
  const quickDone = new Set(logs.filter((l) => l.source === 'quick').map((l) => l.sessionId)).size

  async function tickExercise(ex: Exercise) {
    const rx = effectiveRx(ex, settings.phase, progression)!
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
  }

  async function toggle(item: PlanItem) {
    const mine = logs.filter((l) => l.exerciseId === item.id && l.source !== 'quick')
    if (mine.length === 0) {
      if (item.kind === 'exercise') await tickExercise(item.ex)
      else
        await db.setLogs.add({
          date: today,
          at: Date.now(),
          exerciseId: WALK_ID,
          setIndex: 0,
          reps: 0,
          skipped: false,
          source: 'tick',
        } as SetLog)
      return
    }
    const fromSession = mine.some((l) => l.source === 'player')
    const name = item.kind === 'exercise' ? item.ex.name : 'the walk'
    if (fromSession && !confirm(`Remove today's logged sets for ${name}?`)) return
    await db.setLogs.bulkDelete(mine.map((l) => l.id))
  }

  return (
    <div className="today">
      <header className="screen-head">
        <p className="label">
          <span>{dayLabel(now)}</span>
          <a className="label-link" href={href({ name: 'settings' })} aria-label={`${phaseLabel[settings.phase]}. Plan settings`}>
            {phaseLabel[settings.phase]}
          </a>
        </p>
        <h1>Today</h1>
        {settings.phase === 'phase2' && <p className="label">{dayTypeLabel[plan.type]}</p>}
      </header>

      {progression && <WeekCard p={progression} />}

      {target.length > 0 && (
        <div className="progress" aria-label={`${doneCount} of ${target.length} done`}>
          <div className="progress-cells" aria-hidden="true">
            {target.map((i) => (
              <span key={i.id} className={done.has(i.id) ? 'cell on' : 'cell'} />
            ))}
          </div>
          <span className="mono progress-count" aria-hidden="true">
            {String(doneCount).padStart(2, '0')}/{String(target.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {plan.warmup && <p className="warmup"><span className="label">Warm-up</span> {plan.warmup}</p>}

      <ul className="check-list">
        {plan.items.map((item, i) => {
          const isDone = done.has(item.id)
          const name = item.kind === 'exercise' ? item.ex.name : item.optional ? 'Walk, if you feel like it' : 'Easy walk'
          const rx = item.kind === 'exercise' ? effectiveRx(item.ex, settings.phase, progression) : undefined
          const detail = rx
            ? formatDose({ ...rx, times_per_day: undefined })
            : item.kind === 'walk' && item.minutes
              ? `${item.minutes} min`
              : ''
          const body = (
            <>
              <span className="exercise-row-name">{name}</span>
              {detail && <span className="exercise-row-dose">{detail}</span>}
            </>
          )
          return (
            <li key={item.id} className={isDone ? 'check-row done' : 'check-row'}>
              <span className="row-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item.kind === 'exercise' ? (
                <a className="check-text" href={href({ name: 'exercise', id: item.id })}>{body}</a>
              ) : (
                <span className="check-text">{body}</span>
              )}
              <button
                className="check-box"
                role="checkbox"
                aria-checked={isDone}
                aria-label={`${name} done`}
                onClick={() => toggle(item)}
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

      {hasExercises && (
        <div className="bottom-action">
          <a className="btn-primary" href={href({ name: 'session' })} onClick={unlockAudio}>
            {allDone ? 'Go again' : doneCount > 0 ? 'Continue session' : 'Start session'}
          </a>
        </div>
      )}
    </div>
  )
}
