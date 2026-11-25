import type { SetLog } from '../db'
import { Check } from './Check'
import { getExercise, phase2, allowedInPhase, type Exercise } from '../data'
import { addDays, dateKey, fromKey, strengthOnlyIds } from '../lib/plan'

const WEEKS = 8
const STRENGTH_DAYS_PER_WEEK = 3

/**
 * Mirrors the Phase 2 PDF checklist: one box per exercise per week, and a week
 * box that completes when 3 strength days are done that week.
 */
export function EightWeekGrid({ logs, startKey, currentWeek }: { logs: SetLog[]; startKey: string; currentWeek: number }) {
  const start = fromKey(startKey)
  const rows = phase2.strength_day
    .map(getExercise)
    .filter((e): e is Exercise => Boolean(e) && allowedInPhase(e!, 'phase2'))
  const strengthOnly = strengthOnlyIds()

  const weeks = Array.from({ length: WEEKS }, (_, w) => {
    const from = dateKey(addDays(start, w * 7))
    const to = dateKey(addDays(start, w * 7 + 6))
    const inWeek = logs.filter((l) => !l.skipped && l.date >= from && l.date <= to)
    const exDone = new Set(inWeek.map((l) => l.exerciseId))
    const strengthDays = new Set(inWeek.filter((l) => strengthOnly.has(l.exerciseId)).map((l) => l.date)).size
    return { exDone, strengthDays, complete: strengthDays >= STRENGTH_DAYS_PER_WEEK }
  })

  return (
    <div className="grid8-wrap">
      <table className="grid8">
        <caption className="sr-only">Phase 2 strength checklist, weeks 1 to 8</caption>
        <thead>
          <tr>
            <th scope="col" className="grid8-name">
              <span className="sr-only">Exercise</span>
            </th>
            {weeks.map((_, w) => (
              <th key={w} scope="col" className={w + 1 === currentWeek ? 'is-now' : undefined}>
                {w + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ex) => (
            <tr key={ex.id}>
              <th scope="row" className="grid8-name">{ex.name}</th>
              {weeks.map((wk, w) => (
                <td key={w}>
                  <span className={wk.exDone.has(ex.id) ? 'g-box on' : 'g-box'} aria-label={wk.exDone.has(ex.id) ? 'done' : 'not yet'}>
                    {wk.exDone.has(ex.id) ? <Check /> : null}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr className="grid8-total">
            <th scope="row" className="grid8-name">Week (3 strength days)</th>
            {weeks.map((wk, w) => (
              <td key={w}>
                <span
                  className={wk.complete ? 'g-box big on' : 'g-box big'}
                  aria-label={`${wk.strengthDays} of 3 strength days`}
                >
                  {wk.complete ? <Check /> : wk.strengthDays || ''}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
