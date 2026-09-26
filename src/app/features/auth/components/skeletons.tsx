import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

/** `/profile` while its data loads: identity header, then the two card columns. */
export function ProfileSkeleton() {
  return (
    <div className="grid gap-4">
      <Panel className="py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="shimmer size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-5 w-44" />
            <Bar className="h-3 w-64" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="shimmer h-5 w-48 rounded-full" />
              <Skeleton className="shimmer h-5 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="shimmer h-9 w-28 rounded-full" />
        </div>
      </Panel>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {[3, 3].map((fields, column) => (
          <div key={column} className="grid gap-4">
            <FormPanel fields={fields} />
            <FormPanel fields={column === 0 ? 1 : 2} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FormPanel({ fields }: { fields: number }) {
  return (
    <Panel className="py-5">
      <div className="flex items-center gap-3 pb-2">
        <Skeleton className="shimmer size-9 rounded-xl" />
        <div className="space-y-1.5">
          <Bar className="h-4 w-36" />
          <Bar className="h-3 w-52" />
        </div>
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <FieldBlock key={i} />
      ))}
      <div className="flex justify-end pt-1">
        <Skeleton className="shimmer h-10 w-32 rounded-full" />
      </div>
    </Panel>
  )
}
