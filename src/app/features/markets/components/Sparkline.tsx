'use client'

import { AreaSeries, createChart, type IChartApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import type { Candle } from '../api/candles'
import { useChartTheme, withAlpha } from './use-chart-theme'

/**
 * A thumbnail of recent closes. Real Alpaca daily bars, same source as the
 * full chart on the detail page.
 *
 * Everything that makes a chart readable on its own is switched off here --
 * axes, grid, crosshair, pan and zoom. A sparkline in a tile is a shape, not
 * an instrument; leaving the interactions on lets a stray scroll over a card
 * silently desynchronise it from every other tile in the grid.
 */
export function Sparkline({ candles, rising }: { candles: Candle[]; rising: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const theme = useChartTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container || !theme || candles.length === 0) return

    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { color: theme.transparent }, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScale: false,
      handleScroll: false,
    })

    const tone = rising ? theme.up : theme.down
    const series = chart.addSeries(AreaSeries, {
      lineColor: tone,
      topColor: withAlpha(tone, 0.25),
      bottomColor: withAlpha(tone, 0),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    series.setData(candles.map((c) => ({ time: c.time, value: c.close })))

    // Same first-layout race as the full charts: with autoSize the real width
    // lands after this effect, so fitting only here squashes the line.
    const refit = () => chart.timeScale().fitContent()
    chart.timeScale().subscribeSizeChange(refit)
    chart.timeScale().fitContent()

    chartRef.current = chart
    return () => {
      chart.timeScale().unsubscribeSizeChange(refit)
      chartRef.current = null
      chart.remove()
    }
  }, [theme, candles, rising])

  if (candles.length === 0) {
    return <div className="h-12 w-full" aria-hidden />
  }

  return <div ref={containerRef} className="h-12 w-full" />
}
