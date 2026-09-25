import { cn } from '@/lib/utils'

/**
 * A table-row sparkline as plain SVG. The card sparklines use Lightweight
 * Charts, but forty canvases -- each with its own chart instance -- for a
 * shape nobody hovers is a lot of machinery; a polyline is enough here.
 *
 * Colour comes from `currentColor`, so the gain/loss token on the wrapper is
 * the only colour definition.
 */
export function MiniTrend({ closes, className }: { closes: number[]; className?: string }) {
  if (closes.length < 2) return <span className={cn('block h-8 w-24', className)} aria-hidden />

  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const points = closes
    .map((close, i) => `${(i / (closes.length - 1)) * 100},${30 - ((close - min) / span) * 28 - 1}`)
    .join(' ')
  const rising = closes.at(-1)! >= closes[0]

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('block h-8 w-24', rising ? 'text-gain' : 'text-loss', className)}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
