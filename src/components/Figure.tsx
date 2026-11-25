import { useEffect, useMemo, useState } from 'react'
import type { Exercise } from '../data'
import { figureDefs } from '../figures/defs'
import { arcPoints, arrowHead, bones, cycleAt, poseAt, trailPoints } from '../figures/render'
import type { FigureDef, P, Pose, Prop, Segment } from '../figures/types'

const HEAD_R = 8

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Seconds since mount, while running. */
function useClock(running: boolean) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!running) return
    let raf = 0
    const start = performance.now() - t * 1000
    const tick = (now: number) => {
      setT((now - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // Resume from where it paused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  return t
}

function Props({ props, pose }: { props: Prop[]; pose: Pose }) {
  return (
    <>
      {props.map((p, i) => {
        switch (p.t) {
          case 'line':
            return <line key={i} x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} className="fig-prop" strokeWidth={p.w ?? 2} />
          case 'rect':
            return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} className="fig-prop-fill" />
          case 'anchor':
            return <rect key={i} x={p.c[0] - 4} y={p.c[1] - 4} width={8} height={8} className="fig-prop-solid" />
          case 'roll':
            return <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.r} className="fig-prop-solid" />
          case 'band': {
            const a = pose[p.from]
            const b = typeof p.to === 'string' ? pose[p.to] : p.to
            return a && b ? <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="fig-band" /> : null
          }
          case 'dumbbell': {
            const c = pose[p.at]
            return c ? (
              <g key={i} className="fig-equip">
                <rect x={c[0] - 7} y={c[1] - 1.5} width={14} height={3} />
                <rect x={c[0] - 8} y={c[1] - 5} width={4} height={10} />
                <rect x={c[0] + 4} y={c[1] - 5} width={4} height={10} />
              </g>
            ) : null
          }
          case 'ball': {
            const c = pose[p.at]
            return c ? <circle key={i} cx={c[0] + p.dx} cy={c[1] + p.dy} r={p.r} className="fig-equip" /> : null
          }
        }
      })}
    </>
  )
}

type Tone = 'on' | 'far' | ''

const pts = (ps: P[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

/** Box around a segment, wa wide at a and wb wide at b (half widths). */
function quad(a: P, b: P, wa: number, wb: number): P[] {
  const an = Math.atan2(b[1] - a[1], b[0] - a[0])
  const nx = -Math.sin(an)
  const ny = Math.cos(an)
  return [
    [a[0] + nx * wa, a[1] + ny * wa],
    [b[0] + nx * wb, b[1] + ny * wb],
    [b[0] - nx * wb, b[1] - ny * wb],
    [a[0] - nx * wa, a[1] - ny * wa],
  ]
}

const toward = (a: P, b: P, d: number): P => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [a[0] + ((b[0] - a[0]) / l) * d, a[1] + ((b[1] - a[1]) / l) * d]
}

function Seg({ a, b, tone }: { a?: P; b?: P; tone: Tone }) {
  if (!a || !b) return null
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={`fig-line ${tone}`} />
}

function Joint({ at, r = 2.6, tone }: { at?: P; r?: number; tone: Tone }) {
  if (!at) return null
  return <circle cx={at[0]} cy={at[1]} r={r} className={`fig-joint ${tone}`} />
}

/**
 * Simple mitt, pointing along the forearm. The thumb sits on the front of
 * the hand: forward when the arm hangs, up when it reaches forward, back
 * when it is overhead. In front view, thumbs point up.
 */
function Glove({ wrist, elbow, tone, dir, front }: { wrist?: P; elbow?: P; tone: Tone; dir: 1 | -1; front: boolean }) {
  if (!wrist || !elbow) return null
  const an = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0])
  const dx = Math.cos(an)
  const dy = Math.sin(an)
  const c: P = [wrist[0] + dx * 6, wrist[1] + dy * 6]
  // Where the thumb should point.
  let thumb: P = dir === 1 ? [dy, -dx] : [-dy, dx]
  if (front) thumb = dx >= 0 ? [dy, -dx] : [-dy, dx]
  // The mitt's thumb is drawn on its local +y side; flip it if that is the wrong side.
  const localY: P = [-dy, dx]
  const flip = thumb[0] * localY[0] + thumb[1] * localY[1] < 0
  return (
    <path
      transform={`translate(${c[0].toFixed(1)},${c[1].toFixed(1)}) rotate(${((an * 180) / Math.PI).toFixed(1)})${flip ? ' scale(1,-1)' : ''}`}
      d="M-3.5,-3.2 L2.8,-3.2 Q4.2,-3.2 4.2,-1.6 L4.2,1.8 Q4.2,3.4 2.6,3.4 L-3.5,3.4 Z M-0.6,3.4 L1.6,6.2"
      className={`fig-shape ${tone}`}
    />
  )
}

