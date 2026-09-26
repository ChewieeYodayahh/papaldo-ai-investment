import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Building blocks for route skeletons (each route's `loading.tsx`), shared
 * by every feature so all loading states shimmer the same way. Laid out like
 * the app's cards: rounded-2xl, borderless.
 */

export function Bar({ className }: { className?: string }) {
  return <Skeleton className={cn('shimmer rounded-md', className)} />
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn('rounded-2xl border-0 py-4', className)}>
      <CardContent className="space-y-3 px-4">{children}</CardContent>
    </Card>
  )
}

export function Rows({ count }: { count: number }) {
  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="shimmer size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Bar className="h-3 w-16" />
            <Bar className="h-2.5 w-32" />
          </div>
          <Bar className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}

/** A labelled input placeholder: label bar over a field-height block. */
export function FieldBlock({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Bar className="h-3 w-24" />
      <Skeleton className="shimmer h-11 w-full rounded-xl" />
    </div>
  )
}
