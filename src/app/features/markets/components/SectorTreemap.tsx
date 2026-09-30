'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy'
import { Search, X } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { UniverseQuote } from '../api/movers'
import { buildHeatmap, colorStep, formatCap, MAX_STEP, stepFill, type HeatSector, type HeatTile } from '../heatmap'
import { logoUrl } from '@/lib/logos'
import { Change } from './Change'
import { SymbolMark } from './SymbolMark'

type Datum = { name: string; sector?: HeatSector; tile?: HeatTile; children?: Datum[] }
type Box = HierarchyRectangularNode<Datum>

const STEPS = Array.from({ length: MAX_STEP * 2 + 1 }, (_, i) => i - MAX_STEP)
/** How often the map re-reads quotes while the tab is visible. */
const REFRESH_MS = 60_000

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
 * sectors first, each with a header strip, then its stocks inside. A wider
 * gutter between sectors than between stocks, so the groups read as groups.
 * Area is strictly proportional to market cap.
 */
function layoutWide(sectors: HeatSector[], width: number, height: number, header: number): Block[] {
  const root = hierarchy<Datum>({ name: 'root', children: sectors.map(sectorDatum) })
    .sum((d) => d.tile?.size ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  treemap<Datum>()
    .tile(treemapSquarify.ratio(1.2))
    .size([width, height])
    .paddingInner((node) => (node.depth === 0 ? 5 : 1))
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
      .paddingInner(1)
      .paddingTop(header)
      .round(true)(root)
    blocks.push({ node: root as Box, dy })
    dy += height + PHONE_SECTOR_GAP
  }
  return { blocks, height: Math.max(0, dy - PHONE_SECTOR_GAP) }
}

type Hover = { tile: HeatTile; sector: HeatSector; x: number; y: number }

/**
 * The /markets sector heatmap, restyled after TradingView's Stock Heatmap
 * (Carlos, 2026-09-29; reference notes in the vault: stock-heatmap-design).
 *
 *   Tiles     the buyable stocks, grouped by sector, area = market cap,
 *             coloured on a red / grey / green scale by today's move. Big
 *             tiles carry the company logo; labels shrink with the tile and
 *             drop away when it is too small to hold them.
 *   Hover     a card follows the pointer (price, change, market cap, sector),
 *             and every other sector dims.
 *   Legend    each step is a button: pick one or more to show only stocks
 *             that moved that much.
 *   Search    type a ticker or name to find it; Enter opens the stock.
 *   Refresh   quotes are re-read every minute while the tab is visible.
 */
