// Single entry point for program content. Components read from here,
// never from hardcoded copy. Source of truth is the JSON in /data.
import exercisesJson from '../../data/exercises.json'
import programJson from '../../data/program.json'
import shoppingJson from '../../data/shopping-list.json'
import type { Exercise, Phase1, Phase2, PhaseId, Prescription, ShoppingList } from './types'

export * from './types'

export const exercises = exercisesJson.exercises as Exercise[]
export const phase1 = programJson.phases.find((p) => p.id === 'phase1') as Phase1
export const phase2 = programJson.phases.find((p) => p.id === 'phase2') as Phase2
export const shoppingList = shoppingJson as ShoppingList

const byId = new Map(exercises.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id)
}

// Figures live in /assets/figures. The app uses the dark copies in /assets/figures/dark,
// made by scripts/make-dark-figures.mjs. Vite fingerprints them into the build.
const figureUrls = import.meta.glob('../../assets/figures/dark/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function figureUrl(ex: Exercise): string | undefined {
  const file = ex.figure.split('/').pop()
  return Object.entries(figureUrls).find(([path]) => path.endsWith('/' + file))?.[1]
}

/** Phases whose plan uses this exercise. */
export function phasesUsing(ex: Exercise): PhaseId[] {
  return (Object.keys(ex.rx) as PhaseId[]).filter((p) => ex.rx[p])
}

/**
 * Safety rule: Phase 1 never includes an exercise flagged pregnancy_safe: false,
 * even if the data were edited to give it a phase1 prescription.
 */
export function allowedInPhase(ex: Exercise, phase: PhaseId): boolean {
  if (phase === 'phase1' && !ex.pregnancy_safe) return false
  return Boolean(ex.rx[phase])
}

export function exercisesForPhase(phase: PhaseId): Exercise[] {
  return exercises.filter((e) => allowedInPhase(e, phase))
}

/** Human-readable dose, like "2 × 12, light band" or "10 × 5 sec hold, 3 times a day". */
export function formatDose(rx: Prescription): string {
  const parts: string[] = []
  if (rx.duration_seconds_per_spot !== undefined) {
    parts.push(`${rx.duration_seconds_per_spot} sec per spot`)
  } else if (rx.reps !== undefined) {
    const setsReps = rx.sets > 1 ? `${rx.sets} × ${rx.reps}` : `${rx.reps} reps`
    parts.push(rx.hold_seconds ? `${setsReps}, ${rx.hold_seconds} sec hold` : setsReps)
  }
  if (rx.per_side) parts.push('each side')
  if (rx.times_per_day && rx.times_per_day > 1) parts.push(`${rx.times_per_day} times a day`)
  if (rx.load && rx.load !== 'none') parts.push(rx.load)
  return parts.join(', ')
}

export const phaseLabel: Record<PhaseId, string> = {
  phase1: 'Phase 1',
  phase2: 'Phase 2',
}
