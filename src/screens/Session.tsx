import { useEffect, useRef, useState } from 'react'
import { db, lastLoad, useLogsForDate, useSettings, type Effort, type SetLog } from '../db'
import { formatDose, getExercise, phase1, type Exercise, type PhaseId, type Prescription } from '../data'
import { dateKey, dayPlan, effectiveRx, kindOf, parseCount, planFor, progressionOn, sidesFor } from '../lib/plan'
import { cue, unlockAudio, useWakeLock } from '../lib/cues'
import { useNow } from '../lib/useNow'
import { Figure } from '../components/Figure'
import { href } from '../router'

const GET_READY_SECONDS = 3
const RELAX_SECONDS = 3
const AUTO_LIFT_SECONDS = 1.5
const AUTO_DEFAULT_LOWER_SECONDS = 1.5

type Step =
  | { t: 'warmup'; text: string }
  | { t: 'intro' }
  | { t: 'work' }
  | { t: 'log'; reps: number; holdSeconds?: number }
  | { t: 'rest'; endsAt: number }
  | { t: 'finished'; stoppedEarly: boolean }

interface Pos {
  ex: number
  set: number
  side: number
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const secondsLeft = (endsAt: number, now: number) => Math.max(0, Math.ceil((endsAt - now) / 1000))

function stopRule(phase: PhaseId): string {
  const rules = phase === 'phase1' ? phase1.ground_rules : []
  return (
    rules.find((r) => r.toLowerCase().startsWith('stop')) ??
    'Stop and rest if dizzy, short of breath, sharp pain, or tingling or numbness in the arm.'
  )
}

/**
 * Guided session. With quickId it runs a single exercise straight away (quick chin nods).
 */
export function Session({ quickId }: { quickId?: string }) {
  const settings = useSettings()
  const phase = settings.phase
  const today = dateKey()
  const todaysLogs = useLogsForDate(today)

  // Build the queue once: today's plan minus what is already done, or everything if all done.
  const [queue, setQueue] = useState<Exercise[] | null>(null)
  useEffect(() => {
    if (queue || !settings.loaded) return
    if (quickId) {
      const ex = getExercise(quickId)
      setQueue(ex ? [ex] : [])
      return
    }
    void db.setLogs.where('date').equals(today).toArray().then((logs) => {
      const done = new Set(logs.filter((l) => !l.skipped && l.source !== 'quick').map((l) => l.exerciseId))
      const plan = planFor(phase, new Date())
      const left = plan.filter((e) => !done.has(e.id))
      setQueue(left.length ? left : plan)
      const warmup = dayPlan(phase, new Date()).warmup
      if (warmup) setStep({ t: 'warmup', text: warmup })
    })
  }, [queue, quickId, phase, today, settings.loaded])

  const [pos, setPos] = useState<Pos>({ ex: 0, set: 0, side: 0 })
  const [step, setStep] = useState<Step>(quickId ? { t: 'work' } : { t: 'intro' })
  const [showRules, setShowRules] = useState(false)
  const sessionId = useRef<number | null>(null)
  const restNow = useNow(step.t === 'rest', 250)

  useWakeLock(step.t !== 'finished')

  // One session row, created when work starts. Kept as a promise so double calls share it.
  const sessionPromise = useRef<Promise<number> | null>(null)
  function ensureSession(): Promise<number> {
    sessionPromise.current ??= db.sessions
      .add({ date: today, phase, kind: quickId ? 'quick' : 'full', startedAt: Date.now(), completed: false })
      .then((id) => (sessionId.current = id))
    return sessionPromise.current
  }

  useEffect(() => {
    if (quickId) void ensureSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickId])

  async function addLog(log: Omit<SetLog, 'id' | 'sessionId' | 'date' | 'at' | 'source'>) {
    const sid = await ensureSession()
    await db.setLogs.add({
      ...log,
      sessionId: sid,
      date: today,
      at: Date.now(),
      source: quickId ? 'quick' : 'player',
    } as SetLog)
  }

  async function finish(stoppedEarly: boolean) {
    if (sessionId.current !== null) {
      await db.sessions.update(sessionId.current, { endedAt: Date.now(), completed: !stoppedEarly })
    }
    setStep({ t: 'finished', stoppedEarly })
  }

  // Rest countdown end.
  useEffect(() => {
    if (step.t === 'rest' && restNow >= step.endsAt) {
      cue.done()
      setStep({ t: 'work' })
    }
  }, [step, restNow])

  if (!queue) return null

  if (queue.length === 0) {
    return (
      <div className="player">
        <p>Nothing planned for today.</p>
        <a className="btn-primary" href={href({ name: 'today' })}>Back to Today</a>
      </div>
    )
  }

  const ex = queue[pos.ex]
  const progression = progressionOn(phase, settings.phase2StartDate, new Date())
  const rx = ex ? effectiveRx(ex, phase, progression) : undefined
  const lowerSeconds = ex?.tempo?.lowering_seconds ?? progression?.lowerSeconds
  const sides = rx ? sidesFor(rx) : [undefined]
  const side = sides[pos.side]

  function nextExercise() {
    if (pos.ex + 1 < queue!.length) {
      setPos({ ex: pos.ex + 1, set: 0, side: 0 })
      setStep({ t: 'intro' })
    } else {
      void finish(false)
    }
  }

  function advanceAfterSet() {
    if (pos.side + 1 < sides.length) {
      setPos({ ...pos, side: pos.side + 1 })
      setStep({ t: 'work' })
    } else if (rx && pos.set + 1 < rx.sets) {
      setPos({ ...pos, set: pos.set + 1, side: 0 })
      setStep({ t: 'rest', endsAt: Date.now() + settings.restSeconds * 1000 })
    } else {
      nextExercise()
    }
  }

  async function onWorkDone(reps: number, holdSeconds?: number) {
    cue.done()
    if (quickId) {
      await addLog({ exerciseId: ex.id, setIndex: 0, reps, holdSeconds, load: rx?.load, skipped: false })
      await finish(false)
      return
    }
    setStep({ t: 'log', reps, holdSeconds })
  }

  async function onSpotsDone(seconds: number[]) {
    cue.done()
    for (let i = 0; i < seconds.length; i++) {
      await addLog({ exerciseId: ex.id, setIndex: i, reps: 0, holdSeconds: seconds[i], load: rx?.load, skipped: false, side: ex.priority_side })
    }
    advanceAfterSet()
  }

  async function onLogged(reps: number, load: string | undefined, effort: Effort) {
    await addLog({
      exerciseId: ex.id,
      setIndex: pos.set,
      side,
      reps,
      holdSeconds: step.t === 'log' ? step.holdSeconds : undefined,
      load,
      effort,
      skipped: false,
    })
    advanceAfterSet()
  }

  async function skip() {
    await addLog({ exerciseId: ex.id, setIndex: pos.set, reps: 0, skipped: true })
    nextExercise()
  }

  function doLater() {
    const q = [...queue!]
    const [moved] = q.splice(pos.ex, 1)
    q.push(moved)
    setQueue(q)
    setPos({ ex: pos.ex, set: 0, side: 0 })
    setStep({ t: 'intro' })
  }

  function stop() {
    if (confirm('End the session? Everything you did is saved.')) void finish(true)
  }

  if (step.t === 'finished') {
    return (
      <Finished
        queue={queue}
        logs={todaysLogs.filter((l) => l.sessionId === sessionId.current)}
        quick={Boolean(quickId)}
        stoppedEarly={step.stoppedEarly}
      />
    )
  }

  if (!ex || !rx) return null
  const kind = kindOf(rx)
  const reps = parseCount(rx.reps)

  return (
    <div className="player">
      <div className="player-top">
        <button className="top-btn" onClick={stop}>✕ Stop</button>
        <span className="mono">
          {pad2(pos.ex + 1)}/{pad2(queue.length)}
        </span>
        <button className="top-btn" onClick={() => setShowRules(true)} aria-haspopup="dialog">
          ! Stop rules
        </button>
      </div>

      <div className="figure-frame player-figure">
        <Figure exercise={ex} />
      </div>

      <h1 className="player-name">{ex.name}</h1>
      <p className="player-meta">
        {side ? (
          <span className="side">{side} side</span>
        ) : (
          ex.priority_side && <span className="side">Priority: {ex.priority_side}</span>
        )}
        <span className="label">
          {ex.position} · {formatDose({ ...rx, times_per_day: undefined })}
        </span>
      </p>

      {step.t === 'warmup' && (
        <>
          <div className="readout">
            <p className="readout-word">Warm up</p>
            <p className="warmup-text">{step.text}</p>
          </div>
          <div className="bottom-action player-actions">
            <button className="btn-primary" onClick={() => setStep({ t: 'intro' })}>Ready ▶</button>
          </div>
        </>
      )}

      {step.t === 'intro' && (
        <Intro ex={ex} rx={rx} brief={settings.newbornMode} lowerSeconds={kind === 'reps' ? lowerSeconds : undefined} weekNote={pos.ex === 0 ? progression?.change : undefined} onBegin={() => { unlockAudio(); void ensureSession(); setStep({ t: 'work' }) }} onSkip={skip} onLater={queue.length - pos.ex > 1 ? doLater : undefined} />
      )}

      {step.t === 'work' && kind !== 'spots' && (
        <>
          <p className="label set-label">
            Set {pos.set + 1}/{rx.sets}
            {sides.length > 1 ? ` · ${side} side` : ''}
          </p>
          <p className="cue-now">{ex.cue}</p>
        </>
      )}

      {step.t === 'work' && kind === 'hold' && (
        <HoldTimer
          key={`${pos.ex}-${pos.set}-${pos.side}`}
          reps={reps.min}
          holdSeconds={rx.hold_seconds!}
          onDone={onWorkDone}
        />
      )}
      {step.t === 'work' && kind === 'reps' && (
        <RepCounter
          key={`${pos.ex}-${pos.set}-${pos.side}`}
          target={reps}
          lowerSeconds={lowerSeconds}
          onDone={(n) => onWorkDone(n)}
        />
      )}
      {step.t === 'work' && kind === 'spots' && (
        <SpotTimer key={pos.ex} spots={ex.spots ?? ['Spot']} range={parseCount(rx.duration_seconds_per_spot)} onDone={onSpotsDone} />
      )}

      {step.t === 'log' && (
        <LogSet
          key={`${pos.ex}-${pos.set}-${pos.side}`}
          ex={ex}
          rx={rx}
          setIndex={pos.set}
          reps={step.reps}
          onSave={onLogged}
        />
      )}

      {step.t === 'rest' && (
        <Rest
          left={secondsLeft(step.endsAt, restNow)}
          next={`Set ${pos.set + 1}/${rx.sets}`}
          onAdjust={(d) => setStep({ t: 'rest', endsAt: Math.max(Date.now() + 5000, step.endsAt + d * 1000) })}
          onSkip={() => setStep({ t: 'work' })}
          onMoveOn={nextExercise}
        />
      )}

      {showRules && (
        <div className="sheet-backdrop" onClick={() => setShowRules(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Stop rules" onClick={(e) => e.stopPropagation()}>
            <p className="label">Stop rules</p>
            <p className="sheet-text">{stopRule(phase)}</p>
            <button className="btn-primary" autoFocus onClick={() => setShowRules(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Intro({
  ex,
  rx,
  brief,
  lowerSeconds,
  weekNote,
  onBegin,
  onSkip,
  onLater,
}: {
  ex: Exercise
  rx: Prescription
  brief: boolean
  lowerSeconds?: number
  weekNote?: string
  onBegin: () => void
  onSkip: () => void
  onLater?: () => void
}) {
  const [have, setHave] = useState<Set<string>>(new Set())
  return (
    <>
      {brief ? (
        <details className="disclosure">
          <summary>Steps</summary>
          <ol className="steps">
            {ex.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="cue-line">{ex.note}</p>
        </details>
      ) : (
        <>
          <ol className="steps">
            {ex.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="cue-line">{ex.note}</p>
        </>
      )}
      {weekNote && <p className="week-card-text week-note">{weekNote}</p>}
      {lowerSeconds && <p className="label">Lower over {lowerSeconds} seconds</p>}

      <p className="label equip-label">You need</p>
      <ul className="equip-checks">
        {ex.equipment.map((item) => {
          const on = have.has(item)
          return (
            <li key={item}>
              <button
                className="equip-check"
                role="checkbox"
                aria-checked={on}
                onClick={() => {
                  const n = new Set(have)
                  if (on) n.delete(item)
                  else n.add(item)
                  setHave(n)
                }}
              >
                <span className="mini-box" aria-hidden="true">{on ? '✓' : ''}</span>
                <span className="cap">{item}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {rx.load && rx.load !== 'none' && <p className="label">Load: {rx.load}</p>}

      <div className="bottom-action player-actions">
        <div className="row-2">
          <button className="btn-quiet" onClick={onSkip}>Skip</button>
          {onLater && <button className="btn-quiet" onClick={onLater}>Do later</button>}
        </div>
        <button className="btn-primary" onClick={onBegin}>Begin ▶</button>
      </div>
    </>
  )
}

/** Hold exercises: get ready, hold, relax, repeat. Advances on its own. */
function HoldTimer({ reps, holdSeconds, onDone }: { reps: number; holdSeconds: number; onDone: (reps: number, hold: number) => void }) {
  type Phase = 'ready' | 'hold' | 'relax'
  const [phase, setPhase] = useState<Phase>('ready')
  const [rep, setRep] = useState(0) // reps completed
  const [endsAt, setEndsAt] = useState(() => Date.now() + GET_READY_SECONDS * 1000)
  const [pausedLeft, setPausedLeft] = useState<number | null>(null)
  const now = useNow(pausedLeft === null)
  const finished = useRef(false)

  useEffect(() => {
    if (pausedLeft !== null || now < endsAt || finished.current) return
    if (phase === 'ready' || phase === 'relax') {
      cue.go()
      setPhase('hold')
      setEndsAt(Date.now() + holdSeconds * 1000)
    } else {
      const done = rep + 1
      setRep(done)
      if (done >= reps) {
        finished.current = true
        onDone(done, holdSeconds)
        return
      }
      cue.release()
      setPhase('relax')
      setEndsAt(Date.now() + RELAX_SECONDS * 1000)
    }
  }, [now, endsAt, phase, rep, reps, holdSeconds, pausedLeft, onDone])

  const left = pausedLeft ?? secondsLeft(endsAt, now)
  const word = phase === 'hold' ? 'Hold' : phase === 'relax' ? 'Relax' : 'Get ready'

  function togglePause() {
    if (pausedLeft === null) setPausedLeft(Math.max(0, endsAt - Date.now()) / 1000)
    else {
      setEndsAt(Date.now() + pausedLeft * 1000)
      setPausedLeft(null)
    }
  }

  return (
    <>
      <div className={`readout ${phase === 'hold' ? 'readout-live' : ''}`} aria-live="polite">
        <p className="readout-word">{pausedLeft !== null ? 'Paused' : word}</p>
        <p className="readout-big mono">{left}</p>
        <p className="mono readout-sub">
          Rep {Math.min(rep + 1, reps)}/{reps}
        </p>
      </div>
      <div className="bottom-action player-actions">
        <div className="row-2">
          <button className="btn-quiet" onClick={() => onDone(rep, holdSeconds)}>End set</button>
          <button className="btn-quiet" onClick={togglePause}>{pausedLeft === null ? 'Pause' : 'Resume'}</button>
        </div>
      </div>
    </>
  )
}

/** Rep exercises: tap to count, or auto pace with a tempo. */
function RepCounter({
  target,
  lowerSeconds,
  onDone,
}: {
  target: { min: number; max: number; label: string }
  lowerSeconds?: number
  onDone: (reps: number) => void
}) {
  const [count, setCount] = useState(0)
  const [auto, setAuto] = useState(false)
  const [autoPhase, setAutoPhase] = useState<{ p: 'lift' | 'lower'; endsAt: number }>({ p: 'lift', endsAt: 0 })
  const now = useNow(auto)
  const lower = lowerSeconds ?? AUTO_DEFAULT_LOWER_SECONDS

  useEffect(() => {
    if (!auto || now < autoPhase.endsAt) return
    if (autoPhase.p === 'lift') {
      cue.tick()
      setAutoPhase({ p: 'lower', endsAt: Date.now() + lower * 1000 })
    } else {
      const n = count + 1
      setCount(n)
      if (n >= target.min) {
        setAuto(false)
        cue.done()
        return
      }
      cue.tick()
      setAutoPhase({ p: 'lift', endsAt: Date.now() + AUTO_LIFT_SECONDS * 1000 })
    }
  }, [auto, now, autoPhase, count, target.min, lower])

  function startAuto() {
    unlockAudio()
    cue.tick()
    setAutoPhase({ p: 'lift', endsAt: Date.now() + AUTO_LIFT_SECONDS * 1000 })
    setAuto(true)
  }

  const lowerLeft = secondsLeft(autoPhase.endsAt, now)
  const reached = count >= target.min

  return (
    <>
      <button
        className="readout tap-zone"
        onClick={() => {
          if (auto) return
          setCount((c) => c + 1)
          navigator.vibrate?.(15)
        }}
        aria-label={`Count a rep. ${count} of ${target.label} done.`}
      >
        <span className="readout-big mono">
          {pad2(count)}
          <span className="readout-of">/{target.label}</span>
        </span>
        {auto ? (
          <span className="readout-tempo mono">
            {autoPhase.p === 'lift' ? 'LIFT' : `LOWER ${lowerLeft}`}
          </span>
        ) : lowerSeconds ? (
          <span className="readout-tempo mono">LOWER {Array.from({ length: lowerSeconds }, (_, i) => lowerSeconds - i).join(' · ')}</span>
        ) : null}
        <span className="label">{auto ? 'Auto pace on' : reached ? 'Target reached' : 'Tap for each rep'}</span>
      </button>
      <div className="bottom-action player-actions">
        <div className="row-3">
          <button className="btn-quiet" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="Undo one rep">
            −1
          </button>
          <button className="btn-quiet" aria-pressed={auto} onClick={() => (auto ? setAuto(false) : startAuto())}>
            {auto ? 'Stop auto' : 'Auto'}
          </button>
          <button className={reached ? 'btn-solid' : 'btn-quiet'} onClick={() => { setAuto(false); onDone(count) }}>
            Set done
          </button>
        </div>
      </div>
    </>
  )
}

/** Lacrosse ball: countdown per spot, with time to move the ball between spots. */
function SpotTimer({
  spots,
  range,
  onDone,
}: {
  spots: string[]
  range: { min: number; max: number }
  onDone: (seconds: number[]) => void
}) {
  const [i, setI] = useState(0)
  const [running, setRunning] = useState(false)
  const [endsAt, setEndsAt] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [spent, setSpent] = useState<number[]>([])
  const [between, setBetween] = useState(false)
  const now = useNow(running, 250)
  const left = running ? secondsLeft(endsAt, now) : range.min

  useEffect(() => {
    if (running && now >= endsAt) endSpot()
  })

  function start() {
    unlockAudio()
    cue.go()
    const t = Date.now()
    setStartedAt(t)
    setEndsAt(t + range.min * 1000)
    setBetween(false)
    setRunning(true)
  }

  function endSpot() {
    setRunning(false)
    const s = [...spent, Math.round((Date.now() - startedAt) / 1000)]
    setSpent(s)
    if (i + 1 < spots.length) {
      cue.done()
      setI(i + 1)
      setBetween(true)
    } else {
      onDone(s)
    }
  }

  const canAdd = running && (endsAt - startedAt) / 1000 + 30 <= range.max

  return (
    <>
      <p className="label set-label">
        Spot {i + 1}/{spots.length}
      </p>
      <div className={`readout ${running ? 'readout-live' : ''}`} aria-live="polite">
        <p className="readout-word cap">{between ? `Move the ball: ${spots[i]}` : spots[i]}</p>
        <p className="readout-big mono">
          {Math.floor(left / 60)}:{pad2(left % 60)}
        </p>
        <p className="label">
          {range.min}-{range.max} sec per spot
        </p>
      </div>
      <div className="bottom-action player-actions">
        {running ? (
          <div className="row-2">
            <button className="btn-quiet" disabled={!canAdd} onClick={() => setEndsAt(endsAt + 30000)}>
              +30 sec
            </button>
            <button className="btn-quiet" onClick={endSpot}>Done with spot</button>
          </div>
        ) : (
          <button className="btn-primary" onClick={start}>
            {between ? 'Start next spot ▶' : 'Start ▶'}
          </button>
        )}
      </div>
    </>
  )
}

function LogSet({
  ex,
  rx,
  setIndex,
  reps,
  onSave,
}: {
  ex: Exercise
  rx: Prescription
  setIndex: number
  reps: number
  onSave: (reps: number, load: string | undefined, effort: Effort) => void
}) {
  const [n, setN] = useState(reps)
  const [load, setLoad] = useState(rx.load)
  const showLoad = rx.load !== 'none' && rx.load !== 'bodyweight'

  useEffect(() => {
    if (!showLoad) return
    let alive = true
    void lastLoad(ex.id).then((l) => alive && l && setLoad(l))
    return () => {
      alive = false
    }
  }, [ex.id, showLoad])

  return (
    <div className="log">
      <p className="label">
        Set {setIndex + 1}/{rx.sets} done
      </p>
      <div className="stepper">
        <button className="btn-quiet" onClick={() => setN(Math.max(0, n - 1))} aria-label="One fewer rep">−</button>
        <span className="mono stepper-value" aria-live="polite">
          {n} <span className="muted">reps</span>
        </span>
        <button className="btn-quiet" onClick={() => setN(n + 1)} aria-label="One more rep">+</button>
      </div>
      {showLoad && (
        <label className="field">
          <span className="label">Load</span>
          <input value={load} onChange={(e) => setLoad(e.target.value)} />
        </label>
      )}
      <p className="label">How did it feel?</p>
      <div className="bottom-action player-actions">
        <div className="row-3">
          {(['easy', 'right', 'hard'] as Effort[]).map((e) => (
            <button key={e} className="btn-effort" onClick={() => onSave(n, showLoad ? load : rx.load, e)}>
              {e === 'right' ? 'Just right' : e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Rest({
  left,
  next,
  onAdjust,
  onSkip,
  onMoveOn,
}: {
  left: number
  next: string
  onAdjust: (d: number) => void
  onSkip: () => void
  onMoveOn: () => void
}) {
  return (
    <>
      <div className="readout" aria-live="polite">
        <p className="readout-word">Rest</p>
        <p className="readout-big mono">
          {Math.floor(left / 60)}:{pad2(left % 60)}
        </p>
        <p className="label">Next: {next}</p>
      </div>
      <div className="bottom-action player-actions">
        <div className="row-3">
          <button className="btn-quiet" onClick={() => onAdjust(-15)}>−15</button>
          <button className="btn-quiet" onClick={() => onAdjust(15)}>+15</button>
          <button className="btn-quiet" onClick={onSkip}>Skip rest</button>
        </div>
        <button className="btn-quiet wide" onClick={onMoveOn}>Enough sets, next exercise</button>
      </div>
    </>
  )
}

function Finished({
  queue,
  logs,
  quick,
  stoppedEarly,
}: {
  queue: Exercise[]
  logs: SetLog[]
  quick: boolean
  stoppedEarly: boolean
}) {
  const did = queue.filter((e) => logs.some((l) => l.exerciseId === e.id && !l.skipped))
  const title = quick ? 'Logged' : stoppedEarly ? 'Saved' : 'Session done'
  return (
    <div className="player finished">
      <p className="label">{quick ? 'Chin nods' : `${pad2(did.length)}/${pad2(queue.length)} exercises`}</p>
      <h1>{title}</h1>
      {!quick && (
        <ul className="check-list">
          {queue.map((e, i) => {
            const d = did.includes(e)
            return (
              <li key={e.id} className={d ? 'check-row' : 'check-row done'}>
                <span className="row-index">{pad2(i + 1)}</span>
                <span className="check-text">
                  <span className="exercise-row-name">{e.name}</span>
                  <span className="exercise-row-dose">{d ? 'Done' : 'Not today'}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="all-done">{stoppedEarly ? 'What you did counts. It is saved.' : 'Nice work.'}</p>
      <div className="bottom-action">
        <a className="btn-primary" href={href({ name: 'today' })}>Back to Today</a>
      </div>
    </div>
  )
}

