import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'
import { T } from '@/app/features/userData/preferences/copy'

import { getCandlesMany, type Candle } from '../api/candles'
import { getUniverseQuotes, topMovers } from '../api/movers'
import { getMarketHeadlines } from '../api/news'
import { getUniverse } from '../api/universe'
import { marketUnavailableMessage } from '../market-status'
import { MarketNews } from '../components/MarketNews'
import { MoversList } from '../components/MarketSidePanels'
import { QuoteCard } from '../components/QuoteCard'
import { MarketSearch } from '../components/MarketSearch'
import { SectorTreemap } from '../components/SectorTreemap'
import { UniverseTable } from '../components/UniverseTable'

/**
 * Markets (redesigned 2026-09-25, after the ForexDrift reference, cut down to
 * what Papaldo actually has: US equities and ETFs priced by Alpaca).
 *
 * Top to bottom: four benchmark ETFs, the buyable universe with live prices
 * and trend lines beside today's movers, the sector heatmap under the table
 * (2026-09-26, after Perplexity Finance), and the news feed.
 *
 * Everything here is drawn from the buyable universe, so every name promoted
 * is one `place_order` will accept. Alpaca's 8,500-name catalogue table was
 * removed on 2026-10-02.
 *
 * Two Alpaca requests price the whole top half: one snapshot call for the
 * quotes and one multi-symbol bars call for every trend line.
 */

/** Broad-market proxies. Each is in the buyable universe; filtered anyway in case that changes. */
const BENCHMARKS = ['VOO', 'QQQ', 'VTI', 'IBIT']

const MOVER_COUNT = 5
const TREND_DAYS = 45

export async function MarketsPage() {
  const universe = await getUniverse()
  const symbols = universe.map((a) => a.symbol)

  const [quotes, bars, news] = await Promise.all([
    getUniverseQuotes(),
    getCandlesMany(symbols, TREND_DAYS),
    getMarketHeadlines(),
  ])

  const candles = bars.ok ? bars.data : new Map<string, Candle[]>()
  const trends = Object.fromEntries([...candles.entries()].map(([symbol, list]) => [symbol, list.map((c) => c.close)]))
  const benchmarks = quotes.ok ? quotes.data.filter((q) => BENCHMARKS.includes(q.symbol)) : []
  const movers = quotes.ok ? topMovers(quotes.data, MOVER_COUNT) : null

  return (
    <>
      <TutorialTrigger tour="markets" className="mb-2" />
      {/* The page name lives in the header (AppHeader); this is only the context line. */}
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        <T k="mkt.subtitle" /> Simulated trading only — no real money and no broker orders.
      </p>
      <div className="mb-4" data-tut="markets.search" data-tour="market-search">
        <MarketSearch />
      </div>

      {quotes.ok ? (
        <div className="grid gap-4">
          {/* One window, 2x2 on a phone -- the same shape as the dashboard's portfolio tiles. */}
          <Card className="rounded-2xl border-0 py-4" data-tut="markets.benchmarks">
            <CardContent className="space-y-3 px-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-medium">
                  <T k="mkt.indexes" />
                </h2>
                <Link href="/markets/benchmarks" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Compare 15 years →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                {benchmarks.map((quote) => (
                  <QuoteCard
                    key={quote.symbol}
                    quote={quote}
                    name={quote.name}
                    candles={candles.get(quote.symbol) ?? []}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Left: the table, then the heatmap under it -- which also fills
                the space the taller movers column used to leave empty. */}
            <div className="grid min-w-0 gap-4">
              {/* The first-trade walkthrough points here (shell FirstTradeTour). */}
              <div data-tour="universe" data-tut="markets.table" className="min-w-0 rounded-2xl">
                <UniverseTable quotes={quotes.data} trends={trends} />
              </div>
              <div data-tut="markets.heatmap" className="min-w-0">
                <SectorTreemap quotes={quotes.data} />
              </div>
            </div>
            {/* The rail is pinned to the left column's height on wide screens
                (absolute inset), so neither side leaves an empty block; Market
                Insight takes what the movers leave and scrolls inside. */}
            <div className="xl:relative xl:min-h-[48rem]">
              <div className="flex flex-col gap-4 xl:absolute xl:inset-0">
                <div data-tut="markets.movers" className="grid gap-4">
                  <MoversList title="mkt.topGainers" quotes={movers?.gainers ?? []} trends={trends} />
                  <MoversList title="mkt.topLosers" quotes={movers?.losers ?? []} trends={trends} />
                </div>
                <MarketNews items={news} fill />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl border-0">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {marketUnavailableMessage(quotes.reason, 'Alpaca')}
          </CardContent>
        </Card>
      )}

      {/* With no quotes there is no rail, so the headlines sit here instead. */}
      {quotes.ok ? null : (
        <div className="mt-4">
          <MarketNews items={news} />
        </div>
      )}
    </>
  )
}
