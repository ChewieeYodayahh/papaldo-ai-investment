import { Bar, Panel, Rows } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

/** /u/[username]: the header card, then the balance, allocation bar and holdings. */
export function MemberProfileSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <Panel className="py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="shimmer size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-5 w-40" />
            <Bar className="h-3 w-56" />
            <Skeleton className="shimmer h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="shimmer h-9 w-32 rounded-full" />
        </div>
      </Panel>
      <Panel>
        <div className="grid gap-4">
          <Bar className="h-3 w-40" />
          <Bar className="h-8 w-48" />
          <Skeleton className="shimmer h-3 rounded-full" />
          <Rows count={4} />
        </div>
      </Panel>
    </div>
  )
}

/** /community: the intro line and the chat panel with a few message bubbles. */
export function CommunitySkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-3">
      <Bar className="h-4 w-2/3" />
      <Panel>
        <div className="grid h-[min(70svh,640px)] content-end gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Bar key={i} className={i % 2 ? 'ml-auto h-10 w-1/2 rounded-2xl' : 'h-10 w-2/3 rounded-2xl'} />
          ))}
          <Bar className="h-10 rounded-xl" />
        </div>
      </Panel>
    </div>
  )
}
