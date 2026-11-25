export type P = [number, number]

export type Joint =
  | 'hip'
  | 'neck'
  | 'head'
  | 'sh'
  | 'sh2'
  | 'elbow'
  | 'hand'
  | 'elbow2'
  | 'hand2'
  | 'knee'
  | 'foot'
  | 'knee2'
  | 'foot2'

export type Pose = Partial<Record<Joint, P>> & { hip: P; neck: P; head: P }

export type Segment =
  | 'torso'
  | 'head'
  | 'shoulders'
  | 'uarm'
  | 'farm'
  | 'uarm2'
  | 'farm2'
  | 'thigh'
  | 'shin'
  | 'thigh2'
  | 'shin2'

/** Static scenery and equipment. Joint-attached props move with the body. */
export type Prop =
  | { t: 'line'; a: P; b: P; w?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number }
  | { t: 'anchor'; c: P }
  | { t: 'roll'; c: P; r: number }
  | { t: 'band'; from: Joint; to: P | Joint }
  | { t: 'dumbbell'; at: Joint }
  | { t: 'ball'; at: Joint; dx: number; dy: number; r: number }

export interface Trail {
  joint: Joint
  dx?: number
  dy?: number
  /** Draw the arc farther out from this joint, so it does not sit on the limb. */
  from?: Joint
  scale?: number
  /** Arrowheads at both ends (back-and-forth motion). */
  both?: boolean
}

/** Red rotation arrow: an arc around one joint, following another joint's swing. */
export interface Arc {
  around: Joint
  of: Joint
  r: number
}

export interface FigureDef {
  /** Start position. */
  a: Pose
  /** End position (the work). */
  b: Pose
  props: Prop[]
  /** Segments drawn in signal red: the part that moves. */
  active: Segment[]
  /** Straight arrows for movements that slide rather than rotate. */
  trails: Trail[]
  /** Curved arrows around the joints that rotate. */
  arcs?: Arc[]
  /** Which way the figure faces, for the feet. */
  facing?: 'left' | 'right'
  /** Seconds: move to end, hold, move back, rest. */
  timing: [number, number, number, number]
  /** Words shown for each of the four timing phases. */
  labels: [string, string, string, string]
  /** Front view: both arms are equally near, so the far side is not dimmed. */
  front?: boolean
  /** Draw the torso at full shoulder width, e.g. lying on the side with shoulders stacked. */
  wide?: boolean
  /** Joints that slide in a straight line instead of rotating around their parent. */
  linear?: Joint[]
  /** Draw an eye and a level line of sight, facing this way. */
  gaze?: 'left' | 'right'
}
