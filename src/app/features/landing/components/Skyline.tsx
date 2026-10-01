import { cn } from '@/lib/utils'

/**
 * A BGC-style skyline (2026-10-02), drawn rather than photographed so it
 * takes the scene's colours in both themes: glass towers on a clear morning,
 * or at blue hour with office windows coming on one by one (globals.css,
 * "Landing motion"). Purely decorative.
 *
 * Generated from a fixed seed, so the server and every visitor draw the same
 * city and nothing shifts on hydration.
 */

const WIDTH = 1600
const HEIGHT = 440
const GROUND = HEIGHT - 10

/** A tiny seeded random number generator (mulberry32). */
function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Tower = { x: number; w: number; h: number; crown: 'flat' | 'step' | 'mast' | 'slant'; band: boolean }
type Window = { x: number; y: number; lit: boolean; delay: number }

const CROWNS: Tower['crown'][] = ['flat', 'step', 'flat', 'mast', 'slant', 'flat']

function city(): { back: Tower[]; front: Tower[]; windows: Window[] } {
  const random = seeded(29)
  const back: Tower[] = []
  for (let x = -30; x < WIDTH; ) {
    const w = 60 + random() * 70
    back.push({ x, w, h: 170 + random() * 190, crown: CROWNS[Math.floor(random() * CROWNS.length)], band: false })
    x += w + 6 + random() * 30
  }

  const front: Tower[] = []
  for (let x = -10; x < WIDTH; ) {
    const w = 70 + random() * 80
    const tall = random() < 0.22
    front.push({
      x,
      w,
      h: tall ? 250 + random() * 90 : 100 + random() * 150,
      crown: CROWNS[Math.floor(random() * CROWNS.length)],
      band: tall && random() < 0.6,
    })
    x += w + 10 + random() * 40
  }

  const windows: Window[] = []
  for (const tower of front) {
    const top = GROUND - tower.h
    const cols = Math.floor((tower.w - 18) / 13)
    const rows = Math.floor((tower.h - 34) / 17)
    const inset = (tower.w - (cols * 13 - 6)) / 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = random() < 0.3
        windows.push({ x: tower.x + inset + c * 13, y: top + 22 + r * 17, lit, delay: 0.25 + random() * 3.4 })
      }
    }
  }
  return { back, front, windows }
}

const CITY = city()

function TowerShape({ tower, className, style }: { tower: Tower; className?: string; style?: React.CSSProperties }) {
  const top = GROUND - tower.h
  const { x, w } = tower
  return (
    <g className={className} style={style}>
      <rect x={x} y={top} width={w} height={tower.h + 10} />
      {tower.crown === 'step' ? <rect x={x + w * 0.18} y={top - 18} width={w * 0.64} height={20} /> : null}
      {tower.crown === 'mast' ? (
        <>
          <rect x={x + w * 0.3} y={top - 12} width={w * 0.4} height={14} />
          <rect x={x + w / 2 - 1.5} y={top - 46} width={3} height={36} />
        </>
      ) : null}
      {tower.crown === 'slant' ? <polygon points={`${x},${top} ${x + w},${top - 26} ${x + w},${top}`} /> : null}
    </g>
  )
}

export function Skyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className={cn('pointer-events-none select-none', className)}
    >
      {/* The far row, half lost in the haze of the horizon. */}
      {CITY.back.map((tower) => (
        <TowerShape key={`b${tower.x}`} tower={tower} style={{ fill: 'color-mix(in oklch, var(--glass) 55%, var(--sky-horizon))' }} />
      ))}
      {CITY.front.map((tower) => (
        <TowerShape key={`f${tower.x}`} tower={tower} style={{ fill: 'var(--glass)' }} />
      ))}
      {/* Each tower's edge catching the light. */}
      {CITY.front.map((tower) => (
        <rect key={`e${tower.x}`} x={tower.x} y={GROUND - tower.h} width={2} height={tower.h} style={{ fill: 'var(--glass-edge)', opacity: 0.55 }} />
      ))}
      {CITY.windows.map((w, i) => (
        <rect
          key={i}
          x={w.x}
          y={w.y}
          width={6}
          height={9}
          rx={1}
          className="skyline-window"
          data-lit={w.lit || undefined}
          style={w.lit ? ({ '--d': `${w.delay.toFixed(2)}s` } as React.CSSProperties) : undefined}
        />
      ))}
      {/* An LED ribbon near the top of the tallest towers, as on the exchange buildings. */}
      {CITY.front
        .filter((tower) => tower.band)
        .map((tower) => (
          <rect key={`l${tower.x}`} x={tower.x} y={GROUND - tower.h + 6} width={tower.w} height={5} style={{ fill: 'var(--window)', opacity: 0.6 }} />
        ))}
      <rect x={0} y={GROUND} width={WIDTH} height={HEIGHT - GROUND} style={{ fill: 'var(--street)' }} />
    </svg>
  )
}
