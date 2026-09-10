import Link from 'next/link'

import { getProfile } from '@/app/features/auth/api/profile'
import { SignOutButton } from '@/app/features/auth/components/SignOutButton'
import { getCurrentRiskProfile } from '@/app/features/isq/api/submit'
import { getPortfolio } from '@/app/features/dashboard/api/portfolio'
import { getMarketInsight, getWatchlistQuotes } from '@/app/features/dashboard/api/market'
import { AllocationDonut } from '@/app/features/dashboard/components/AllocationDonut'
import { HoldingsList } from '@/app/features/dashboard/components/HoldingsList'
import { MarketNews } from '@/app/features/dashboard/components/MarketNews'
import { OverviewCard } from '@/app/features/dashboard/components/OverviewCard'
import { WatchlistStrip } from '@/app/features/dashboard/components/WatchlistStrip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Dashboard' }

/**
 * Home dashboard. Portfolio numbers (cash balance, holdings) are real reads
 * from `portfolios`/`holdings` -- every account starts with a $500,000 USD
 * demo cash balance and zero holdings, seeded at signup by the
 * on_auth_user_created_portfolio trigger. Holdings stay empty until a
 * Trading/order-placement feature exists; nothing here fabricates a
 * position.
 *
 * Watchlist quotes and market news are live Finnhub calls, fetched
 * independently via Promise.allSettled so a Finnhub outage degrades those
 * two sections gracefully instead of failing the whole page.
 */
export default async function DashboardPage() {
  const [profile, riskProfile, portfolio] = await Promise.all([
    getProfile(),
    getCurrentRiskProfile(),
    getPortfolio(),
  ])

  const [watchlistResult, newsResult] = await Promise.allSettled([getWatchlistQuotes(), getMarketInsight()])
  const watchlist = watchlistResult.status === 'fulfilled' ? watchlistResult.value : null
  const news = newsResult.status === 'fulfilled' ? newsResult.value : null

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
          <>
            <div className="mb-6">
              <OverviewCard portfolio={portfolio} watchlist={watchlist} />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
              <HoldingsList holdings={portfolio.holdings} />
              <AllocationDonut portfolio={portfolio} watchlist={watchlist} />
            </div>
          </>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No portfolio found for this account. If you signed up before this feature shipped, sign out and
              back in, or contact support.
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <WatchlistStrip quotes={watchlist} />
        </div>

        <MarketNews items={news} />

        <p className="mt-8 text-sm text-muted-foreground">
          {riskProfile ? (
            <Link href="/isq" className="underline">
              Retake the questionnaire
            </Link>
          ) : (
            <Link href="/isq" className="underline">
              Take the Investment Suitability Questionnaire
            </Link>
          )}
        </p>
      </div>
    </main>
  )
}
