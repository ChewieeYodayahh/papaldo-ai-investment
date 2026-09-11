import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Quote } from '@/app/features/markets/api/quotes'
import type { PortfolioSummary } from '@/app/features/trading/api/portfolio'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

function holdingsMarketValue(portfolio: PortfolioSummary, quotes: Quote[] | null): number {
  if (portfolio.holdings.length === 0) return 0
  const bySymbol = new Map((quotes ?? []).map((q) => [q.symbol, q.price]))
  // Falls back to avg_cost per holding when a live quote isn't available
  // (symbol outside the watchlist, or Finnhub didn't respond) -- an honest
  // best-known value rather than dropping the position from the total.
  return portfolio.holdings.reduce((sum, h) => sum + (bySymbol.get(h.symbol) ?? h.avgCost) * h.quantity, 0)
}

export function OverviewCard({
  portfolio,
  watchlist,
}: {
  portfolio: PortfolioSummary
  watchlist: Quote[] | null
}) {
  const holdingsValue = holdingsMarketValue(portfolio, watchlist)
  const accountValue = portfolio.cashBalance + holdingsValue

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{currencyFormatter.format(accountValue)}</div>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Cash</dt>
            <dd className="text-sm font-medium tabular-nums">{currencyFormatter.format(portfolio.cashBalance)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Buying Power</dt>
            <dd className="text-sm font-medium tabular-nums">{currencyFormatter.format(portfolio.cashBalance)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Holdings Value</dt>
            <dd className="text-sm font-medium tabular-nums">{currencyFormatter.format(holdingsValue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Positions</dt>
            <dd className="text-sm font-medium tabular-nums">{portfolio.holdings.length}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">
          Demo balance. Simulated trading only — no real money, no broker orders.
          {portfolio.holdings.length === 0 ? ' All cash until your first simulated trade.' : null}
        </p>
      </CardContent>
    </Card>
  )
}
