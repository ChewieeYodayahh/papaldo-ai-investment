import { Bar, Panel } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

/** `/tools` while it loads: the subtitle line and four tool cards. */
export function ToolsSkeleton() {
  return (
    <>
      <Bar className="mb-4 h-3 w-80 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i} className="py-5">
            <div className="flex items-start justify-between">
              <Skeleton className="shimmer size-11 rounded-xl" />
              <Skeleton className="shimmer h-5 w-24 rounded-full" />
            </div>
            <Bar className="mt-2 h-5 w-48" />
            <Bar className="h-3 w-60 max-w-full" />
            <div className="space-y-2.5 pt-3">
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
              <Bar className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2 pt-4">
              <Skeleton className="shimmer h-10 w-32 rounded-full" />
              <Skeleton className="shimmer h-10 w-28 rounded-full" />
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
