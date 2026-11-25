import type { Progression } from '../lib/plan'

/** Phase 2: which week it is and what the progression table says to do. */
export function WeekCard({ p, extra }: { p: Progression; extra?: string }) {
  return (
    <section className="week-card" aria-label={`Phase 2 week ${p.week}`}>
      <p className="label">
        <span>Week {String(p.week).padStart(2, '0')}</span>
        <span>Weeks {p.weeks}</span>
      </p>
      {p.stepUp && <p className="side">Step up this week</p>}
      <p className="week-card-text">{p.change}</p>
      {extra && <p className="muted small">{extra}</p>}
    </section>
  )
}
