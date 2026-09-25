import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { T } from '@/app/features/preferences/copy'
import { getOrderHistory } from '@/app/features/trading/api/orders'
import { getPortfolio, type PortfolioSummary } from '@/app/features/trading/api/portfolio'
import { OrderHistory } from '@/app/features/trading/components/OrderHistory'

import { getValuation } from '../api/valuation'
import { sectorAllocation } from '../portfolio-math'
import { CardSkeleton, PerformancePanel, TotalHoldingsPanel } from '../components/panels'
import { AllocationCard, PositionsTable } from '../components/PositionsTable'

async function HoldingsPanels({ portfolio, hasRiskProfile }: { portfolio: PortfolioSummary; hasRiskProfile: boolean }) {
  const { valuation } = await getValuation(portfolio)
  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <PositionsTable positions={valuation.positions} />
      <AllocationCard slices={sectorAllocation(valuation)} muted={!hasRiskProfile} />
    </div>
  )
}

/**
 * Everything held, in detail: the total with cash broken out, the
 * performance line, every position at live prices, the sector split and the
 * order record. The dashboard's "See all" dialog is the summary of this page.
 *
 * No inflation-adjusted figure, although the mockup has one: it needs a
 * Philippine CPI series, and no provider wired into the app serves one.
 */
export async function PortfolioPage() {
  const [portfolio, riskProfile, orders] = await Promise.all([
    getPortfolio(),
    getCurrentRiskProfile(),
    getOrderHistory(),
  ])

  return (
    <>
      {/* The page name lives in the header (AppHeader); this is only the context line. */}
      <p className="mb-4 text-[0.8125rem] text-muted-foreground">
        <T k="pf.subtitle" />
      </p>

      {portfolio ? (
        <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
            <Suspense fallback={<CardSkeleton />}>
              <TotalHoldingsPanel portfolio={portfolio} detailed />
            </Suspense>
            <Suspense fallback={<CardSkeleton className="h-[300px]" />}>
              <PerformancePanel portfolio={portfolio} />
            </Suspense>
          </div>
          <Suspense fallback={<CardSkeleton className="h-64" />}>
            <HoldingsPanels portfolio={portfolio} hasRiskProfile={Boolean(riskProfile)} />
          </Suspense>
          <OrderHistory orders={orders} />
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No portfolio found for this account.</CardContent>
        </Card>
      )}
    </>
  )
}
