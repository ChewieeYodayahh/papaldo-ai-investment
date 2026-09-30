import {
  BriefcaseBusiness,
  CalendarRange,
  ChartCandlestick,
  Compass,
  Footprints,
  Hourglass,
  Layers,
  Mountain,
  PiggyBank,
  Rocket,
  Scale,
  Shield,
  Sprout,
  Sunset,
  Telescope,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ChoiceIcon, RiskBand } from '../types'

/** The question bank names icons; this is where the names become lucide icons. */
export const CHOICE_ICON: Record<ChoiceIcon, LucideIcon> = {
  sunset: Sunset,
  briefcase: BriefcaseBusiness,
  sprout: Sprout,
  footprints: Footprints,
  compass: Compass,
  mountain: Mountain,
  'piggy-bank': PiggyBank,
  layers: Layers,
  candlestick: ChartCandlestick,
  hourglass: Hourglass,
  calendar: CalendarRange,
  telescope: Telescope,
  shield: Shield,
  scale: Scale,
  rocket: Rocket,
}

/** One mark per band, matching the choice icons that push toward it. */
export const BAND_ICON: Record<RiskBand, LucideIcon> = { Low: Shield, Medium: Scale, High: Rocket }

/**
 * Where a score sits on 0-100, over the three band segments (0-33, 34-66,
 * 67-100). Segments are muted tokens; the marker is the only accent.
 */
export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, score))
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2.5">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <span className="rounded-l-full bg-muted" />
          <span className="bg-muted" />
          <span className="rounded-r-full bg-muted" />
        </div>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/40"
          style={{ width: `${clamped}%` }}
          aria-hidden
        />
        <span
          className="absolute top-1/2 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-card"
          style={{ left: `${clamped}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 grid grid-cols-3 text-[0.6875rem] text-muted-foreground">
        <span>Conservative</span>
        <span className="text-center">Moderate</span>
        <span className="text-right">Aggressive</span>
      </div>
    </div>
  )
}