export function SectorTreemap({ quotes }: { quotes: UniverseQuote[] }) {
  const t = useCopy()
  const router = useRouter()
  const sectors = useMemo(() => buildHeatmap(quotes), [quotes])
  const { ref, box } = useBox<HTMLDivElement>()
  const [hover, setHover] = useState<Hover | null>(null)
  const [steps, setSteps] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  // New quotes arrive as new props after each refresh.
  useEffect(() => setUpdatedAt(new Date()), [quotes])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [router])

  const width = box?.width ?? 0
  const compact = width > 0 && width < 640
  const header = compact ? 20 : 22
  const layout = useMemo(() => {
    if (!box || box.width <= 0) return null
    if (compact) return layoutStacked(sectors, box.width, header)
    return box.height > 0 ? { blocks: layoutWide(sectors, box.width, box.height, header), height: null } : null
  }, [sectors, box, compact, header])

  const needle = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!needle) return null
    return new Set(
      sectors.flatMap((s) =>
        s.tiles
          .filter((tile) => tile.symbol.toLowerCase().startsWith(needle) || tile.name.toLowerCase().includes(needle))
          .map((tile) => tile.symbol),
      ),
    )
  }, [sectors, needle])

  /** Whether a tile is in focus under the current filter and search. */
  const lit = (tile: HeatTile) =>
    (steps.length === 0 || steps.includes(colorStep(tile.changePercent))) && (!matches || matches.has(tile.symbol))

  if (sectors.length === 0) return null

  const toggleStep = (step: number) =>
    setSteps((current) => (current.includes(step) ? current.filter((s) => s !== step) : [...current, step]))

  const firstMatch = matches && matches.size > 0 ? [...matches][0] : null

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-3 px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <h2 className="text-base font-medium">{t('mkt.heatmap')}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault()
                if (firstMatch) router.push(`/markets/${encodeURIComponent(firstMatch)}`)
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('mkt.heatmapSearch')}
                aria-label={t('mkt.heatmapSearch')}
                className="h-8 w-40 rounded-full pr-7 pl-8 text-xs md:text-xs"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('mkt.heatmapClear')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </form>
            <Legend active={steps} onToggle={toggleStep} onReset={() => setSteps([])} />
          </div>
        </div>

        {/* Wide: the frame's aspect ratio sets the height and the treemap fills
            it. Phone: the stacked layout sets the height inline (an explicit
            height overrides aspect-ratio), 1:2 until first measured. */}
        <div
          ref={ref}
          className="relative aspect-[1/2] w-full overflow-hidden rounded-xl bg-background sm:aspect-[16/10] xl:aspect-[2/1]"
          style={layout?.height ? { height: layout.height } : undefined}
          onPointerLeave={() => setHover(null)}
        >
          {layout?.blocks.map(({ node, dy }) => (
            <SectorBlock
              key={node.data.name}
              node={node}
              dy={dy}
              header={header}
              compact={compact}
              dimmed={hover !== null && hover.sector.sector !== node.data.name}
              lit={lit}
              onHover={(tile, x, y) => setHover(tile ? { tile, sector: node.data.sector!, x, y } : null)}
            />
          ))}
          {hover && box ? <HoverCard hover={hover} width={box.width} height={layout?.height ?? box.height} /> : null}
        </div>

        <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
          <span>{t('mkt.heatmapNote')}</span>
          {matches ? (
            <span>{t('mkt.heatmapMatches', { count: String(matches.size) })}</span>
          ) : updatedAt ? (
            <span className="figure">
              {t('mkt.heatmapUpdated', {
                time: updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              })}
            </span>
          ) : null}
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
  dimmed,
  lit,
  onHover,
}: {
  node: Box
  dy: number
  header: number
  compact: boolean
  dimmed: boolean
  lit: (tile: HeatTile) => boolean
  onHover: (tile: HeatTile | null, x: number, y: number) => void
}) {
  const sector = node.data.sector!
  const width = node.x1 - node.x0

  return (
    <div className={cn('transition-opacity duration-200', dimmed && 'opacity-45')}>
      <div
        className="absolute flex items-center gap-1.5 overflow-hidden px-1 whitespace-nowrap"
        style={{ left: node.x0, top: node.y0 + dy, width, height: header }}
      >
        <span className="truncate text-[0.6875rem] font-semibold tracking-wide text-foreground/90">{sector.sector}</span>
        {width > 90 ? <Change percent={sector.changePercent} className="text-[0.6875rem]" /> : null}
      </div>
      {node.children?.map((leaf) => (
        <Tile key={leaf.data.name} node={leaf} dy={dy} compact={compact} lit={lit(leaf.data.tile!)} onHover={onHover} />
      ))}
    </div>
  )
}

