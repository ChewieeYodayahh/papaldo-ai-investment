import { Bar, Panel, Rows } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Loading placeholders for the dashboard routes, shown by each route's
 * `loading.tsx` inside the app frame while the page's data is fetched
 * (Carlos, 2026-09-25, after the attn skeleton reference). Each one is laid
 * out like the page it stands in for, so nothing jumps when the real
 * content lands.
 */

function Pills({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="shimmer h-7 w-12 rounded-full" />
      ))}
    </div>
  )
}

function ChartPanel() {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <Bar className="h-4 w-40" />
        <Pills count={5} className="hidden sm:flex" />
      </div>
      <Bar className="h-[200px] w-full rounded-xl lg:h-[220px]" />
    </Panel>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4" aria-busy aria-label="Loading dashboard">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr]">
        <div className="grid content-start gap-4">
          <Panel>
            <Bar className="h-4 w-28" />
            <Bar className="h-7 w-52" />
          </Panel>
          <Panel>
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-48" />
            <Bar className="h-3 w-full" />
            <Skeleton className="shimmer h-8 w-full rounded-full" />
          </Panel>
        </div>
        <Panel>
          <Bar className="h-4 w-24" />
          <Pills count={2} />
          <Rows count={4} />
        </Panel>
        <Panel className="lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <Bar className="h-4 w-28" />
            <Skeleton className="shimmer h-7 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bar key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </Panel>
      </div>
      <ChartPanel />
    </div>
  )
}

export function PortfolioSkeleton() {
  return (
    <div className="grid gap-4" aria-busy aria-label="Loading portfolio">
      <Bar className="h-3 w-72 max-w-full" />
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel>
          <Bar className="h-4 w-28" />
          <Bar className="h-7 w-52" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Bar className="h-8" />
            <Bar className="h-8" />
          </div>
        </Panel>
        <ChartPanel />
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel>
          <Bar className="h-4 w-32" />
          <Rows count={4} />
        </Panel>
        <Panel>
          <Bar className="h-4 w-24" />
          <Skeleton className="shimmer mx-auto size-44 rounded-full" />
        </Panel>
      </div>
    </div>
  )
}
