import { useEffect, useMemo, useState } from 'react'
import type { Exercise } from '../data'
import { figureDefs } from '../figures/defs'
import { arrowHead, bones, cycleAt, poseAt, trailPoints } from '../figures/render'
import type { FigureDef, P, Pose, Prop } from '../figures/types'

const HEAD_R = 7

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

function Body({ def, pose, ghost }: { def: FigureDef; pose: Pose; ghost?: boolean }) {
  const list = bones(pose)
  const headActive = def.active.includes('head')
  const line = (b: (typeof list)[number]) => {
    const far = !def.front && /2$/.test(b.key)
    const cls = ghost ? '' : def.active.includes(b.key) ? 'fig-active' : far ? 'fig-far' : 'fig-body'
    return <line key={b.key} x1={b.a[0]} y1={b.a[1]} x2={b.b[0]} y2={b.b[1]} className={cls} />
  }
  // The near arm draws in front of the head (it crosses the face in face pulls and Y raises).
  const nearArm = (k: string) => k === 'uarm' || k === 'farm'
  return (
    <g className={ghost ? 'fig-ghost' : undefined}>
      {list.filter((b) => !nearArm(b.key)).map(line)}
      <circle
        cx={pose.head[0]}
        cy={pose.head[1]}
        r={HEAD_R}
        className={ghost ? 'fig-head-ghost' : headActive ? 'fig-head fig-head-active' : 'fig-head'}
      />
      {def.gaze && !ghost && <Gaze head={pose.head} dir={def.gaze === 'right' ? 1 : -1} />}
      {list.filter((b) => nearArm(b.key)).map(line)}
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

function Trails({ def, faint }: { def: FigureDef; faint?: boolean }) {
  return (
    <g className={faint ? 'fig-trail faint' : 'fig-trail'}>
      {def.trails.map((tr, i) => {
        const pts = trailPoints(def, tr)
        if (pts.length < 2) return null
        const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')
        const end = pts[pts.length - 1]
        const before = pts[pts.length - 3] ?? pts[0]
        const start = pts[0]
        const after = pts[2] ?? pts[1]
        return (
          <g key={i}>
            <path d={d} className="fig-trail-line" />
            <path d={arrowHead(before as P, end)} className="fig-trail-head" />
            {tr.both && <path d={arrowHead(after as P, start)} className="fig-trail-head" />}
          </g>
        )
      })}
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
        <Body def={def} pose={ghostA} ghost />
        <Trails def={def} />
        <Body def={def} pose={poseB} />
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
        <Trails def={def} faint />
        <Body def={def} pose={pose} />
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
