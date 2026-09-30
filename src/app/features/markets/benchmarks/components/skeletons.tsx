import { Bar, Panel } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

/** `/markets/benchmarks` while it loads: controls, four summary cards, the chart. */
export function BenchmarksSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto space-y-1.5">
          <Bar className="h-3 w-80 max-w-full" />
          <Bar className="h-2.5 w-24" />
        </div>
        <Skeleton className="shimmer h-7 w-56 rounded-full" />
        <Skeleton className="shimmer h-7 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i}>
            <Bar className="h-3.5 w-28" />
            <Bar className="h-2.5 w-14" />
            <Bar className="h-7 w-24" />
            <Bar className="h-2.5 w-32" />
          </Panel>
        ))}
      </div>
      <Panel>
        <Bar className="h-4 w-40" />
        <Skeleton className="shimmer h-[280px] w-full rounded-xl sm:h-[360px]" />
      </Panel>
    </div>
  )
}
