'use client'

import { Cell, Pie, PieChart } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

import type { Quote } from '@/app/features/markets/api/quotes'
import type { PortfolioSummary } from '@/app/features/trading/api/portfolio'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

/**
 * Greyed out until the questionnaire is taken (Carlos, 2026-09-11). The split
 * itself is accurate either way -- cash versus positions needs no risk profile
 * to compute -- so this is a signal that the dashboard is not yet tailored,
 * not a claim that the numbers are unknown. The percentages stay readable
 * underneath for exactly that reason.
 */
const MUTED = 'var(--muted-foreground)'

export function AllocationDonut({
  portfolio,
  watchlist,
  muted = false,
}: {
  portfolio: PortfolioSummary
  watchlist: Quote[] | null
  muted?: boolean
}) {
  const bySymbol = new Map((watchlist ?? []).map((q) => [q.symbol, q.price]))
  const holdingSlices = portfolio.holdings.map((h) => ({
    name: h.symbol,
    value: (bySymbol.get(h.symbol) ?? h.avgCost) * h.quantity,
  }))
  const slices = [{ name: 'Cash', value: portfolio.cashBalance }, ...holdingSlices]
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  const toneFor = (i: number) => (muted ? MUTED : COLORS[i % COLORS.length])

  const config: ChartConfig = Object.fromEntries(
    slices.map((s, i) => [s.name, { label: s.name, color: toneFor(i) }]),
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
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              strokeWidth={2}
              // Opacity rather than a second palette: one definition of the
              // colour, dimmed, so dark mode needs no separate muted set.
              opacity={muted ? 0.35 : 1}
            >
              {slices.map((s, i) => (
                <Cell key={s.name} fill={toneFor(i)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="mt-4 space-y-2 text-sm">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: toneFor(i), opacity: muted ? 0.35 : 1 }}
                />
                {s.name}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
              </span>
            </li>
          ))}
        </ul>

        {muted ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Shown in grey until you take the questionnaire. The split is accurate — it is just not shaped
            to a risk profile yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
