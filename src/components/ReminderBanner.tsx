import { useEffect, useState } from 'react'
import { db, useSettings } from '../db'
import { dateKey } from '../lib/plan'
import { href } from '../router'
import { unlockAudio } from '../lib/cues'

// Gentle, in-app reminders. They run while the app is open (or installed and
// in the foreground). Phone notifications are a best-effort extra.
const NUDGE_DAYS = [1, 2, 3, 4, 5] // Mon to Fri
const NUDGE_FROM_HOUR = 10
const NUDGE_TO_HOUR = 17
const CHECK_EVERY_MS = 30_000

const LAST_NUDGE = 'posture.lastNudgeAt'
const LAST_DAILY = 'posture.lastDailyReminder'

type Kind = 'nudge' | 'daily'

async function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, { body, icon: '/icons/icon-192.png', tag: 'posture-reminder' })
    else new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch {
    // Some browsers refuse notifications outside a service worker. The banner still shows.
  }
}

export function ReminderBanner() {
  const settings = useSettings()
  const [kind, setKind] = useState<Kind | null>(null)

  useEffect(() => {
    if (!settings.loaded) return
    async function check() {
      const now = new Date()
      const today = dateKey(now)

      // Chin nod nudge: weekdays during work hours, if nothing chin nod for a while.
      const interval = settings.nudgeInterval
      if (interval && NUDGE_DAYS.includes(now.getDay()) && now.getHours() >= NUDGE_FROM_HOUR && now.getHours() < NUDGE_TO_HOUR) {
        const lastNod = (await db.setLogs.where('[exerciseId+date]').equals(['chin_nod', today]).toArray())
          .map((l) => l.at)
          .reduce((a, b) => Math.max(a, b), 0)
        // Start the clock the first time nudges run, rather than nudging at once.
        if (!localStorage.getItem(LAST_NUDGE)) localStorage.setItem(LAST_NUDGE, String(Date.now()))
        const lastNudge = Number(localStorage.getItem(LAST_NUDGE))
        const since = Date.now() - Math.max(lastNod, lastNudge)
        if (since >= interval * 60_000) {
          localStorage.setItem(LAST_NUDGE, String(Date.now()))
          setKind('nudge')
          void notify('Chin nods?', '10 holds of 5 seconds. About a minute.')
          return
        }
      }

      // Daily reminder: once, at or after the chosen time, if nothing is logged yet.
      if (settings.reminderTime && localStorage.getItem(LAST_DAILY) !== today) {
        const [h, m] = settings.reminderTime.split(':').map(Number)
        const due = new Date(now)
        due.setHours(h, m, 0, 0)
        if (now >= due) {
          localStorage.setItem(LAST_DAILY, today)
          const any = await db.setLogs.where('date').equals(today).count()
          const light = (await db.days.get(today))?.light
          if (!any && !light) {
            setKind('daily')
            void notify('Posture plan', 'Ready when you are. Ten minutes, or just chin nods.')
          }
        }
      }
    }
    void check()
    const id = setInterval(check, CHECK_EVERY_MS)
    return () => clearInterval(id)
  }, [settings.loaded, settings.nudgeInterval, settings.reminderTime])

  if (!kind) return null

  return (
    <div className="reminder" role="status">
      <p className="reminder-text">{kind === 'nudge' ? 'Chin nods? About a minute.' : 'Ready when you are.'}</p>
      <div className="row-2">
        <button className="btn-quiet" onClick={() => setKind(null)}>Later</button>
        <a
          className="btn-solid"
          href={kind === 'nudge' ? href({ name: 'quick', id: 'chin_nod' }) : href({ name: 'today' })}
          onClick={() => {
            unlockAudio()
            setKind(null)
          }}
        >
          {kind === 'nudge' ? 'Start' : 'Open Today'}
        </a>
      </div>
    </div>
  )
}
