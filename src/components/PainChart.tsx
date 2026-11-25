import { useRef, useState } from 'react'
import type { CheckIn } from '../db'
import { addDays, daysBetween, fromKey, shortDate } from '../lib/plan'

const W = 358
const PAD_L = 26
const PAD_R = 10
const PLOT_TOP = 10
const PLOT_H = 130
const STRIP_TOP = PLOT_TOP + PLOT_H + 26
const ROW_H = 22
const H = STRIP_TOP + ROW_H * 2 + 24

/**
 * Right neck and shoulder pain (0-10) as a line, with headache and arm symptom
 * days on strips below sharing the same time axis. One series, so no legend box.
 * Symptoms are told apart by shape and fill, never color alone.
 */
export function PainChart({ checkIns, end, days }: { checkIns: CheckIn[]; end: Date; days: number }) {
  const start = addDays(end, -(days - 1))
  const plotW = W - PAD_L - PAD_R
  const x = (d: Date) => PAD_L + (daysBetween(start, d) / (days - 1)) * plotW
  const y = (pain: number) => PLOT_TOP + PLOT_H - (pain / 10) * PLOT_H

  const pts = checkIns
    .map((c) => ({ c, d: fromKey(c.date) }))
    .filter(({ d }) => daysBetween(start, d) >= 0 && daysBetween(d, end) >= 0)
    .sort((a, b) => a.d.getTime() - b.d.getTime())

  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  function onPointer(e: React.PointerEvent) {
    const svg = svgRef.current
    if (!svg || pts.length === 0) return
    const r = svg.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    pts.forEach((p, i) => {
      if (Math.abs(x(p.d) - px) < Math.abs(x(pts[best].d) - px)) best = i
    })
    setHover(best)
  }

  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.c.painRightNeckShoulder).toFixed(1)}`).join('')
  // Date labels every two weeks, counted back from today so the last label is today.
  const ticks = Array.from({ length: Math.floor((days - 1) / 14) + 1 }, (_, i) => addDays(end, -i * 14)).reverse()
  const h = hover !== null ? pts[hover] : null

  return (
    <div className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Pain over the last ${days} days. ${pts.length} check-ins. Table below.`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        {/* Recessive grid: 0, 5, 10 */}
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} className="grid" />
            <text x={PAD_L - 6} y={y(v) + 4} className="axis" textAnchor="end">{v}</text>
          </g>
        ))}
        {ticks.map((t, i) => (
          <text key={t.getTime()} x={x(t)} y={H - 6} className="axis" textAnchor={i === ticks.length - 1 ? 'end' : 'middle'}>
            {i === ticks.length - 1 ? 'Today' : shortDate(t)}
          </text>
        ))}

        {h && <line x1={x(h.d)} x2={x(h.d)} y1={PLOT_TOP} y2={STRIP_TOP + ROW_H * 2} className="crosshair" />}

        <path d={path} className="pain-line" />
        {pts.map((p) => (
          <circle key={p.c.date} cx={x(p.d)} cy={y(p.c.painRightNeckShoulder)} r={4} className="pain-dot" />
        ))}

        {/* Symptom strips */}
        <text x={PAD_L - 6} y={STRIP_TOP + 14} className="axis" textAnchor="end">H</text>
        <text x={PAD_L - 6} y={STRIP_TOP + ROW_H + 14} className="axis" textAnchor="end">A</text>
        <line x1={PAD_L} x2={W - PAD_R} y1={STRIP_TOP + ROW_H} y2={STRIP_TOP + ROW_H} className="grid" />
        {pts.map(({ c, d }) =>
          c.headache === 'none' ? null : (
            <rect
              key={'h' + c.date}
              x={x(d) - 4}
              y={STRIP_TOP + 6}
              width={8}
              height={8}
              className={c.headache === 'bad' ? 'mark-solid' : 'mark-hollow'}
            />
          ),
        )}
        {pts.map(({ c, d }) =>
          c.armFatigueOrTingling ? (
            <rect key={'a' + c.date} x={x(d) - 4} y={STRIP_TOP + ROW_H + 6} width={8} height={8} className="mark-solid" transform={`rotate(45 ${x(d)} ${STRIP_TOP + ROW_H + 10})`} />
          ) : null,
        )}
      </svg>

      {h && (
        <div
          className="tooltip mono"
          style={{ left: `${Math.min(Math.max((x(h.d) / W) * 100, 18), 82)}%` }}
          aria-live="polite"
        >
          <strong>{shortDate(h.d)}</strong> Pain {h.c.painRightNeckShoulder}
          <br />
          Headache {h.c.headache} · Arm {h.c.armFatigueOrTingling ? 'yes' : 'no'}
        </div>
      )}

      <p className="chart-key label">
        H headache: <span aria-hidden="true">□</span> mild <span aria-hidden="true">■</span> bad · A arm: <span aria-hidden="true">◆</span> yes
      </p>
    </div>
  )
}
