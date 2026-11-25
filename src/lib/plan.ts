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

/** A row on Today: an exercise, or a walk (walks are not in exercises.json). */
export type PlanItem =
  | { kind: 'exercise'; id: string; ex: Exercise }
  | { kind: 'walk'; id: 'walk'; minutes?: string; optional: boolean }

export type DayType = 'daily' | 'strength' | 'walk' | 'optional_walk' | 'rest'

export interface DayPlan {
  type: DayType
  items: PlanItem[]
  warmup?: string
}

export const WALK_ID = 'walk'

export function dayPlan(phase: PhaseId, d: Date): DayPlan {
  const exItems = planFor(phase, d).map((ex) => ({ kind: 'exercise' as const, id: ex.id, ex }))
  if (phase === 'phase1') return { type: 'daily', items: exItems }
  const entry = phase2.schedule[weekdayOf(d)]
  const items: PlanItem[] = [...exItems]
  if (entry.type === 'walk') items.unshift({ kind: 'walk', id: 'walk', minutes: entry.minutes, optional: false })
  if (entry.type === 'optional_walk') items.unshift({ kind: 'walk', id: 'walk', optional: true })
  return { type: entry.type, items, warmup: entry.type === 'strength' ? phase2.warmup : undefined }
}

/** Items that count toward "done today". An optional walk is a bonus, not a target. */
export function counted(items: PlanItem[]): PlanItem[] {
  return items.filter((i) => !(i.kind === 'walk' && i.optional))
}

// ---------- Phase 2 progression ----------

/** Week number (1-based) since Phase 2 started, or undefined before it starts. */
export function phase2Week(startKey: string | undefined, d: Date): number | undefined {
  if (!startKey) return undefined
  const days = daysBetween(fromKey(startKey), new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12))
  return days < 0 ? undefined : Math.floor(days / 7) + 1
}

export interface Progression {
  week: number
  weeks: string
  change: string
  /** This week is a step up in load, per the progression table. */
  stepUp: boolean
  /** "2 sets of everything" caps sets this block. */
  setsCap?: number
  /** "3 seconds lowering on every rep" sets the auto pace tempo this block. */
  lowerSeconds?: number
}

/**
 * Reads the progression table in program.json. Effects are taken from the
 * table's own words, so editing the data changes the behaviour.
 */
export function progressionFor(week: number): Progression {
  const blocks = phase2.progression.map((p) => {
    const [a, b] = p.weeks.split('-').map(Number)
    return { ...p, from: a, to: b ?? a }
  })
  const block = blocks.find((b) => week >= b.from && week <= b.to) ?? blocks[blocks.length - 1]
  const stepsUp = /move up|step up/i.test(block.change)
  const sets = block.change.match(/(\d+) sets of everything/i)
  const lower = block.change.match(/(\d+) seconds lowering/i)
  return {
    week,
    weeks: block.weeks,
    change: block.change,
    // Step up at the start of the block, then every 2 weeks within it.
    stepUp: stepsUp && (week - block.from) % 2 === 0,
    setsCap: sets ? Number(sets[1]) : undefined,
    lowerSeconds: lower ? Number(lower[1]) : undefined,
  }
}

/** Exercises that only happen on strength days, used to tell a strength day was done. */
export function strengthOnlyIds(): Set<string> {
  const other = new Set(Object.values(phase2.schedule).flatMap((d) => d.items ?? []))
  return new Set(phase2.strength_day.filter((id) => !other.has(id)))
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

/**
 * The prescription to use today: the data's rx, with the Phase 2 progression
 * block applied (for example "2 sets of everything" in weeks 1-2).
 */
export function effectiveRx(ex: Exercise, phase: PhaseId, progression?: Progression): Prescription | undefined {
  const rx = ex.rx[phase]
  if (!rx) return undefined
  if (phase === 'phase2' && progression?.setsCap) return { ...rx, sets: Math.min(rx.sets, progression.setsCap) }
  return rx
}

/** Progression for a date, or undefined outside Phase 2. */
export function progressionOn(phase: PhaseId, phase2StartDate: string | undefined, d: Date): Progression | undefined {
  if (phase !== 'phase2') return undefined
  const week = phase2Week(phase2StartDate, d)
  return week ? progressionFor(week) : undefined
}
