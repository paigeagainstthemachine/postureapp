// JSON backup and restore. The file stays with the user: nothing is uploaded.
import { db } from '../db'
import { dateKey } from './plan'

const APP = 'posture-plan'
const FORMAT = 1
const TABLES = ['settings', 'sessions', 'setLogs', 'checkIns', 'days', 'ownedEquipment'] as const
type TableName = (typeof TABLES)[number]

export interface Backup {
  app: typeof APP
  format: number
  exportedAt: string
  data: Record<TableName, unknown[]>
}

export async function makeBackup(): Promise<Backup> {
  const data = {} as Backup['data']
  for (const t of TABLES) data[t] = await db.table(t).toArray()
  return { app: APP, format: FORMAT, exportedAt: new Date().toISOString(), data }
}

/** Save the backup as a file: the share sheet where supported (iPhone), else a download. */
export async function saveBackup(): Promise<void> {
  const backup = await makeBackup()
  const name = `posture-plan-backup-${dateKey()}.json`
  const file = new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Posture plan backup' })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface BackupSummary {
  exportedAt: string
  counts: Record<TableName, number>
}

/** Read and check a backup file without changing anything. Throws a readable message if it is not valid. */
export async function readBackup(file: File): Promise<{ backup: Backup; summary: BackupSummary }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not a backup from this app.')
  }
  const b = parsed as Partial<Backup>
  if (!b || b.app !== APP || typeof b.data !== 'object' || !b.data) throw new Error('That file is not a backup from this app.')
  if ((b.format ?? 0) > FORMAT) throw new Error('That backup is from a newer version of the app. Update the app first.')
  const counts = {} as BackupSummary['counts']
  for (const t of TABLES) {
    const rows = (b.data as Record<string, unknown>)[t] ?? []
    if (!Array.isArray(rows)) throw new Error('That backup file is damaged.')
    counts[t] = rows.length
  }
  return { backup: b as Backup, summary: { exportedAt: b.exportedAt ?? '', counts } }
}

/** Replace everything on this device with the backup, in one transaction. */
export async function restoreBackup(backup: Backup): Promise<void> {
  const tables = TABLES.map((t) => db.table(t))
  await db.transaction('rw', tables, async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      const rows = backup.data[t] ?? []
      if (rows.length) await db.table(t).bulkPut(rows)
    }
  })
}
