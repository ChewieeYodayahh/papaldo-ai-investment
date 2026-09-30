import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Quote } from '../api/quotes'
import type { MarketResult } from '../api/result'
import { marketUnavailableMessage } from '../market-status'
import { StatHelp, type StatId } from './StatHelp'

type Metrics = Record<string, number | string | null>

const price = (value: number) => `$${value.toFixed(2)}`

/** Finnhub reports market cap and average volume in millions. */
const millions = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}B`
  return `$${value.toFixed(0)}M`
}

function num(metrics: Metrics, key: string): number | null {
  const value = metrics[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Day figures come from the quote; the rest from `/stock/metric`. Any field
 * Finnhub does not return for a symbol is rendered as an em dash rather than
 * filled in with a plausible-looking number.
 */
export function KeyStats({
  quote,
  metrics,
}: {
  quote: Quote
  metrics: MarketResult<Metrics>
}) {
  const m = metrics.ok ? metrics.data : {}

  const high52 = num(m, '52WeekHigh')
  const low52 = num(m, '52WeekLow')
  const marketCap = num(m, 'marketCapitalization')
  const pe = num(m, 'peTTM')
  const beta = num(m, 'beta')
  const yield_ = num(m, 'dividendYieldIndicatedAnnual')
  const volume = num(m, '10DayAverageTradingVolume')

  // Each row: label, value, and which "?" explanation it opens.
  const rows: [string, string, StatId][] = [
    ['Open', price(quote.open), 'open'],
    ['Previous close', price(quote.previousClose), 'previousClose'],
    ['Day high', price(quote.high), 'dayRange'],
    ['Day low', price(quote.low), 'dayRange'],
    ['52-week high', high52 === null ? '—' : price(high52), 'week52'],
    ['52-week low', low52 === null ? '—' : price(low52), 'week52'],
    ['Market cap', marketCap === null ? '—' : millions(marketCap), 'marketCap'],
    ['P/E (TTM)', pe === null ? '—' : pe.toFixed(2), 'pe'],
    ['Beta', beta === null ? '—' : beta.toFixed(2), 'beta'],
    ['Dividend yield', yield_ === null ? '—' : `${yield_.toFixed(2)}%`, 'dividendYield'],
    ['Avg volume (10d)', volume === null ? '—' : `${volume.toFixed(2)}M`, 'avgVolume'],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Key stats</CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics.ok ? (
          <p className="mb-4 text-xs text-muted-foreground">
            Ratios unavailable — {marketUnavailableMessage(metrics.reason, 'Finnhub')} Day figures below are still live.
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {rows.map(([label, value, help]) => (
            <div key={label}>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                {label}
                <StatHelp id={help} label={label} />
              </dt>
              <dd className="text-sm font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