/** Dashed outline of the start pose, for still figures. */
function Ghost({ pose }: { pose: Pose }) {
  return (
    <g className="fig-ghost">
      {bones(pose).map((b) => (
        <line key={b.key} x1={b.a[0]} y1={b.a[1]} x2={b.b[0]} y2={b.b[1]} />
      ))}
      <circle cx={pose.head[0]} cy={pose.head[1]} r={HEAD_R} />
    </g>
  )
}

/**
 * Jointed mannequin: outlined torso and hips, thin limbs, hollow joints,
 * glove hands. The moving limbs and their joints are red.
 */
function Body({ def, pose }: { def: FigureDef; pose: Pose }) {
  const tone = (seg: Segment): Tone => (def.active.includes(seg) ? 'on' : !def.front && /2$/.test(seg) ? 'far' : '')
  const p = pose
  const dir = def.facing === 'left' ? -1 : 1
  const front = Boolean(def.front)

  // Shoulders: their own joints in front view, just below the neck in side view.
  const sh = p.sh ?? toward(p.neck, p.hip, 3)
  const sh2 = p.sh2 ?? sh
  const waist = toward(p.hip, p.neck, 3)
  const torso = quad(waist, p.neck, front ? 8 : 5, front ? 11 : 7)
  const pelvis = quad(toward(p.hip, p.neck, -3.5), toward(p.hip, p.neck, 4), front ? 9 : 6.5, front ? 9 : 6.5)

  const foot = (knee?: P, ankle?: P, t: Tone = '') => {
    if (!knee || !ankle) return null
    if (Math.abs(ankle[0] - knee[0]) > Math.abs(ankle[1] - knee[1])) return null // shin lying flat
    return <Seg a={ankle} b={[ankle[0] + dir * 6, ankle[1]]} tone={t} />
  }
  const headTone: Tone = def.active.includes('head') ? 'on' : ''
  const neckBase = toward(p.head, p.neck, HEAD_R)

  return (
    <g>
      {/* Far side */}
      <Seg a={p.hip} b={p.knee2} tone={tone('thigh2')} />
      <Seg a={p.knee2} b={p.foot2} tone={tone('shin2')} />
      {foot(p.knee2, p.foot2, tone('shin2'))}
      <Joint at={p.knee2} tone={tone('thigh2')} />
      <Seg a={sh2} b={p.elbow2} tone={tone('uarm2')} />
      <Seg a={p.elbow2} b={p.hand2} tone={tone('farm2')} />
      <Glove wrist={p.hand2} elbow={p.elbow2} tone={tone('farm2')} dir={dir} front={front} />
      <Joint at={p.elbow2} tone={tone('uarm2')} />
      <Joint at={p.hand2} r={2.2} tone={tone('farm2')} />

      {/* Near legs */}
      <Seg a={p.hip} b={p.knee} tone={tone('thigh')} />
      <Seg a={p.knee} b={p.foot} tone={tone('shin')} />
      {foot(p.knee, p.foot, tone('shin'))}
      <Joint at={p.knee} tone={tone('thigh')} />
      <Joint at={p.foot} r={2.2} tone={tone('shin')} />

      {/* Torso, hips, head */}
      <polygon points={pts(torso)} className={`fig-shape ${tone('torso')}`} />
      <polygon points={pts(pelvis)} className={`fig-shape ${tone('torso')}`} />
      <Joint at={p.hip} r={2.4} tone={tone('thigh')} />
      <Seg a={p.neck} b={neckBase} tone={headTone} />
      <circle cx={p.head[0]} cy={p.head[1]} r={HEAD_R} className={`fig-shape ${headTone}`} />
      {def.gaze && <Gaze head={p.head} dir={def.gaze === 'right' ? 1 : -1} />}
      {front && <Joint at={sh2} r={3} tone={tone('uarm2')} />}

      {/* Near arm, in front of everything */}
      <Seg a={sh} b={p.elbow} tone={tone('uarm')} />
      <Seg a={p.elbow} b={p.hand} tone={tone('farm')} />
      <Glove wrist={p.hand} elbow={p.elbow} tone={tone('farm')} dir={dir} front={front} />
      <Joint at={sh} r={3} tone={tone('uarm')} />
      <Joint at={p.elbow} tone={tone('uarm')} />
      <Joint at={p.hand} r={2.2} tone={tone('farm')} />
    </g>
  )
}

