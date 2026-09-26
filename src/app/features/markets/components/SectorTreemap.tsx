'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy'

import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

import type { UniverseQuote } from '../api/movers'
import { buildHeatmap, colorStep, MAX_STEP, stepFill, type HeatSector, type HeatTile } from '../heatmap'
import { Change } from './Change'

type Datum = { name: string; sector?: HeatSector; tile?: HeatTile; children?: Datum[] }
type Box = HierarchyRectangularNode<Datum>

const STEPS = Array.from({ length: MAX_STEP * 2 + 1 }, (_, i) => i - MAX_STEP)

/** Watches an element's box. Null until the first measurement, so SSR renders an empty frame. */
function useBox<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [box, setBox] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBox((prev) =>
        prev && Math.round(prev.width) === Math.round(width) && Math.round(prev.height) === Math.round(height)
          ? prev
          : { width, height },
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, box }
}

/** A sector's laid-out box, shifted down by `dy` when sectors are stacked. */
type Block = { node: Box; dy: number }

function sectorDatum(sector: HeatSector): Datum {
  return { name: sector.sector, sector, children: sector.tiles.map((tile) => ({ name: tile.symbol, tile })) }
}

/**
 * Wide screens: one squarified treemap (d3-hierarchy) for everything --
 * sectors first, each with a header strip, then its stocks inside. Padding is
 * per depth, a wider gutter between sectors than between stocks, so the
 * groups read as groups. Area is strictly proportional to market cap.
 */
