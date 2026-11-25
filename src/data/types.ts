export type PhaseId = 'phase1' | 'phase2'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

/** A count that may be a fixed number or a range written as text, like "12-15". */
export type CountOrRange = number | string

export interface Prescription {
  sets: number
  reps?: CountOrRange
  hold_seconds?: number
  times_per_day?: number
  duration_seconds_per_spot?: CountOrRange
  load: string
  per_side?: boolean
}

export interface Exercise {
  id: string
  name: string
  figure: string
  equipment: string[]
  position: string
  steps: string[]
  cue: string
  note: string
  targets: string
  pregnancy_safe: boolean
  side_specific: boolean
  priority_side?: 'left' | 'right'
  per_side?: boolean
  tempo?: { lowering_seconds: number }
  spots?: string[]
  rx: Partial<Record<PhaseId, Prescription>>
}

export interface Phase1 {
  id: 'phase1'
  name: string
  description: string
  ground_rules: string[]
  daily_block: string[]
  extra_chin_nod_sessions_per_day: number
  schedule: Record<Weekday, string[]>
  late_pregnancy_flag: string
}

export interface Phase2Day {
  type: 'strength' | 'walk' | 'optional_walk' | 'rest'
  items?: string[]
  minutes?: string
}

export interface Phase2 {
  id: 'phase2'
  name: string
  description: string
  strength_day: string[]
  warmup: string
  schedule: Record<Weekday, Phase2Day>
  progression: { weeks: string; change: string }[]
  flare_rule: string
}

export type Phase = Phase1 | Phase2

export interface ShoppingItem {
  name: string
  approx_usd: string
  phase: 1 | 2
  links: string[]
}

export interface ShoppingList {
  budget_usd: number
  note: string
  items: ShoppingItem[]
}
