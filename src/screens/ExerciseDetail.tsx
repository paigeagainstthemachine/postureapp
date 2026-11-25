import { getExercise, formatDose, phasesUsing, allowedInPhase, phaseLabel } from '../data'
import { href } from '../router'
import { Figure } from '../components/Figure'

export function ExerciseDetail({ id }: { id: string }) {
  const ex = getExercise(id)

  if (!ex) {
    return (
      <>
        <a className="back" href={href({ name: 'library' })}>Library</a>
        <p>That exercise is not in the plan.</p>
      </>
    )
  }

  const phases = phasesUsing(ex).filter((p) => allowedInPhase(ex, p))

  return (
    <article>
      <a className="back" href={href({ name: 'library' })}>Library</a>
      <h1>{ex.name}</h1>
      <p className="muted cap">{ex.targets}</p>

      <div className="figure-frame">
        <Figure exercise={ex} />
      </div>

      <dl className="doses">
        {phases.map((p) => (
          <div key={p} className="dose">
            <dt>{phaseLabel[p]}</dt>
            <dd>{formatDose(ex.rx[p]!)}</dd>
          </div>
        ))}
      </dl>
      {!ex.pregnancy_safe && <p className="tag">Phase 2 only. Not used during pregnancy.</p>}

      <section>
        <h2>Position</h2>
        <p className="cap">{ex.position}</p>
        {ex.side_specific && ex.priority_side && (
          <p>Priority side: {ex.priority_side}.</p>
        )}
        {ex.tempo && <p>Lower slowly, {ex.tempo.lowering_seconds} seconds each rep.</p>}
      </section>

      <section>
        <h2>Steps</h2>
        <ol className="steps">
          {ex.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      {ex.spots && (
        <section>
          <h2>Spots</h2>
          <ul className="plain-list">
            {ex.spots.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Cue</h2>
        <p>{ex.cue}</p>
        <h2>Note</h2>
        <p>{ex.note}</p>
      </section>

      <section>
        <h2>You need</h2>
        <ul className="plain-list">
          {ex.equipment.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    </article>
  )
}