function layoutWide(sectors: HeatSector[], width: number, height: number, header: number): Block[] {
  const root = hierarchy<Datum>({ name: 'root', children: sectors.map(sectorDatum) })
    .sum((d) => d.tile?.size ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  treemap<Datum>()
    .tile(treemapSquarify.ratio(1.2))
    .size([width, height])
    .paddingInner((node) => (node.depth === 0 ? 6 : 2))
    .paddingTop((node) => (node.depth === 1 ? header : 0))
    .round(true)(root)

  return (root.children ?? []).map((node) => ({ node: node as Box, dy: 0 }))
}

/**
 * Phones: sectors stacked, each full width. A sector's height follows its
 * share of the total cap but never drops below half the width -- with one
 * strict treemap, Technology's weight squeezed Finance and FMCG into a strip
 * of 20px tiles nobody could tap (2026-09-26). Within a sector, area is still
 * proportional to cap.
 */
const PHONE_HEIGHT_PER_WIDTH = 1.5
const PHONE_MIN_SECTOR_PER_WIDTH = 0.5
const PHONE_SECTOR_GAP = 10

function layoutStacked(sectors: HeatSector[], width: number, header: number): { blocks: Block[]; height: number } {
  const total = sectors.reduce((sum, s) => sum + s.tiles.reduce((acc, t) => acc + t.size, 0), 0) || 1
  const blocks: Block[] = []
  let dy = 0
  for (const sector of sectors) {
    const share = sector.tiles.reduce((acc, t) => acc + t.size, 0) / total
    const height = Math.round(Math.max(width * PHONE_MIN_SECTOR_PER_WIDTH, width * PHONE_HEIGHT_PER_WIDTH * share)) + header
    const root = hierarchy<Datum>(sectorDatum(sector))
      .sum((d) => d.tile?.size ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    treemap<Datum>()
      .tile(treemapSquarify.ratio(1.2))
      .size([width, height])
      .paddingInner(2)
      .paddingTop(header)
      .round(true)(root)
    blocks.push({ node: root as Box, dy })
    dy += height + PHONE_SECTOR_GAP
  }
  return { blocks, height: Math.max(0, dy - PHONE_SECTOR_GAP) }
}

/**
 * The /markets sector heatmap, after Perplexity Finance's: the buyable
 * stocks grouped by sector, each tile sized by market cap and coloured by
 * today's move on a -3% .. +3% scale. Tiles link to the stock's trade page.
 *
 * Phone: the frame is taller than wide (4:5) so tiles stay tappable, headers
 * shrink, and labels drop away on tiles too small to hold them rather than
 * overflowing.
 */
export function SectorTreemap({ quotes }: { quotes: UniverseQuote[] }) {
  const t = useCopy()
  const sectors = useMemo(() => buildHeatmap(quotes), [quotes])
  const { ref, box } = useBox<HTMLDivElement>()
  const [hovered, setHovered] = useState<HeatTile | null>(null)

  const width = box?.width ?? 0
  const compact = width > 0 && width < 640
  const header = compact ? 20 : 24
  const layout = useMemo(() => {
    if (!box || box.width <= 0) return null
    if (compact) return layoutStacked(sectors, box.width, header)
    return box.height > 0 ? { blocks: layoutWide(sectors, box.width, box.height, header), height: null } : null
  }, [sectors, box, compact, header])

  if (sectors.length === 0) return null

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-3 px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-base font-medium">{t('mkt.heatmap')}</h2>
          <Legend />
        </div>

        {/* Wide: the frame's aspect ratio sets the height and the treemap fills
            it. Phone: the stacked layout sets the height inline (an explicit
            height overrides aspect-ratio), 1:2 until first measured. */}
        <div
          ref={ref}
          className="relative aspect-[1/2] w-full overflow-hidden rounded-xl sm:aspect-[16/10] xl:aspect-[2/1]"
          style={layout?.height ? { height: layout.height } : undefined}
          onPointerLeave={() => setHovered(null)}
        >
          {layout?.blocks.map(({ node, dy }) => (
            <SectorBlock key={node.data.name} node={node} dy={dy} header={header} compact={compact} onHover={setHovered} />
          ))}
        </div>

        {/* One line of detail for whatever is under the pointer; fixed height so nothing jumps. */}
        <div className="flex min-h-5 flex-wrap items-center gap-x-2 px-1 text-xs text-muted-foreground">
          {hovered ? (
            <>
              <span className="font-semibold text-foreground">{hovered.symbol}</span>
              <span className="max-w-[16rem] truncate">{hovered.name}</span>
              <Money usd={hovered.price} className="figure text-foreground" />
              <Change percent={hovered.changePercent} className="text-xs" />
            </>
          ) : (
            <span>{t('mkt.heatmapNote')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SectorBlock({
  node,
  dy,
  header,
  compact,
  onHover,
}: {
  node: Box
  dy: number
  header: number
  compact: boolean
  onHover: (tile: HeatTile | null) => void
}) {
  const sector = node.data.sector!
  const width = node.x1 - node.x0

  return (
    <>
      <div
        className="absolute flex items-center gap-1.5 overflow-hidden px-0.5 whitespace-nowrap"
        style={{ left: node.x0, top: node.y0 + dy, width, height: header }}
      >
        <span className="truncate text-xs font-semibold">{sector.sector}</span>
        {width > 90 ? <Change percent={sector.changePercent} className="text-xs" /> : null}
      </div>
      {node.children?.map((leaf) => (
        <Tile key={leaf.data.name} node={leaf} dy={dy} compact={compact} onHover={onHover} />
      ))}
    </>
  )
}

function Tile({
  node,
  dy,
  compact,
  onHover,
}: {
  node: Box
  dy: number
  compact: boolean
  onHover: (tile: HeatTile | null) => void
}) {
  const tile = node.data.tile!
  const width = node.x1 - node.x0
  const height = node.y1 - node.y0
  const showSymbol = width >= 28 && height >= 16
  const showChange = width >= 44 && height >= 32
  const large = width >= 120 && height >= 72 && !compact
  const change = `${tile.changePercent > 0 ? '+' : ''}${tile.changePercent.toFixed(2)}%`

  return (
    <Link
      href={`/markets/${encodeURIComponent(tile.symbol)}`}
      aria-label={`${tile.symbol}, ${tile.name}, ${change} today`}
      title={`${tile.symbol} · ${tile.name} · ${change}${tile.estimatedSize ? ' · size estimated' : ''}`}
      onPointerEnter={() => onHover(tile)}
      onFocus={() => onHover(tile)}
      className="absolute flex flex-col justify-between overflow-hidden rounded-[5px] p-1.5 text-foreground outline-none transition-[box-shadow,filter] hover:z-10 hover:brightness-110 hover:ring-2 hover:ring-foreground/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
      style={{ left: node.x0, top: node.y0 + dy, width, height, backgroundColor: stepFill(colorStep(tile.changePercent)) }}
    >
      {showSymbol ? (
        <span
          className={cn(
            'leading-none font-bold tracking-tight',
            large ? 'text-lg' : width >= 64 && height >= 40 ? 'text-sm' : 'text-[0.625rem]',
          )}
        >
          {tile.symbol}
        </span>
      ) : null}
      {showChange ? (
        <span className={cn('figure leading-none font-medium opacity-90', large ? 'text-sm' : 'text-[0.625rem]')}>
          {change}
        </span>
      ) : null}
    </Link>
  )
}

/** "-3% ▪▪▪▪▪▪▪ +3%", the same seven steps the tiles use. */
function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground" aria-label="Colour scale from -3% to +3%">
      <span className="figure">-{MAX_STEP}%</span>
      {STEPS.map((step) => (
        <span key={step} className="size-2.5 rounded-[2px]" style={{ backgroundColor: stepFill(step) }} aria-hidden />
      ))}
      <span className="figure">+{MAX_STEP}%</span>
    </div>
  )
}
