import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import type { RiskBand } from '@/app/features/onboarding/types'
import { getShellData } from '@/app/features/shell/api/shell'
import { getPortfolio } from '@/app/features/trading/api/portfolio'

import { RiskAppetiteCard } from '../components/RiskAppetiteCard'
import {
  CardSkeleton,
  MarketMoversPanel,
  PerformancePanel,
  PortfolioPreviewPanel,
  TotalHoldingsPanel,
} from '../components/panels'

/**
 * Home dashboard (redesigned 2026-09-25 from Carlos's mockups).
 *
 * Two tiers, as before. What the database knows -- risk band, name, cash and
 * positions -- is awaited here in one `Promise.all` and paints straight away.
 * Anything priced by Alpaca streams in behind Suspense.
 *
 * Nothing here is fabricated: the total is cash plus positions at live
 * prices, movers come from the buyable universe, and the performance line is
 * rebuilt from the account's own fills (see `reconstructHistory`).
 */
export async function DashboardPage() {
  const [portfolio, riskProfile, shell] = await Promise.all([
    getPortfolio(),
    getCurrentRiskProfile(),
    getShellData(),
  ])

  const band = (riskProfile?.band ?? null) as RiskBand | null

  return portfolio ? (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr]">
            <div className="grid content-start gap-4">
              <Suspense fallback={<CardSkeleton />}>
                <TotalHoldingsPanel portfolio={portfolio} />
              </Suspense>
              <RiskAppetiteCard band={band} firstName={shell.user?.firstName ?? 'there'} />
            </div>

            <Suspense fallback={<CardSkeleton className="h-full" />}>
              <MarketMoversPanel />
            </Suspense>

            <div className="lg:col-span-2 xl:col-span-1">
              <Suspense fallback={<CardSkeleton className="h-full" />}>
                <PortfolioPreviewPanel portfolio={portfolio} hasRiskProfile={Boolean(band)} />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<CardSkeleton className="h-[300px]" />}>
            <PerformancePanel portfolio={portfolio} />
          </Suspense>

          <p className="text-xs text-muted-foreground">
            Simulated trading only — no real money, no broker orders.
          </p>
        </div>
  ) : (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        No portfolio found for this account. Accounts created before portfolios shipped have no row until the
        backfill migration is applied — signing out and back in will not create one, because the seeding trigger
        fires on signup only. Contact support.
      </CardContent>
    </Card>
  )
}
