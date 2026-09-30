import { Bar, Panel } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

function ToolCardSkeleton() {
  return (
    <Panel className="py-5">
      <div className="flex items-start justify-between">
        <Skeleton className="shimmer size-11 rounded-xl" />
        <Skeleton className="shimmer h-5 w-24 rounded-full" />
      </div>
      <Bar className="mt-2 h-5 w-48" />
      <Bar className="h-3 w-60 max-w-full" />
      <div className="space-y-2.5 pt-3">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="shimmer h-10 w-32 rounded-full" />
      </div>
    </Panel>
  )
}

/** `/tools` while it loads: the subtitle, one open section of cards, then the closed sections. */
export function ToolsSkeleton() {
  return (
    <>
      <Bar className="mb-4 h-3 w-80 max-w-full" />
      <div className="grid gap-3">
        <div className="rounded-2xl px-4 pb-4 ring-1 ring-foreground/5">
          <Bar className="my-4 h-5 w-40" />
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ToolCardSkeleton key={i} />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="shimmer h-14 rounded-2xl" />
        ))}
      </div>
    </>
  )
}
