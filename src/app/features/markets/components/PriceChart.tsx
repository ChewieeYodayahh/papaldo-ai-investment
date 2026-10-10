'use client'

import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Candle } from '../api/candles'
import { useChartTheme } from './use-chart-theme'
import { T } from '@/app/features/userData/preferences/copy'

/** Approximate trading days per window. Labels are what the buttons show. */
const RANGES = [
  { label: '1M', bars: 21 },
  { label: '3M', bars: 63 },
  { label: '6M', bars: 126 },
  { label: '1Y', bars: 260 },
] as const

type RangeLabel = (typeof RANGES)[number]['label']

/**
 * Daily candles.
 *
 * Real daily OHLCV from Alpaca. The generated placeholder series this used to
 * render, and every "sample data" notice that went with it, was deleted on
 * 2026-09-11 once Alpaca's history endpoint was verified working.
 *
 * Switching range re-feeds the series from data already in the browser, so it
 * is instant and costs no API call. It sets the data rather than moving the
 * visible window on purpose: a chart set up and then windowed in the same
 * commit loses the window to the chart's own initial fit pass, which shows up
 * as "opens on the full year, but every later click works".
 */
export function PriceChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const theme = useChartTheme()
  const [range, setRange] = useState<RangeLabel>('3M')

  const visible = useMemo(() => {
    const bars = RANGES.find((r) => r.label === range)?.bars ?? candles.length
    return candles.slice(-bars)
  }, [candles, range])

  // --- chart lifecycle: created once per theme, never per data change --------
  useEffect(() => {
    const container = containerRef.current
    if (!container || !theme) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: theme.transparent },
        textColor: theme.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: { borderColor: theme.border },
      timeScale: { borderColor: theme.border },
      localization: { priceFormatter: (price: number) => `$${price.toFixed(2)}` },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
    })

    // Refit whenever the time scale's width actually changes.
    //
    // With autoSize the first real layout arrives after this effect, so a
    // fitContent() called here alone fits against a width the chart does not
    // have yet -- the bars end up crammed into a fraction of the canvas. This
    // is the signal that the width is now known; keeping it subscribed also
    // makes window resizes refit instead of leaving dead space.
    const refit = () => chart.timeScale().fitContent()
    chart.timeScale().subscribeSizeChange(refit)

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.timeScale().unsubscribeSizeChange(refit)
      seriesRef.current = null
      chartRef.current = null
      chart.remove()
    }
  }, [theme])

  // --- data: the selected slice, refitted each time -------------------------
  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series || visible.length === 0) return

    // Times are ISO date strings, which lightweight-charts reads as
    // BusinessDay. They are already ascending and unique.
    series.setData(visible)
    chart.timeScale().fitContent()
  }, [visible, theme])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground"><T k="sym.price" /></CardTitle>
          <p className="mt-1 text-xs text-muted-foreground"><T k="sym.candles" /></p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-3 flex gap-1">
          {RANGES.map((option) => (
            <Button
              key={option.label}
              type="button"
              size="sm"
              variant={option.label === range ? 'default' : 'ghost'}
              onClick={() => setRange(option.label)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div ref={containerRef} className="h-[320px] w-full" />

        <p className="mt-3 text-xs text-muted-foreground">
          Daily open, high, low and close from Alpaca. Today’s bar can lag by about 15 minutes on this
          plan; the price above it is live.
        </p>
      </CardContent>
    </Card>
  )
}
