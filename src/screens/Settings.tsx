import { useEffect, useState } from 'react'
import { updateSettings, useSettings } from '../db'
import { phase1, phase2, phaseLabel } from '../data'
import { dateKey, fromKey, phase2Week, shortDate } from '../lib/plan'
import { href } from '../router'

const restChoices = [30, 45, 60, 90]
const nudgeChoices: { label: string; value: number | undefined }[] = [
  { label: 'Off', value: undefined },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
]

type Perm = NotificationPermission | 'unsupported'
const currentPerm = (): Perm => ('Notification' in window ? Notification.permission : 'unsupported')

export function Settings() {
  const settings = useSettings()
  const [starting, setStarting] = useState(false)
  const [startDate, setStartDate] = useState(dateKey())
  const [cleared, setCleared] = useState(false)
  const current = settings.phase === 'phase1' ? phase1 : phase2
  const week = phase2Week(settings.phase2StartDate, new Date())
  const [perm, setPerm] = useState<Perm>(currentPerm)
  useEffect(() => setPerm(currentPerm()), [])

  async function askPermission() {
    if (!('Notification' in window)) return
    setPerm(await Notification.requestPermission())
  }

  async function startPhase2() {
    if (!cleared) return
    await updateSettings({ phase: 'phase2', phase2StartDate: startDate })
    setStarting(false)
    location.hash = href({ name: 'today' })
  }

  async function backToPhase1() {
    if (!confirm('Go back to Phase 1? Your Phase 2 history stays saved.')) return
    await updateSettings({ phase: 'phase1' })
  }

  return (
    <>
      <a className="back" href={href({ name: 'today' })}>Today</a>
      <p className="label">Settings</p>
      <h1>Plan</h1>

      <section className="card">
        <p className="label">Current phase</p>
        <h2 className="flush">
          {phaseLabel[settings.phase]}: {current.name}
        </h2>
        <p className="muted">{current.description}</p>
        {settings.phase === 'phase2' && settings.phase2StartDate && (
          <p className="mono">
            Started {shortDate(fromKey(settings.phase2StartDate))}
            {week ? ` · week ${week}` : ''}
          </p>
        )}
      </section>

      {settings.phase === 'phase1' && !starting && (
        <button className="btn-outline wide" onClick={() => setStarting(true)}>
          Start Phase 2
        </button>
      )}

      {settings.phase === 'phase1' && starting && (
        <section className="card" aria-labelledby="p2-h">
          <h2 id="p2-h" className="flush">Start Phase 2</h2>
          <p className="muted">{phase2.description}</p>

          <label className="field">
            <span className="label">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <p className="question">Has your provider cleared you to exercise?</p>
          <div className="choice-row" role="radiogroup" aria-label="Cleared to exercise">
            <button className="choice" role="radio" aria-checked={cleared} onClick={() => setCleared(true)}>
              Yes
            </button>
            <button className="choice" role="radio" aria-checked={!cleared} onClick={() => setCleared(false)}>
              Not yet
            </button>
          </div>
          {!cleared && <p className="muted small">Phase 1 stays on until you are cleared.</p>}

          <div className="row-2 spaced">
            <button className="btn-quiet" onClick={() => setStarting(false)}>Cancel</button>
            <button className="btn-solid" disabled={!cleared || !startDate} onClick={startPhase2}>
              Start Phase 2
            </button>
          </div>
        </section>
      )}

      {settings.phase === 'phase2' && (
        <button className="btn-quiet wide" onClick={backToPhase1}>
          Back to Phase 1
        </button>
      )}

      <section>
        <h2>Display</h2>
        <button
          className="choice wide"
          role="switch"
          aria-checked={settings.newbornMode}
          onClick={() => updateSettings({ newbornMode: !settings.newbornMode })}
        >
          Newborn mode: {settings.newbornMode ? 'on' : 'off'}
        </button>
        <p className="muted small">Bigger buttons, fewer words, and a softer Start button for night use.</p>
      </section>

      <section>
        <h2>Reminders</h2>
        <p className="question">Chin nod nudge, weekdays 10 AM to 5 PM</p>
        <div className="choice-row" role="radiogroup" aria-label="Chin nod nudge">
          {nudgeChoices.map((c) => (
            <button
              key={c.label}
              className="choice"
              role="radio"
              aria-checked={settings.nudgeInterval === c.value}
              onClick={() => updateSettings({ nudgeInterval: c.value })}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span className="question">Daily reminder</span>
          <input
            type="time"
            value={settings.reminderTime ?? ''}
            onChange={(e) => updateSettings({ reminderTime: e.target.value || undefined })}
          />
        </label>
        {settings.reminderTime && (
          <button className="text-btn" onClick={() => updateSettings({ reminderTime: undefined })}>
            Turn off daily reminder
          </button>
        )}

        <p className="muted small">
          Reminders show inside the app while it is open. Phone notifications are a best-effort extra and may not
          arrive when the app is closed, especially on iPhone.
        </p>
        {perm === 'default' && (
          <button className="btn-quiet wide" onClick={askPermission}>Allow phone notifications</button>
        )}
        {perm === 'granted' && <p className="label">Phone notifications: allowed</p>}
        {perm === 'denied' && <p className="label">Phone notifications: blocked in browser settings</p>}
      </section>

      <section>
        <h2>Rest between sets</h2>
        <div className="choice-row" role="radiogroup" aria-label="Rest between sets">
          {restChoices.map((s) => (
            <button
              key={s}
              className="choice mono"
              role="radio"
              aria-checked={settings.restSeconds === s}
              onClick={() => updateSettings({ restSeconds: s })}
            >
              {s}s
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
