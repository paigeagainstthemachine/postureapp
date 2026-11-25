import { useState } from 'react'
import { exercises, formatDose, phase1, phasesUsing, allowedInPhase, phaseLabel, type PhaseId } from '../data'
import { href } from '../router'
import { Figure } from '../components/Figure'

type Filter = 'all' | PhaseId

const filters: { id: Filter; label: string }[] = [
  { id: 'phase1', label: 'Phase 1' },
  { id: 'phase2', label: 'Phase 2' },
  { id: 'all', label: 'All' },
]

export function Library() {
  // Phase 1 is the current phase for now. Milestone 4 reads this from settings.
  const [filter, setFilter] = useState<Filter>('phase1')
  const list = filter === 'all' ? exercises : exercises.filter((e) => allowedInPhase(e, filter))

  return (
    <>
      <header className="screen-head">
        <h1>Library</h1>
      </header>

      <div className="segmented" role="radiogroup" aria-label="Show exercises for">
        {filters.map((f) => (
          <button
            key={f.id}
            role="radio"
            aria-checked={filter === f.id}
            className="segment"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="exercise-list">
        {list.map((ex) => {
          const shownPhase: PhaseId | undefined =
            filter === 'all' ? phasesUsing(ex).find((p) => allowedInPhase(ex, p)) : filter
          const rx = shownPhase ? ex.rx[shownPhase] : undefined
          return (
            <li key={ex.id}>
              <a className="exercise-row" href={href({ name: 'exercise', id: ex.id })}>
                <Figure exercise={ex} size="small" />
                <span className="exercise-row-text">
                  <span className="exercise-row-name">{ex.name}</span>
                  {rx && <span className="exercise-row-dose">{formatDose(rx)}</span>}
                  {filter === 'all' && (
                    <span className="exercise-row-meta">
                      {phasesUsing(ex)
                        .filter((p) => allowedInPhase(ex, p))
                        .map((p) => phaseLabel[p])
                        .join(', ')}
                    </span>
                  )}
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <section className="card">
        <h2>Phase 1 ground rules</h2>
        <ul className="plain-list">
          {phase1.ground_rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h3>Headaches in late pregnancy</h3>
        <p>{phase1.late_pregnancy_flag}</p>
      </section>

      <a className="link-row" href={href({ name: 'equipment' })}>
        Equipment and shopping list
      </a>
    </>
  )
}
