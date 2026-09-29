'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const activityConfig = {
  ok: { label: 'Succeeded', color: 'var(--chart-1)' },
  errors: { label: 'Failed', color: 'var(--loss)' },
} satisfies ChartConfig

const ordersConfig = { orders: { label: 'Orders', color: 'var(--chart-2)' } } satisfies ChartConfig

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', timeZone: 'Asia/Manila' })
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** External API calls per hour over the last day, failures stacked on top. */
export function ActivityChart({ data }: { data: Array<{ hour: string; calls: number; errors: number }> }) {
  const rows = data.map((d) => ({ hour: d.hour, ok: d.calls - d.errors, errors: d.errors }))
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">External calls, last 24 hours</CardTitle>
        <CardDescription className="text-xs">Alpaca, Finnhub, the exchange rate and AI, per hour (Manila time)</CardDescription>
      </CardHeader>
      <CardContent className="px-3">
        <ChartContainer config={activityConfig} className="aspect-auto h-[200px] w-full">
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={hourLabel} />
            <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => hourLabel(p?.[0]?.payload?.hour ?? '')} />} />
            <Bar dataKey="ok" stackId="calls" fill="var(--color-ok)" radius={[0, 0, 3, 3]} isAnimationActive={false} />
            <Bar dataKey="errors" stackId="calls" fill="var(--color-errors)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Simulated orders per day over the last two weeks. */
export function OrdersChart({ data }: { data: Array<{ day: string; orders: number }> }) {
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Orders, last 14 days</CardTitle>
        <CardDescription className="text-xs">Simulated fills across every account</CardDescription>
      </CardHeader>
      <CardContent className="px-3">
        <ChartContainer config={ordersConfig} className="aspect-auto h-[200px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={16} tickFormatter={dayLabel} />
            <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => dayLabel(p?.[0]?.payload?.day ?? '')} />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
