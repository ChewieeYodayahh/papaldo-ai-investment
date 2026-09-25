import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUniverseQuotes, topMovers } from '@/app/features/markets/api/movers'
import { marketUnavailableMessage } from '@/app/features/markets/market-status'
import type { PortfolioSummary } from '@/app/features/trading/api/portfolio'
import { cn } from '@/lib/utils'

import { getPerformanceHistory, getValuation } from '../api/valuation'
import { sectorAllocation } from '../portfolio-math'
import { MarketMoversCard } from './MarketMoversCard'
import { PerformanceChart } from './PerformanceChart'
import { PortfolioPreview } from './PortfolioPreview'
import { TotalHoldingsCard } from './TotalHoldingsCard'

/**
 * The parts of the dashboard that wait on Alpaca, each streamed behind its
 * own Suspense boundary so a slow provider costs its card and nothing else.
 *
 * Three of them price the same holdings. `getValuation` is `cache()`d on the
 * portfolio object, so they share one set of quote requests and resolve
 * together -- the total never lands before the allocation that explains it.
 */

const MOVER_COUNT = 4

function pricingNote(failure: Parameters<typeof marketUnavailableMessage>[0] | null): string | null {
  return failure ? `${marketUnavailableMessage(failure, 'Alpaca')} Positions are shown at cost.` : null
}

export async function TotalHoldingsPanel({
  portfolio,
  detailed = false,
}: {
  portfolio: PortfolioSummary
  detailed?: boolean
}) {
  const { valuation, failure } = await getValuation(portfolio)
  return <TotalHoldingsCard valuation={valuation} pricingNote={pricingNote(failure)} detailed={detailed} />
}

export async function PortfolioPreviewPanel({
  portfolio,
  hasRiskProfile,
}: {
  portfolio: PortfolioSummary
  hasRiskProfile: boolean
}) {
  const { valuation } = await getValuation(portfolio)
  return (
    <PortfolioPreview
      positions={valuation.positions}
      allocation={sectorAllocation(valuation)}
      hasRiskProfile={hasRiskProfile}
    />
  )
}

export async function PerformancePanel({ portfolio }: { portfolio: PortfolioSummary }) {
  const { valuation } = await getValuation(portfolio)
  return <PerformanceChart points={await getPerformanceHistory(portfolio, valuation)} />
}

export async function MarketMoversPanel() {
  const quotes = await getUniverseQuotes()
  return quotes.ok ? (
    <MarketMoversCard movers={topMovers(quotes.data, MOVER_COUNT)} unavailable={null} />
  ) : (
    <MarketMoversCard movers={null} unavailable={marketUnavailableMessage(quotes.reason, 'Alpaca')} />
  )
}

/** Shaped like what replaces it, so nothing jumps when the data lands. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('rounded-2xl border-0 py-4', className)}>
      <CardContent className="space-y-4 px-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}
