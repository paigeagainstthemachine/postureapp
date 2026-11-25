// On-device storage (IndexedDB through Dexie). Nothing leaves the phone.
import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import type { PhaseId } from '../data'

export type Effort = 'easy' | 'right' | 'hard'
export type Side = 'left' | 'right'

export interface SessionRec {
  id: number
  date: string // local YYYY-MM-DD
  phase: PhaseId
  kind: 'full' | 'quick'
  startedAt: number
  endedAt?: number
  completed: boolean
  notes?: string
}

export interface SetLog {
  id: number
  sessionId?: number
  date: string
  at: number
  exerciseId: string
  setIndex: number
  side?: Side
  reps: number
  holdSeconds?: number
  load?: string
  effort?: Effort
  skipped: boolean
  /** player: done in a guided session. tick: checked off on Today. quick: the quick chin nod button. */
  source: 'player' | 'tick' | 'quick'
}

export interface CheckIn {
  date: string
  painRightNeckShoulder: number
  headache: 'none' | 'mild' | 'bad'
  armFatigueOrTingling: boolean
  note?: string
}

/** A day marked light: nothing is expected that day. */
export interface DayMark {
  date: string
  light: boolean
}

export interface OwnedEquipment {
  itemId: string
  owned: boolean
}

export interface Settings {
  id: 'settings'
  phase: PhaseId
  phase2StartDate?: string
  newbornMode: boolean
  reminderTime?: string
  nudgeInterval?: number
  restSeconds: number
}

export const defaultSettings: Settings = {
  id: 'settings',
  phase: 'phase1',
  newbornMode: false,
  restSeconds: 45,
}

class PostureDB extends Dexie {
  sessions!: EntityTable<SessionRec, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  checkIns!: EntityTable<CheckIn, 'date'>
  ownedEquipment!: EntityTable<OwnedEquipment, 'itemId'>
  settings!: EntityTable<Settings, 'id'>
  days!: EntityTable<DayMark, 'date'>

  constructor() {
    super('posture-plan')
    this.version(1).stores({
      sessions: '++id, date',
      setLogs: '++id, date, exerciseId, sessionId, [exerciseId+date]',
      checkIns: 'date',
      ownedEquipment: 'itemId',
      settings: 'id',
    })
    this.version(2).stores({ days: 'date' })
  }
}

export const db = new PostureDB()

// Ask the browser not to evict our data under storage pressure. Best effort.
navigator.storage?.persist?.().catch(() => {})

/** Settings merged over defaults. `loaded` is false until IndexedDB has answered. */
export function useSettings(): Settings & { loaded: boolean } {
  const s = useLiveQuery(() => db.settings.get('settings').then((r) => r ?? null))
  return { ...defaultSettings, ...s, loaded: s !== undefined }
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>) {
  const current = (await db.settings.get('settings')) ?? defaultSettings
  await db.settings.put({ ...current, ...patch })
}

export function useLightDay(date: string): boolean {
  return useLiveQuery(() => db.days.get(date), [date])?.light ?? false
}

export async function setLightDay(date: string, light: boolean) {
  if (light) await db.days.put({ date, light: true })
  else await db.days.delete(date)
}

export function useLogsForDate(date: string): SetLog[] {
  return useLiveQuery(() => db.setLogs.where('date').equals(date).toArray(), [date]) ?? []
}

/** Most recent load used for an exercise, to pre-fill the log. */
export async function lastLoad(exerciseId: string): Promise<string | undefined> {
  const logs = await db.setLogs.where('exerciseId').equals(exerciseId).sortBy('at')
  return logs.reverse().find((l) => !l.skipped && l.load)?.load
}
