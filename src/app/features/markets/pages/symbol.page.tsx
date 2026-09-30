import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'

import { getCurrentRiskProfile } from '@/app/features/tools/quiz/api/submit'
import { isBuyable } from '../api/universe'
import { getPortfolio } from '@/app/features/trading/api/portfolio'
import { OrderTicket } from '@/app/features/trading/components/OrderTicket'
import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'

import { getCandles } from '../api/candles'
import { getSymbolNews } from '../api/news'
import { assetClassOf, getSymbolOverview, getSymbolRatings, isPlausibleSymbol } from '../api/symbol'
import { marketUnavailableMessage } from '../market-status'
import { KeyStats } from '../components/KeyStats'
import { PriceChart } from '../components/PriceChart'
import { SymbolHeader } from '../components/SymbolHeader'
import { SymbolInsights } from '../components/SymbolInsights'

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

  const [overview, news, ratings, candles, portfolio, riskProfile, buyable] = await Promise.all([
    getSymbolOverview(symbol),
    getSymbolNews(symbol),
    getSymbolRatings(symbol),
    getCandles(symbol, assetClassOf(symbol)),
    // Null when signed out. This page is public, so the ticket is the only
    // part that needs an account.
    getPortfolio(),
    // Buying requires a risk profile. The ticket reflects that; place_order
    // enforces it whether or not the ticket is the thing that submits.
    getCurrentRiskProfile(),
    // Mirrors the PA007 check so the ticket does not offer a buy the
    // database will refuse.
    isBuyable(symbol),
  ])

  if (!overview.ok) {
    return (
      <div>
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No price for {symbol}. {marketUnavailableMessage(overview.reason, 'Alpaca')}
            </CardContent>
          </Card>
      </div>
    )
  }

  const { quote, profile, metrics, earnings } = overview.data

  return (
    <div className="mx-auto max-w-6xl">
        <SymbolHeader quote={quote} profile={profile} />
        <TutorialTrigger tour="trade" className="mb-4" />

        {/* Grid areas give the order Carlos asked for (2026-09-30): on a phone
            chart, trade, key stats, insights; on desktop the trade panel is a
            sticky column beside the chart, never below the news. */}
        <div className="grid grid-cols-1 gap-6 [grid-template-areas:'chart'_'trade'_'stats'_'insights'] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:[grid-template-areas:'chart_trade'_'stats_trade'_'insights_trade'] lg:grid-rows-[auto_auto_1fr]">
          <div className="min-w-0 [grid-area:chart]" data-tut="trade.chart">
            {candles.ok ? (
              <PriceChart candles={candles.data} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Price history unavailable. {marketUnavailableMessage(candles.reason, 'Alpaca')}
                </CardContent>
              </Card>
            )}
          </div>

          {/* The header's Buy / Sell buttons jump here. */}
          <div id="trade" className="scroll-mt-24 [grid-area:trade] lg:sticky lg:top-4 lg:self-start">
            {/* Scroll targets for the header's Buy / Sell (the ticket reads which one). */}
            <span id="trade-buy" className="block scroll-mt-24" aria-hidden />
            <span id="trade-sell" className="block scroll-mt-24" aria-hidden />
            {portfolio ? (
              <OrderTicket
                symbol={symbol}
                name={profile.ok ? profile.data.name : null}
                assetClass={assetClassOf(symbol)}
                price={quote.price}
                cashBalance={portfolio.cashBalance}
                heldQuantity={portfolio.holdings.find((h) => h.symbol === symbol)?.quantity ?? 0}
                // Alpaca decides whether a fraction is allowed. Unknown asset
                // records default to whole units rather than assuming.
                fractionable={overview.data.asset.ok ? overview.data.asset.data.fractionable : false}
                hasRiskProfile={Boolean(riskProfile)}
                isBuyable={buyable}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  <Link href="/login" className="underline">
                    Sign in
                  </Link>{' '}
                  to place a simulated order.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="min-w-0 [grid-area:stats]" data-tut="trade.stats">
            <KeyStats quote={quote} metrics={metrics} />
          </div>
          <div className="min-w-0 [grid-area:insights]">
            <SymbolInsights symbol={symbol} ratings={ratings} news={news} earnings={earnings} />
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Simulated trading only — no real money and no broker orders. Nothing on this page is investment
          advice.
        </p>
    </div>
  )
}
