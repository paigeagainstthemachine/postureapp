import { useState } from 'react'
import { updateSettings, useSettings } from '../db'
import { phase1, phase2, phaseLabel } from '../data'
import { dateKey, fromKey, phase2Week, shortDate } from '../lib/plan'
import { href } from '../router'

const restChoices = [30, 45, 60, 90]

export function Settings() {
  const settings = useSettings()
  const [starting, setStarting] = useState(false)
  const [startDate, setStartDate] = useState(dateKey())
  const [cleared, setCleared] = useState(false)
  const current = settings.phase === 'phase1' ? phase1 : phase2
  const week = phase2Week(settings.phase2StartDate, new Date())

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