function Tile({
  node,
  dy,
  compact,
  lit,
  onHover,
}: {
  node: Box
  dy: number
  compact: boolean
  lit: boolean
  onHover: (tile: HeatTile | null, x: number, y: number) => void
}) {
  const tile = node.data.tile!
  const width = node.x1 - node.x0
  const height = node.y1 - node.y0
  const change = `${tile.changePercent > 0 ? '+' : ''}${tile.changePercent.toFixed(2)}%`

  // Label sizes follow the tile, the way TradingView's do.
  const symbolPx = Math.round(Math.min(30, Math.max(9, Math.min(width / 4.2, height / 3.2))))
  const changePx = Math.round(Math.max(8, symbolPx * 0.62))
  const showSymbol = width >= 26 && height >= 16
  const showChange = width >= 40 && height >= symbolPx + changePx + 10
  const showLogo = !compact && width >= 84 && height >= 96
  const logo = showLogo ? logoUrl(tile.symbol) : null

  const report = (event: React.PointerEvent | React.FocusEvent) => {
    const frame = (event.currentTarget as HTMLElement).offsetParent as HTMLElement | null
    const rect = frame?.getBoundingClientRect()
    if ('clientX' in event && rect) onHover(tile, event.clientX - rect.left, event.clientY - rect.top)
    else onHover(tile, node.x0 + width / 2, node.y0 + dy + height / 2)
  }

  return (
    <Link
      href={`/markets/${encodeURIComponent(tile.symbol)}`}
      aria-label={`${tile.symbol}, ${tile.name}, ${change} today`}
      onPointerMove={report}
      onFocus={report}
      className={cn(
        'absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[3px] text-center outline-none',
        'transition-[opacity,filter] duration-200 hover:z-10 hover:brightness-115 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring',
        !lit && 'opacity-25',
      )}
      style={{
        left: node.x0,
        top: node.y0 + dy,
        width,
        height,
        backgroundColor: stepFill(colorStep(tile.changePercent)),
        color: 'var(--heat-text)',
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logo, falls back by hiding itself
        <img
          src={logo}
          alt=""
          referrerPolicy="no-referrer"
          className="mb-1 size-8 rounded-full bg-white/90 object-contain p-1"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      {showSymbol ? (
        <span className="leading-none font-bold tracking-tight [text-shadow:0_1px_1px_rgb(0_0_0/0.25)]" style={{ fontSize: symbolPx }}>
          {tile.symbol}
        </span>
      ) : null}
      {showChange ? (
        <span className="figure leading-none font-medium opacity-95" style={{ fontSize: changePx }}>
          {change}
        </span>
      ) : null}
    </Link>
  )
}

/** The card under the pointer. Flips left/up near the frame's edges so it never clips. */
function HoverCard({ hover, width, height }: { hover: Hover; width: number; height: number }) {
  const t = useCopy()
  const { tile, sector } = hover
  const CARD_W = 232
  const CARD_H = 150
  const left = hover.x + 16 + CARD_W > width ? Math.max(4, hover.x - CARD_W - 12) : hover.x + 16
  const top = hover.y + 16 + CARD_H > height ? Math.max(4, hover.y - CARD_H - 12) : hover.y + 16

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 w-58 rounded-xl bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
      style={{ left, top }}
    >
      <div className="flex items-center gap-2.5">
        <SymbolMark symbol={tile.symbol} className="size-8" />
        <div className="min-w-0">
          <p className="text-sm leading-tight font-semibold">{tile.symbol}</p>
          <p className="truncate text-xs text-muted-foreground">{tile.name}</p>
        </div>
      </div>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">{t('mkt.heatmapPrice')}</dt>
        <dd className="text-right">
          <Money usd={tile.price} className="figure" />
        </dd>
        <dt className="text-muted-foreground">{t('mkt.heatmapChange')}</dt>
        <dd className="text-right">
          <Change percent={tile.changePercent} className="text-xs" />
        </dd>
        <dt className="text-muted-foreground">{t('mkt.heatmapCap')}</dt>
        <dd className="figure text-right">
          {tile.estimatedSize ? t('mkt.heatmapCapUnknown') : `$${formatCap(tile.size)}`}
        </dd>
        <dt className="text-muted-foreground">{sector.sector}</dt>
        <dd className="text-right">
          <Change percent={sector.changePercent} className="text-xs" />
        </dd>
      </dl>
    </div>
  )
}

/** "-3% ▪▪▪▪▪▪▪ +3%": each step toggles a filter; the tiles use the same steps. */
function Legend({ active, onToggle, onReset }: { active: number[]; onToggle: (step: number) => void; onReset: () => void }) {
  const t = useCopy()
  return (
    <div className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground" role="group" aria-label={t('mkt.heatmapFilter')}>
      <span className="figure mr-0.5">-{MAX_STEP}%</span>
      {STEPS.map((step) => {
        const pressed = active.includes(step)
        const label = step === 0 ? '0%' : `${step > 0 ? '+' : ''}${step}%`
        return (
          <button
            key={step}
            type="button"
            aria-pressed={pressed}
            aria-label={t('mkt.heatmapStep', { step: label })}
            onClick={() => onToggle(step)}
            className={cn(
              'h-4 w-5 rounded-[3px] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring',
              pressed && 'ring-2 ring-foreground',
              active.length > 0 && !pressed && 'opacity-40',
            )}
            style={{ backgroundColor: stepFill(step) }}
          />
        )
      })}
      <span className="figure ml-0.5">+{MAX_STEP}%</span>
      {active.length > 0 ? (
        <button type="button" onClick={onReset} className="ml-1 underline-offset-2 hover:text-foreground hover:underline">
          {t('mkt.heatmapShowAll')}
        </button>
      ) : null}
    </div>
  )
}
