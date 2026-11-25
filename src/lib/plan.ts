// Turns program data into what a given day needs. No content lives here.
import { allowedInPhase, getExercise, phase1, phase2, type Exercise, type PhaseId, type Prescription, type Weekday } from '../data'
import type { Side } from '../db'

const weekdays: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function weekdayOf(d: Date): Weekday {
  return weekdays[d.getDay()]
}

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function ids(list: string[]): Exercise[] {
  return list.map(getExercise).filter((e): e is Exercise => Boolean(e))
}

/** Exercises planned for a day, in order. Always filtered by the phase safety rule. */
export function planFor(phase: PhaseId, d: Date): Exercise[] {
  const day = weekdayOf(d)
  let list: Exercise[]
  if (phase === 'phase1') {
    list = phase1.schedule[day].flatMap((item) => (item === 'daily_block' ? ids(phase1.daily_block) : ids([item])))
  } else {
    const entry = phase2.schedule[day]
    list = entry.type === 'strength' ? ids(phase2.strength_day) : ids(entry.items ?? [])
  }
  // De-duplicate while keeping order, then apply the safety rule.
  const seen = new Set<string>()
  return list.filter((e) => !seen.has(e.id) && seen.add(e.id) && allowedInPhase(e, phase))
}

export type Kind = 'hold' | 'reps' | 'spots'

export function kindOf(rx: Prescription): Kind {
  if (rx.duration_seconds_per_spot !== undefined) return 'spots'
  // A 1 second pause at the top (push-up plus) is still a rep exercise.
  if (rx.hold_seconds && rx.hold_seconds >= 2) return 'hold'
  return 'reps'
}

/** "12-15" -> { min: 12, max: 15 }, 10 -> { min: 10, max: 10 } */
export function parseCount(c: number | string | undefined): { min: number; max: number; label: string } {
  if (c === undefined) return { min: 0, max: 0, label: '' }
  if (typeof c === 'number') return { min: c, max: c, label: String(c) }
  const [a, b] = c.split('-').map((n) => parseInt(n, 10))
  return { min: a, max: b ?? a, label: c }
}

/**
 * Which sides to walk through for one set. Per-side exercises do right then left
 * (right is the priority). Others are done once; their priority side is shown as a label.
 */
export function sidesFor(rx: Prescription): (Side | undefined)[] {
  return rx.per_side ? ['right', 'left'] : [undefined]
}

/** Parse a YYYY-MM-DD key as a local date (noon, to dodge DST edges). */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Monday of the week containing d. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
  return addDays(x, -((x.getDay() + 6) % 7))
}

/** "25.11" */
export function shortDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Whole days from a to b. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
