// Poses for each exercise on a 160 x 120 canvas, y pointing down.
// Each figure moves from pose a (start) to pose b (the work) and back.
// Based on the original drawings in reference/figure-source/figs.py.
import type { FigureDef, Pose, Prop } from './types'

const floor = (y = 110, x0 = 4, x1 = 156): Prop => ({ t: 'line', a: [x0, y], b: [x1, y], w: 2 })
const wall = (x: number): Prop => ({ t: 'line', a: [x, 4], b: [x, 110], w: 3 })

/** Side view chair: seat, back, two legs. */
function chair(x0: number, x1: number, seatY = 78, backTop = 46): Prop[] {
  return [
    { t: 'line', a: [x0, seatY], b: [x1, seatY], w: 3 },
    { t: 'line', a: [x0, seatY], b: [x0, backTop], w: 3 },
    { t: 'line', a: [x0 + 4, seatY], b: [x0 + 4, 110], w: 2 },
    { t: 'line', a: [x1 - 4, seatY], b: [x1 - 4, 110], w: 2 },
  ]
}

/** Incline bench, pad rising to the right. */
const bench: Prop[] = [
  floor(),
  { t: 'line', a: [44, 104], b: [112, 52], w: 6 },
  { t: 'line', a: [46, 104], b: [46, 110], w: 2 },
  { t: 'line', a: [108, 56], b: [116, 110], w: 2 },
]

// Body on the bench, chest down, head past the top of the pad.
const onBench: Pose = {
  hip: [53, 88],
  neck: [98, 54],
  head: [108, 46],
  knee: [36, 96],
  foot: [40, 110],
}

// Seated, facing right.
const seated: Pose = {
  hip: [60, 74],
  neck: [60, 42],
  head: [61, 29],
  knee: [92, 74],
  foot: [92, 108],
}

