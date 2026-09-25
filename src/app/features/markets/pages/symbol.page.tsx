import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'

import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { isBuyable } from '../api/universe'
import { getPortfolio } from '@/app/features/trading/api/portfolio'
import { OrderTicket } from '@/app/features/trading/components/OrderTicket'

import { getCandles } from '../api/candles'
import { getSymbolNews } from '../api/news'
import { assetClassOf, getSymbolOverview, getSymbolRatings, isPlausibleSymbol } from '../api/symbol'
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

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {candles.ok ? (
              <PriceChart candles={candles.data} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Price history unavailable. {marketUnavailableMessage(candles.reason, 'Alpaca')}
                </CardContent>
              </Card>
            )}
            <EarningsChart points={earnings} />
            <SymbolNews items={news} symbol={symbol} />
          </div>

          <div className="space-y-6">
            {portfolio ? (
              <OrderTicket
                symbol={symbol}
                assetClass={assetClassOf(symbol)}
                price={quote.price}
                cashBalance={portfolio.cashBalance}
                heldQuantity={
                  portfolio.holdings.find((h) => h.symbol === symbol)?.quantity ?? 0
                }
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

            <KeyStats quote={quote} metrics={metrics} />
            <AnalystRatings ratings={ratings} />
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Simulated trading only — no real money and no broker orders. Nothing on this page is investment
          advice.
        </p>
    </div>
  )
}
