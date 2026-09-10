'use client'

import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Candle, CandleSource } from '../api/candles.mock'
import { useChartTheme } from './use-chart-theme'

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
 * `source` decides the labelling, and the caller must pass it honestly. While
 * it is `'sample'` the bars before today are generated, not observed — see
 * `api/candles.mock.ts`. When a real provider lands, pass `'live'` and the
 * sample-data notices disappear on their own.
 *
 * Switching range re-feeds the series from data already in the browser, so it
 * is instant and costs no API call. It sets the data rather than moving the
 * visible window on purpose: a chart set up and then windowed in the same
 * commit loses the window to the chart's own initial fit pass, which shows up
 * as "opens on the full year, but every later click works".
 */
export function PriceChart({ candles, source }: { candles: Candle[]; source: CandleSource }) {
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Price</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Daily candles</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {source === 'sample' ? 'Sample data' : 'Live'}
        </Badge>
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

        {source === 'sample' ? (
          <p className="mt-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Sample data.</strong> This Finnhub plan does not include
            historical candles, so the bars before today are generated for layout and are not real prices.
            Today’s bar and the price above it are live. A real history provider replaces this.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
