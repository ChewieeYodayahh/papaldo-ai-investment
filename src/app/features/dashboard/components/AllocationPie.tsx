'use client'

import { Cell, Pie, PieChart } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useMoneyFormat } from '@/app/features/preferences/components/Money'
import { cn } from '@/lib/utils'

import type { AllocationSlice } from '../portfolio-math'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

/**
 * Where the money sits, by sector, with cash as its own slice.
 *
 * Greyed out until the questionnaire is taken (Carlos, 2026-09-11): the split
 * is accurate either way, so this signals "not tailored yet", not "unknown".
 * Opacity rather than a second palette, so every theme gets it for free.
 */
export function AllocationPie({
  slices,
  muted = false,
  className,
}: {
  slices: AllocationSlice[]
  muted?: boolean
  className?: string
}) {
  const money = useMoneyFormat()
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const tone = (i: number) => (muted ? 'var(--muted-foreground)' : COLORS[i % COLORS.length])
  const config: ChartConfig = Object.fromEntries(slices.map((s, i) => [s.name, { label: s.name, color: tone(i) }]))

  return (
    <div className={cn('grid items-center gap-6 sm:grid-cols-[1fr_auto]', className)}>
      <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[220px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span>{name}</span>
                    <span className="figure">{money.format(Number(value))}</span>
                  </span>
                )}
              />
            }
          />
          <Pie data={slices} dataKey="value" nameKey="name" outerRadius="95%" strokeWidth={2} opacity={muted ? 0.35 : 1}>
            {slices.map((s, i) => (
              <Cell key={s.name} fill={tone(i)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="space-y-1.5 text-[0.8125rem]">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: tone(i), opacity: muted ? 0.35 : 1 }} />
              {s.name}
            </span>
            <span className="figure text-muted-foreground">
              {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