export const figureDefs: Record<string, FigureDef> = {
  chin_nod: {
    props: [floor(), ...chair(48, 86)],
    // Forward head to ears over shoulders: the head slides straight back,
    // eyes level, no tipping. Torso and shoulders stay still.
    a: { ...seated, head: [71, 29], elbow: [68, 58], hand: [84, 66] },
    b: { ...seated, elbow: [68, 58], hand: [84, 66] },
    linear: ['head'],
    gaze: 'right',
    active: ['head'],
    trails: [{ joint: 'head', dy: -14 }],
    timing: [1.0, 1.6, 1.0, 0.8],
    labels: ['Glide chin straight back', 'Hold, eyes level', 'Relax', ''],
  },

  band_row: {
    props: [
      floor(),
      ...chair(48, 86),
      { t: 'line', a: [150, 30], b: [150, 110], w: 3 },
      { t: 'anchor', c: [150, 54] },
      { t: 'band', from: 'hand', to: [150, 54] },
    ],
    a: { ...seated, elbow: [76, 50], hand: [94, 54] },
    b: { ...seated, elbow: [44, 56], hand: [64, 54] },
    active: ['uarm', 'farm'],
    trails: [],
    arcs: [{ around: 'neck', of: 'elbow', r: 15 }],
    timing: [1.0, 0.6, 1.6, 0.5],
    labels: ['Pull back and down', 'Squeeze', 'Return slowly', ''],
  },

  pull_apart: {
    front: true,
    props: [floor(), { t: 'band', from: 'hand', to: 'hand2' }],
    a: {
      hip: [80, 64],
      neck: [80, 32],
      head: [80, 19],
      sh: [71, 36],
      sh2: [89, 36],
      elbow: [68, 46],
      hand: [74, 44],
      elbow2: [92, 46],
      hand2: [86, 44],
      knee: [76, 87],
      foot: [74, 110],
      knee2: [84, 87],
      foot2: [86, 110],
    },
    b: {
      hip: [80, 64],
      neck: [80, 32],
      head: [80, 19],
      sh: [71, 36],
      sh2: [89, 36],
      elbow: [55, 38],
      hand: [38, 38],
      elbow2: [105, 38],
      hand2: [122, 38],
      knee: [76, 87],
      foot: [74, 110],
      knee2: [84, 87],
      foot2: [86, 110],
    },
    active: ['uarm', 'farm', 'uarm2', 'farm2'],
    trails: [],
    arcs: [
      { around: 'sh', of: 'elbow', r: 13 },
      { around: 'sh2', of: 'elbow2', r: 13 },
    ],
    timing: [1.0, 0.6, 1.2, 0.5],
    labels: ['Pull apart', 'Squeeze', 'Return', ''],
  },

  wall_slide: {
    props: [wall(30), floor(110, 30)],
    a: { hip: [60, 66], neck: [56, 34], head: [52, 23], elbow: [36, 52], hand: [33, 34], knee: [60, 88], foot: [62, 110] },
    b: { hip: [60, 66], neck: [56, 34], head: [52, 23], elbow: [36, 30], hand: [33, 10], knee: [60, 88], foot: [62, 110] },
    active: ['uarm', 'farm'],
    facing: 'left',
    trails: [],
    arcs: [{ around: 'neck', of: 'elbow', r: 14 }],
    timing: [1.4, 0.4, 1.4, 0.4],
    labels: ['Slide up', 'Shoulders low', 'Slide down', ''],
  },

  // Lying on the left side, seen from the front: shoulders and hips are
  // stacked, the head rests on the bottom arm, legs stacked. The top
  // forearm rotates from across the belly to pointing at the ceiling.
  side_lying_er: {
    wide: true,
    props: [
      { t: 'line', a: [4, 99], b: [156, 99], w: 3 },
      { t: 'roll', c: [63, 70.5], r: 3 },
      { t: 'dumbbell', at: 'hand' },
    ],
    a: {
      head: [20, 86],
      neck: [34, 85],
      hip: [94, 85],
      sh: [38, 74],
      sh2: [38, 96],
      elbow: [62, 65],
      hand: [78, 78],
      elbow2: [18, 96],
      hand2: [4, 92],
      knee: [116, 82],
      foot: [138, 88],
      knee2: [114, 95],
      foot2: [136, 97],
    },
    b: {
      head: [20, 86],
      neck: [34, 85],
      hip: [94, 85],
      sh: [38, 74],
      sh2: [38, 96],
      elbow: [62, 65],
      hand: [61, 45],
      elbow2: [18, 96],
      hand2: [4, 92],
      knee: [116, 82],
      foot: [138, 88],
      knee2: [114, 95],
      foot2: [136, 97],
    },
    active: ['farm'],
    trails: [],
    arcs: [{ around: 'elbow', of: 'hand', r: 14 }],
    timing: [1.0, 0.4, 3.0, 0.5],
    labels: ['Rotate up', 'Elbow stays on the towel', 'Lower 3, 2, 1', ''],
  },

  thoracic_ext: {
    props: [floor(), ...chair(56, 96, 78, 50)],
    a: { hip: [68, 74], neck: [66, 40], head: [70, 28], elbow: [82, 32], hand: [62, 26], knee: [96, 74], foot: [96, 108] },
    b: { hip: [68, 74], neck: [58, 42], head: [53, 30], elbow: [70, 24], hand: [48, 26], knee: [96, 74], foot: [96, 108] },
    active: ['torso', 'head'],
    trails: [],
    arcs: [{ around: 'hip', of: 'neck', r: 26 }],
    timing: [1.4, 0.8, 1.4, 0.6],
    labels: ['Lean back over the chair', '', 'Come up slowly', ''],
  },

  lacrosse_wall: {
    props: [wall(26), floor(110, 26), { t: 'ball', at: 'neck', dx: -8, dy: 12, r: 5 }],
    a: { hip: [42, 64], neck: [38, 32], head: [40, 20], elbow: [40, 50], hand: [46, 64], knee: [46, 87], foot: [48, 110] },
    b: { hip: [44, 76], neck: [40, 44], head: [42, 32], elbow: [42, 62], hand: [48, 76], knee: [58, 91], foot: [48, 110] },
    trails: [{ joint: 'neck', dx: -20, dy: 12, both: true }],
    active: ['thigh', 'shin'],
    timing: [1.6, 0.3, 1.6, 0.3],
    labels: ['Tiny, slow movements', '', 'Tiny, slow movements', ''],
  },

  incline_row: {
    props: [...bench, { t: 'dumbbell', at: 'hand' }],
    a: { ...onBench, elbow: [100, 72], hand: [100, 90] },
    b: { ...onBench, elbow: [88, 39], hand: [90, 57] },
    active: ['uarm', 'farm'],
    trails: [],
    arcs: [{ around: 'neck', of: 'elbow', r: 13 }],
    timing: [1.0, 0.5, 3.0, 0.5],
    labels: ['Row up', 'Squeeze', 'Lower 3, 2, 1', ''],
  },

  face_pull: {
    props: [
      floor(),
      { t: 'line', a: [14, 14], b: [14, 110], w: 3 },
      { t: 'anchor', c: [14, 30] },
      { t: 'band', from: 'hand', to: [14, 30] },
    ],
    a: { hip: [112, 64], neck: [110, 31], head: [108, 19], elbow: [94, 34], hand: [76, 32], knee: [112, 87], foot: [114, 110] },
    b: { hip: [112, 64], neck: [110, 31], head: [108, 19], elbow: [120, 26], hand: [100, 20], knee: [112, 87], foot: [114, 110] },
    active: ['uarm', 'farm'],
    facing: 'left',
    trails: [],
    arcs: [{ around: 'neck', of: 'elbow', r: 13 }],
    timing: [1.0, 0.6, 1.4, 0.5],
    labels: ['Pull toward forehead, elbows high', 'Pause', 'Return slowly', ''],
  },

  y_raise: {
    props: [...bench, { t: 'dumbbell', at: 'hand' }],
    a: { ...onBench, elbow: [100, 72], hand: [100, 90] },
    b: { ...onBench, elbow: [112, 42], hand: [124, 31] },
    active: ['uarm', 'farm'],
    trails: [],
    arcs: [{ around: 'neck', of: 'hand', r: 20 }],
    timing: [1.2, 0.6, 1.6, 0.5],
    labels: ['Raise to a Y', 'Thumbs up', 'Lower', ''],
  },

  bird_dog: {
    props: [floor(104)],
    a: {
      head: [32, 62],
      neck: [42, 66],
      hip: [94, 70],
      elbow: [45, 82],
      hand: [46, 97],
      elbow2: [43, 82],
      hand2: [44, 97],
      knee: [96, 104],
      foot: [120, 104],
      knee2: [92, 104],
      foot2: [116, 104],
    },
    b: {
      head: [32, 62],
      neck: [42, 66],
      hip: [94, 70],
      elbow: [24, 58],
      hand: [8, 52],
      elbow2: [43, 82],
      hand2: [44, 97],
      knee: [128, 66],
      foot: [154, 62],
      knee2: [92, 104],
      foot2: [116, 104],
    },
    active: ['uarm', 'farm', 'thigh', 'shin'],
    facing: 'left',
    trails: [],
    arcs: [
      { around: 'neck', of: 'elbow', r: 13 },
      { around: 'hip', of: 'knee', r: 15 },
    ],
    timing: [1.2, 1.2, 1.2, 0.6],
    labels: ['Reach long', 'Hold', 'Return', ''],
  },

  plus_pushup: {
    props: [wall(138), floor(110, 4, 138)],
    a: { foot: [62, 110], knee: [77, 95], hip: [92, 79], neck: [122, 48], head: [129, 40], elbow: [126, 66], hand: [136, 52] },
    b: { foot: [62, 110], knee: [73, 94], hip: [84, 77], neck: [106, 44], head: [113, 36], elbow: [121, 48], hand: [136, 52] },
    active: ['uarm', 'farm'],
    trails: [{ joint: 'neck', dy: -18 }],
    timing: [1.2, 1.0, 1.4, 0.5],
    labels: ['Push, then spread the blades', 'Hold', 'Lower', ''],
  },
}
