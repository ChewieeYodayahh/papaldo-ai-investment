import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { PortfolioSummary } from '@/app/features/trading/api/portfolio'
import { getMarketInsight, getWatchlistQuotes } from '../api/market'
import { AllocationDonut } from './AllocationDonut'
import { HoldingsList } from './HoldingsList'
import { MarketNews } from './MarketNews'
import { OverviewCard } from './OverviewCard'
import { WatchlistStrip } from './WatchlistStrip'

/**
 * The parts of the dashboard that wait on a market-data provider.
 *
 * Split out so the page can stream them behind Suspense instead of holding
 * the whole render hostage to Alpaca and Finnhub. Everything the database
 * already knows -- name, risk band, cash, holdings, order history -- paints
 * immediately; these fill in.
 *
 * The three quote-dependent cards sit in one boundary on purpose. Splitting
 * them further would let the portfolio total appear before the allocation
 * that explains it, and a total that changes a moment after you read it is
 * worse than a total that arrives a moment later.
 */

export async function PortfolioPanels({
  portfolio,
  hasRiskProfile,
}: {
  portfolio: PortfolioSummary
  hasRiskProfile: boolean
}) {
  const watchlist = await getWatchlistQuotes()
  const quotes = watchlist.ok ? watchlist.data : null

  return (
    <>
      <div className="mb-6">
        <OverviewCard portfolio={portfolio} watchlist={quotes} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <HoldingsList holdings={portfolio.holdings} hasRiskProfile={hasRiskProfile} />
        <AllocationDonut portfolio={portfolio} watchlist={quotes} muted={!hasRiskProfile} />
      </div>
    </>
  )
}

export async function WatchlistPanel() {
  return <WatchlistStrip quotes={await getWatchlistQuotes()} />
}

export async function MarketNewsPanel() {
  return <MarketNews items={await getMarketInsight()} />
}

/** Shapes match what replaces them, so nothing jumps when the data lands. */
export function PortfolioPanelsSkeleton() {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </>
  )
}

export function StripSkeleton() {
  return <Skeleton className="h-32 w-full rounded-xl" />
}

export function NewsSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}
