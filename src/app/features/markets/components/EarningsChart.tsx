'use client'

import { createChart, HistogramSeries, type IChartApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { PanelFrame } from './PanelFrame'

import type { FundamentalPoint } from '../api/symbol'
import { useChartTheme } from './use-chart-theme'

/**
 * Quarterly earnings per share.
 *
 * The only real, dated history this Finnhub plan serves for a symbol -- prices
 * of the past are behind `/stock/candle`, which answers 403 here. Bars are
 * colored per point (green for a profitable quarter, red for a loss) rather
 * than by adding a second series, which is the v5 way to vary bar color.
 */
export function EarningsChart({ points, embedded = false }: { points: FundamentalPoint[]; embedded?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const theme = useChartTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container || !theme || points.length === 0) return

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
      localization: { priceFormatter: (value: number) => `$${value.toFixed(2)}` },
    })

    const series = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'custom', formatter: (v: number) => `$${v.toFixed(2)}`, minMove: 0.01 },
    })

    // `time` is Finnhub's ISO period string, which lightweight-charts reads as
    // a BusinessDay. The series was sorted ascending and de-duplicated upstream.
    series.setData(
      points.map((point) => ({
        time: point.time,
        value: point.value,
        color: point.value >= 0 ? theme.up : theme.down,
      })),
    )
    // Same reason as PriceChart: with autoSize the real width arrives after
    // this effect, so fitting only here crams the bars into part of the canvas.
    const refit = () => chart.timeScale().fitContent()
    chart.timeScale().subscribeSizeChange(refit)
    chart.timeScale().fitContent()

    chartRef.current = chart
    return () => {
      chart.timeScale().unsubscribeSizeChange(refit)
      chartRef.current = null
      chart.remove()
    }
  }, [theme, points])

  if (points.length === 0) {
    return (
      <PanelFrame title="Quarterly earnings" embedded={embedded}>
        <p className="text-sm text-muted-foreground">Finnhub returned no quarterly earnings series for this symbol.</p>
      </PanelFrame>
    )
  }

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <PanelFrame title="Quarterly earnings" embedded={embedded}>
      <p className="mb-3 text-xs text-muted-foreground">
        Earnings per share, {first.time} to {last.time} · {points.length} quarters
      </p>
      <div ref={containerRef} className="h-[220px] w-full" />
      <p className="mt-3 text-xs text-muted-foreground">
        Reported figures from Finnhub, not estimates and not adjusted. This is the real dated history the
        plan provides; price history is not part of it.
      </p>
    </PanelFrame>
  )
}
