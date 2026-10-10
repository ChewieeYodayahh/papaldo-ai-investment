import type { FinnhubRecommendation } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/result'
import { marketUnavailableMessage } from '../market-status'
import { PanelFrame } from './PanelFrame'
import { T } from '@/app/features/userData/preferences/copy'

/**
 * The most recent analyst recommendation month, as published by Finnhub.
 *
 * Reported, not derived: Papaldo does not rate securities, and nothing here
 * is advice. The bar widths are the raw analyst counts.
 */
export function AnalystRatings({
  ratings,
  embedded = false,
}: {
  ratings: MarketResult<FinnhubRecommendation | null>
  embedded?: boolean
}) {
  return (
    <PanelFrame title={<T k="sym.analysts" />} embedded={embedded}>
      <Body ratings={ratings} />
    </PanelFrame>
  )
}

function Body({ ratings }: { ratings: MarketResult<FinnhubRecommendation | null> }) {
  if (!ratings.ok) {
    return <p className="text-sm text-muted-foreground">{marketUnavailableMessage(ratings.reason, 'Finnhub')}</p>
  }
  if (!ratings.data) {
    return <p className="text-sm text-muted-foreground">No analyst coverage published for this symbol.</p>
  }

  const r = ratings.data
  const bands: [string, number, string][] = [
    ['Strong buy', r.strongBuy, 'bg-chart-1'],
    ['Buy', r.buy, 'bg-chart-2'],
    ['Hold', r.hold, 'bg-chart-3'],
    ['Sell', r.sell, 'bg-chart-4'],
    ['Strong sell', r.strongSell, 'bg-destructive'],
  ]
  const total = bands.reduce((sum, [, count]) => sum + count, 0)

  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        {total} analysts · {r.period}
      </p>

      <ul className="space-y-2.5">
        {bands.map(([label, count, tone]) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={`block h-full rounded-full ${tone}`}
                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
              />
            </span>
            <span className="w-6 shrink-0 text-right tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Third-party analyst opinion, shown for context. Papaldo does not make recommendations.
      </p>
    </>
  )
}
