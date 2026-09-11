import { TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import { getTradableAssets, searchAssets } from '../api/assets'
import { getCandles, type Candle } from '../api/candles'
import { getQuotes } from '../api/quotes'
import { marketUnavailableMessage } from '../market-status'
import { AssetTable } from '../components/AssetTable'
import { QuoteCard } from '../components/QuoteCard'

/**
 * Markets index.
 *
 * Replaced the hardcoded `SAMPLE_DATA` table on 2026-09-11. Nothing on this
 * page is typed into the repo any more: the quotes, the daily bars behind each
 * sparkline, the company names and the tradable universe are all live Alpaca,
 * which is the app's pricing and asset engine.
 *
 * The featured row is a default view, not a curated universe -- the catalogue
 * below it is the universe, searchable, and every row links to a detail page
 * priced from the same source that would fill a simulated order.
 */
const FEATURED = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NFLX'] as const

/** Daily bars behind each sparkline. About six weeks of sessions. */
const SPARKLINE_DAYS = 45

export async function MarketsPage({ query }: { query: string }) {
  const [quotes, assets, ...bars] = await Promise.all([
    getQuotes([...FEATURED]),
    getTradableAssets(),
    ...FEATURED.map((symbol) => getCandles(symbol, 'equity', SPARKLINE_DAYS)),
  ])

  // Widened to string keys: FEATURED is `as const`, so an inferred Map would
  // be keyed by the literal union and reject a lookup by a plain symbol.
  const candlesBySymbol = new Map<string, Candle[]>(
    FEATURED.map((symbol, i) => [symbol, bars[i].ok ? bars[i].data : []]),
  )
  const nameBySymbol = new Map<string, string>(
    assets.ok ? assets.data.map((asset) => [asset.symbol, asset.name]) : [],
  )

  const matches = assets.ok ? searchAssets(assets.data, query) : []

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <TrendingUp className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Markets</h1>
            <Badge variant="outline" className="text-[10px]">
              Live · Alpaca
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live prices and daily history from Alpaca. Simulated trading only — no real money and no
            broker orders reach a venue.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Featured</h2>

          {quotes.ok ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quotes.data.map((quote) => (
                <QuoteCard
                  key={quote.symbol}
                  quote={quote}
                  name={nameBySymbol.get(quote.symbol)}
                  candles={candlesBySymbol.get(quote.symbol) ?? []}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                {marketUnavailableMessage(quotes.reason, 'Alpaca')}
              </CardContent>
            </Card>
          )}
        </section>

        {assets.ok ? (
          <AssetTable assets={matches} total={assets.data.length} query={query} />
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Asset catalogue unavailable. {marketUnavailableMessage(assets.reason, 'Alpaca')}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
