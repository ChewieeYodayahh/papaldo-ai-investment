import { Suspense } from 'react'
import Link from 'next/link'

import { getProfile } from '@/app/features/auth/api/profile'
import { SignOutButton } from '@/app/features/auth/components/SignOutButton'
import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { getOrderHistory } from '@/app/features/trading/api/orders'
import { getPortfolio } from '@/app/features/trading/api/portfolio'
import { OrderHistory } from '@/app/features/trading/components/OrderHistory'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import {
  MarketNewsPanel,
  NewsSkeleton,
  PortfolioPanels,
  PortfolioPanelsSkeleton,
  StripSkeleton,
  WatchlistPanel,
} from '../components/MarketPanels'

/**
 * Home dashboard.
 *
 * Two tiers, on purpose. Everything the database already knows -- name, risk
 * band, cash, holdings, order history -- is awaited here in a single
 * `Promise.all` and paints straight away. Anything that waits on Alpaca or
 * Finnhub streams in behind Suspense, so a slow or dead market-data provider
 * costs those panels and nothing else.
 *
 * The database reads are genuinely cheap now: identity is resolved once per
 * request by `getSessionUser`, which verifies the JWT locally rather than
 * paying a round trip to Supabase Auth per module (four of them, before).
 *
 * Portfolio numbers are real reads. Holdings move only through
 * `place_order()`; nothing here fabricates a position.
 */
export async function DashboardPage() {
  const [profile, riskProfile, portfolio, orders] = await Promise.all([
    getProfile(),
    getCurrentRiskProfile(),
    getPortfolio(),
    getOrderHistory(),
  ])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile?.username ? `Welcome back, ${profile.username}` : 'Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Simulated trading only — no real money, no broker orders.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Risk profile: {riskProfile?.band ?? 'Not assessed'}
            </Badge>
            <SignOutButton />
          </div>
        </header>

        {portfolio ? (
          <Suspense fallback={<PortfolioPanelsSkeleton />}>
            <PortfolioPanels portfolio={portfolio} hasRiskProfile={Boolean(riskProfile)} />
          </Suspense>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No portfolio found for this account. Accounts created before portfolios shipped have no row
              until the backfill migration is applied — signing out and back in will not create one, because
              the seeding trigger fires on signup only. Contact support.
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <Suspense fallback={<StripSkeleton />}>
            <WatchlistPanel />
          </Suspense>
        </div>

        <div className="mb-6">
          <OrderHistory orders={orders} />
        </div>

        <Suspense fallback={<NewsSkeleton />}>
          <MarketNewsPanel />
        </Suspense>

        {/* Only the retake link lives down here. The first-time invitation is
            the CTA in My Assets, where someone with no positions is already
            looking -- two calls to the same action compete with each other. */}
        {riskProfile ? (
          <p className="mt-8 text-sm text-muted-foreground">
            <Link href="/isq" className="underline">
              Retake the questionnaire
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  )
}
