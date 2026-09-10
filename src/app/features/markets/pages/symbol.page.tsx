import { notFound } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'

import { getCandles } from '../api/candles.mock'
import { getSymbolNews, getSymbolOverview, getSymbolRatings, isPlausibleSymbol } from '../api/symbol'
import { marketUnavailableMessage } from '../market-status'
import { AnalystRatings } from '../components/AnalystRatings'
import { EarningsChart } from '../components/EarningsChart'
import { KeyStats } from '../components/KeyStats'
import { PriceChart } from '../components/PriceChart'
import { SymbolHeader } from '../components/SymbolHeader'
import { SymbolNews } from '../components/SymbolNews'

/**
 * One symbol, opened from the dashboard watchlist.
 *
 * Everything except the price history is live Finnhub: quote, company
 * profile, ratios, quarterly earnings, headlines and analyst coverage. The
 * candle history is generated — this plan has no historical OHLC endpoint —
 * and every surface that shows it says so. See `api/candles.mock.ts` for the
 * swap-in instructions when a real provider is chosen.
 *
 * Panels are fetched in parallel and each degrades on its own; only a failed
 * quote takes the page down to a single message, since there is no price to
 * show without it.
 */
export async function SymbolPage({ symbol }: { symbol: string }) {
  if (!isPlausibleSymbol(symbol)) notFound()

  const [overview, news, ratings] = await Promise.all([
    getSymbolOverview(symbol),
    getSymbolNews(symbol),
    getSymbolRatings(symbol),
  ])

  if (!overview.ok) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No price for {symbol}. {marketUnavailableMessage(overview.reason)}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { quote, profile, metrics, earnings } = overview.data
  const { candles, source } = getCandles(symbol, quote)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SymbolHeader quote={quote} profile={profile} />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <PriceChart candles={candles} source={source} />
            <EarningsChart points={earnings} />
            <SymbolNews items={news} symbol={symbol} />
          </div>

          <div className="space-y-6">
            <KeyStats quote={quote} metrics={metrics} />
            <AnalystRatings ratings={ratings} />
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Simulated trading only — no real money and no broker orders. Nothing on this page is investment
          advice.
        </p>
      </div>
    </main>
  )
}
