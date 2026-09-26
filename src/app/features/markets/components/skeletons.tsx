import { Skeleton } from '@/components/ui/skeleton'
import { Bar, Panel, Rows } from '@/components/skeleton-blocks'

/** Loading placeholders for /markets and /markets/[symbol]. See dashboard/components/skeletons.tsx. */

export function MarketsSkeleton() {
  return (
    <div className="grid gap-4" aria-busy aria-label="Loading markets">
      <Bar className="h-3 w-96 max-w-full" />
      <Panel>
        <Bar className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </Panel>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-4">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <Bar className="h-4 w-36" />
              <div className="hidden gap-2 sm:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="shimmer h-7 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <Rows count={8} />
          </Panel>
          {/* The sector heatmap: same frame ratios as SectorTreemap, so nothing jumps. */}
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <Bar className="h-4 w-32" />
              <Bar className="h-2.5 w-36" />
            </div>
            <Skeleton className="shimmer aspect-[1/2] w-full rounded-xl sm:aspect-[16/10] xl:aspect-[2/1]" />
          </Panel>
        </div>
        <div className="grid gap-4">
          <Panel>
            <Bar className="h-4 w-28" />
            <Rows count={5} />
          </Panel>
          <Panel>
            <Bar className="h-4 w-28" />
            <Rows count={5} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function SymbolSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4" aria-busy aria-label="Loading symbol">
      <div className="flex items-center gap-3">
        <Skeleton className="shimmer size-12 rounded-full" />
        <div className="space-y-2">
          <Bar className="h-5 w-40" />
          <Bar className="h-3 w-56" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel>
          <Bar className="h-80 w-full rounded-xl" />
        </Panel>
        <Panel>
          <Bar className="h-4 w-24" />
          <Bar className="h-9 w-full" />
          <Bar className="h-9 w-full" />
          <Skeleton className="shimmer h-9 w-full rounded-lg" />
        </Panel>
      </div>
    </div>
  )
}
