'use client'

import { Cell, Pie, PieChart } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

import type { FinnhubQuote } from '@/app/core/services/finnhub'
import type { PortfolioSummary } from '../api/portfolio'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function AllocationDonut({
  portfolio,
  watchlist,
}: {
  portfolio: PortfolioSummary
  watchlist: FinnhubQuote[] | null
}) {
  const bySymbol = new Map((watchlist ?? []).map((q) => [q.symbol, q.current]))
  const holdingSlices = portfolio.holdings.map((h) => ({
    name: h.symbol,
    value: (bySymbol.get(h.symbol) ?? h.avgCost) * h.quantity,
  }))
  const slices = [{ name: 'Cash', value: portfolio.cashBalance }, ...holdingSlices]
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  const config: ChartConfig = Object.fromEntries(
    slices.map((s, i) => [s.name, { label: s.name, color: COLORS[i % COLORS.length] }]),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} strokeWidth={2}>
              {slices.map((s, i) => (
                <Cell key={s.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="mt-4 space-y-2 text-sm">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {s.name}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
