import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { T } from '@/app/features/preferences/copy'
import { AppShell } from '@/app/features/shell/components/AppShell'

import { getTradableAssets, searchAssets } from '../api/assets'
import { getCandlesMany, type Candle } from '../api/candles'
import { getUniverseQuotes, sectorMoves, topMovers } from '../api/movers'
import { getMarketHeadlines } from '../api/news'
import { getUniverse } from '../api/universe'
import { marketUnavailableMessage } from '../market-status'
import { AssetTable } from '../components/AssetTable'
import { MarketNews } from '../components/MarketNews'
import { MoversList, SectorHeatmap } from '../components/MarketSidePanels'
import { QuoteCard } from '../components/QuoteCard'
import { UniverseTable } from '../components/UniverseTable'

/**
 * Markets (redesigned 2026-09-25, after the ForexDrift reference, cut down to
 * what Papaldo actually has: US equities and ETFs priced by Alpaca).
 *
 * Top to bottom: four benchmark ETFs, the buyable universe with live prices
 * and trend lines beside today's movers and a sector heatmap, then the full
 * Alpaca catalogue search and the news feed.
 *
 * Everything moving-related is drawn from the 41-name buyable universe, so
 * every name promoted here is one `place_order` will accept. The catalogue
 * search below it is the view-only 8,500.
 *
 * Two Alpaca requests price the whole top half: one snapshot call for the
 * quotes and one multi-symbol bars call for every trend line.
 */

/** Broad-market proxies. Each is in the buyable universe; filtered anyway in case that changes. */
const BENCHMARKS = ['VOO', 'QQQ', 'VTI', 'IBIT']

const MOVER_COUNT = 5
const TREND_DAYS = 45

export async function MarketsPage({ query }: { query: string }) {
  const universe = await getUniverse()
  const symbols = universe.map((a) => a.symbol)

  const [quotes, bars, assets, news] = await Promise.all([
    getUniverseQuotes(),
    getCandlesMany(symbols, TREND_DAYS),
    getTradableAssets(),
    getMarketHeadlines(),
  ])

  const candles = bars.ok ? bars.data : new Map<string, Candle[]>()
  const trends = Object.fromEntries([...candles.entries()].map(([symbol, list]) => [symbol, list.map((c) => c.close)]))
  const benchmarks = quotes.ok ? quotes.data.filter((q) => BENCHMARKS.includes(q.symbol)) : []
  const movers = quotes.ok ? topMovers(quotes.data, MOVER_COUNT) : null
  const matches = assets.ok ? searchAssets(assets.data, query) : []

  return (
    <AppShell>
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            <T k="mkt.title" />
          </h2>
          <Badge variant="outline">Live · Alpaca</Badge>
        </div>
        <p className="mt-0.5 max-w-2xl text-[0.8125rem] text-muted-foreground">
          <T k="mkt.subtitle" /> Simulated trading only — no real money and no broker orders.
        </p>
      </div>

      {quotes.ok ? (
        <div className="grid gap-4">
          <section aria-label="Benchmarks" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {benchmarks.map((quote) => (
              <QuoteCard
                key={quote.symbol}
                quote={quote}
                name={quote.name}
                candles={candles.get(quote.symbol) ?? []}
              />
            ))}
          </section>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <UniverseTable quotes={quotes.data} trends={trends} />
            <div className="grid gap-4">
              <MoversList title="mkt.topGainers" quotes={movers?.gainers ?? []} trends={trends} />
              <MoversList title="mkt.topLosers" quotes={movers?.losers ?? []} trends={trends} />
              <SectorHeatmap sectors={sectorMoves(quotes.data)} />
            </div>
          </div>
        </div>
      ) : (
        <Card className="rounded-3xl border-0">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {marketUnavailableMessage(quotes.reason, 'Alpaca')}
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {assets.ok ? (
          <AssetTable assets={matches} total={assets.data.length} query={query} />
        ) : (
          <Card className="rounded-3xl border-0">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Asset catalogue unavailable. {marketUnavailableMessage(assets.reason, 'Alpaca')}
            </CardContent>
          </Card>
        )}
        <MarketNews items={news} />
      </div>
    </AppShell>
  )
}
