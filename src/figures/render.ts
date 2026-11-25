import type { FigureDef, Joint, P, Pose, Segment } from './types'

// Joints in parent-first order. Each joint is placed relative to its parent,
// so interpolating angle and length keeps limbs from shrinking mid-move.
const ORDER: Joint[] = ['hip', 'neck', 'head', 'sh', 'sh2', 'elbow', 'hand', 'elbow2', 'hand2', 'knee', 'foot', 'knee2', 'foot2']

function parentOf(j: Joint, pose: Pose): Joint | null {
  switch (j) {
    case 'hip':
      return null
    case 'neck':
      return 'hip'
    case 'head':
    case 'sh':
    case 'sh2':
      return 'neck'
    case 'elbow':
      return pose.sh ? 'sh' : 'neck'
    case 'elbow2':
      return pose.sh2 ? 'sh2' : 'neck'
    case 'hand':
      return 'elbow'
    case 'hand2':
      return 'elbow2'
    case 'knee':
    case 'knee2':
      return 'hip'
    case 'foot':
      return 'knee'
    case 'foot2':
      return 'knee2'
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function lerpAngle(a: number, b: number, t: number) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

/** Pose at mix t (0 = start pose, 1 = end pose). */
export function poseAt(def: FigureDef, t: number): Pose {
  const { a, b } = def
  const out = {} as Pose
  for (const j of ORDER) {
    const pa = a[j]
    const pb = b[j] ?? pa
    if (!pa || !pb) continue
    const parent = parentOf(j, a)
    if (!parent || !a[parent] || !b[parent] || !out[parent] || def.linear?.includes(j)) {
      out[j] = [lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t)]
      continue
    }
    const qa = a[parent]!
    const qb = b[parent]!
    const angA = Math.atan2(pa[1] - qa[1], pa[0] - qa[0])
    const angB = Math.atan2(pb[1] - qb[1], pb[0] - qb[0])
    const lenA = Math.hypot(pa[0] - qa[0], pa[1] - qa[1])
    const lenB = Math.hypot(pb[0] - qb[0], pb[1] - qb[1])
    const ang = lerpAngle(angA, angB, t)
    const len = lerp(lenA, lenB, t)
    const o = out[parent]!
    out[j] = [o[0] + Math.cos(ang) * len, o[1] + Math.sin(ang) * len]
  }
  return out
}

export interface Bone {
  key: Segment
  a: P
  b: P
}

export function bones(p: Pose): Bone[] {
  const list: Bone[] = []
  const add = (key: Segment, a?: P, b?: P) => a && b && list.push({ key, a, b })
  // Far side first so the near side draws on top.
  add('uarm2', p.sh2 ?? p.neck, p.elbow2)
  add('farm2', p.elbow2, p.hand2)
  add('thigh2', p.hip, p.knee2)
  add('shin2', p.knee2, p.foot2)
  add('torso', p.hip, p.neck)
  add('head', p.neck, p.head)
  add('shoulders', p.sh, p.sh2)
  add('thigh', p.hip, p.knee)
  add('shin', p.knee, p.foot)
  add('uarm', p.sh ?? p.neck, p.elbow)
  add('farm', p.elbow, p.hand)
  return list
}

/** Smooth start and stop. */
export const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2

/** Where in the cycle we are: pose mix (0..1) and which of the 4 phases. */
export function cycleAt(def: FigureDef, seconds: number): { mix: number; phase: 0 | 1 | 2 | 3 } {
  const [up, hold, down, rest] = def.timing
  const total = up + hold + down + rest
  let s = seconds % total
  if (s < up) return { mix: ease(s / up), phase: 0 }
  s -= up
  if (s < hold) return { mix: 1, phase: 1 }
  s -= hold
  if (s < down) return { mix: 1 - ease(s / down), phase: 2 }
  return { mix: 0, phase: 3 }
}

/** Points along a joint's path from start to end, for the motion trail. */
export function trailPoints(def: FigureDef, trail: FigureDef['trails'][number], steps = 24): P[] {
  const pts: P[] = []
  for (let i = 0; i <= steps; i++) {
    const pose = poseAt(def, i / steps)
    let p = pose[trail.joint]
    if (!p) continue
    if (trail.from && trail.scale && pose[trail.from]) {
      const o = pose[trail.from]!
      p = [o[0] + (p[0] - o[0]) * trail.scale, o[1] + (p[1] - o[1]) * trail.scale]
    }
    pts.push([p[0] + (trail.dx ?? 0), p[1] + (trail.dy ?? 0)])
  }
  return pts
}

export function arrowHead(from: P, to: P, size = 5): string {
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0])
  const l: P = [to[0] - size * Math.cos(ang - 0.5), to[1] - size * Math.sin(ang - 0.5)]
  const r: P = [to[0] - size * Math.cos(ang + 0.5), to[1] - size * Math.sin(ang + 0.5)]
  return `M${l[0]},${l[1]}L${to[0]},${to[1]}L${r[0]},${r[1]}`
}

/** Points of a rotation arc around a joint, following another joint's swing from start to end. */
export function arcPoints(def: FigureDef, arc: { around: Joint; of: Joint; r: number }, center: P, steps = 24): P[] {
  const { a, b } = def
  const ca = a[arc.around]
  const cb = b[arc.around] ?? ca
  const pa = a[arc.of]
  const pb = b[arc.of] ?? pa
  if (!ca || !cb || !pa || !pb) return []
  const angA = Math.atan2(pa[1] - ca[1], pa[0] - ca[0])
  const angB = Math.atan2(pb[1] - cb[1], pb[0] - cb[0])
  const pts: P[] = []
  for (let i = 0; i <= steps; i++) {
    const ang = lerpAngle(angA, angB, i / steps)
    pts.push([center[0] + Math.cos(ang) * arc.r, center[1] + Math.sin(ang) * arc.r])
  }
  return pts
}