/** Eye plus a level line of sight, so you can see the head does not tip. */
function Gaze({ head, dir }: { head: P; dir: 1 | -1 }) {
  const eyeY = head[1] - 1
  const eyeX = head[0] + dir * 3
  const x0 = head[0] + dir * (HEAD_R + 3)
  const x1 = x0 + dir * 26
  return (
    <g>
      <rect x={eyeX - 1.5} y={eyeY - 1.5} width={3} height={3} className="fig-eye" />
      <line x1={x0} y1={eyeY} x2={x1} y2={eyeY} className="fig-gaze" />
    </g>
  )
}

/** Grey dashed arrows: arcs around rotating joints, straight arrows for slides. */
function Arrows({ def, pose }: { def: FigureDef; pose: Pose }) {
  const paths: { pts: P[]; both?: boolean }[] = []
  for (const arc of def.arcs ?? []) {
    const c = pose[arc.around]
    if (c) paths.push({ pts: arcPoints(def, arc, c) })
  }
  for (const tr of def.trails) paths.push({ pts: trailPoints(def, tr), both: tr.both })
  return (
    <g className="fig-arrow">
      {paths.map(({ pts: ps, both }, i) =>
        ps.length < 3 ? null : (
          <g key={i}>
            <path d={'M' + pts(ps).replaceAll(' ', 'L')} className="fig-arrow-line" />
            <path d={arrowHead(ps[ps.length - 3], ps[ps.length - 1], 4.5)} className="fig-arrow-head" />
            {both && <path d={arrowHead(ps[2], ps[0], 4.5)} className="fig-arrow-head" />}
          </g>
        ),
      )}
    </g>
  )
}

/**
 * Exercise figure. Large figures animate start to end and back (tap to pause).
 * Small figures and reduced-motion show the end position, the start as a
 * dashed ghost, and the path of motion.
 */
export function Figure({ exercise, size = 'large' }: { exercise: Exercise; size?: 'small' | 'large' }) {
  const def = figureDefs[exercise.id]
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const animated = size === 'large' && !reduced
  const t = useClock(animated && !paused)
  const ghostA = useMemo(() => (def ? poseAt(def, 0) : null), [def])
  const poseB = useMemo(() => (def ? poseAt(def, 1) : null), [def])

  if (!def || !ghostA || !poseB) return null

  const viewBox = '0 0 160 120'

  if (!animated) {
    return (
      <svg className={`figure figure-${size}`} viewBox={viewBox} aria-hidden="true">
        <Props props={def.props} pose={poseB} />
        <Ghost pose={ghostA} />
        <Body def={def} pose={poseB} />
        <Arrows def={def} pose={poseB} />
      </svg>
    )
  }

  const { mix, phase } = cycleAt(def, t)
  const pose = poseAt(def, mix)
  const label = def.labels[phase]

  return (
    <div className="figure-anim">
      <svg className={`figure figure-${size}`} viewBox={viewBox} aria-hidden="true">
        <Props props={def.props} pose={pose} />
        <Body def={def} pose={pose} />
        <Arrows def={def} pose={pose} />
      </svg>
      <div className="figure-caption">
        <span className="label figure-phase" aria-hidden="true">
          {label || ' '}
        </span>
        <button
          className="figure-toggle"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
          aria-label={paused ? 'Play the movement animation' : 'Pause the movement animation'}
        >
          {paused ? '▶ Play' : '❚❚ Pause'}
        </button>
      </div>
    </div>
  )
}
