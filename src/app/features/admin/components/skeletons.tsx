import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="space-y-2">
        <Bar className="h-7 w-48" />
        <Bar className="h-3.5 w-72" />
      </div>
      {action ? <Bar className="h-9 w-32 rounded-full" /> : null}
    </div>
  )
}

function TilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Panel key={i}>
          <Bar className="h-3 w-24" />
          <Bar className="h-7 w-16" />
          <Bar className="h-3 w-28" />
        </Panel>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Panel>
      <Bar className="h-3.5 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bar key={i} className="h-5 w-full" />
      ))}
    </Panel>
  )
}

/** `/admin` */
export function OverviewSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <Bar className="mt-6 mb-3 h-3.5 w-28" />
      <TilesSkeleton />
      <Bar className="mt-6 mb-3 h-3.5 w-20" />
      <TilesSkeleton />
      <Bar className="mt-6 mb-3 h-3.5 w-20" />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel>
          <Bar className="h-4 w-48" />
          <Bar className="h-[200px] w-full" />
        </Panel>
        <Panel>
          <Bar className="h-4 w-40" />
          <Bar className="h-[200px] w-full" />
        </Panel>
      </div>
    </>
  )
}

/** The three log pages: header, filters, table. */
export function LogSkeleton({ tiles = false }: { tiles?: boolean }) {
  return (
    <>
      <HeaderSkeleton action />
      {tiles ? (
        <div className="mb-4">
          <TilesSkeleton />
        </div>
      ) : null}
      <Panel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <FieldBlock key={i} />
          ))}
        </div>
      </Panel>
      <TableSkeleton />
    </>
  )
}

/** `/admin/support` */
export function SupportSkeleton() {
  return (
    <>
      <HeaderSkeleton action />
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Panel key={i}>
            <Bar className="h-3 w-40" />
            <Bar className="h-4 w-64" />
            <Bar className="h-3 w-52" />
            <Bar className="h-12 w-full" />
          </Panel>
        ))}
      </div>
    </>
  )
}

/** `/admin/users` */
export function UsersSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="mb-4">
        <TilesSkeleton />
      </div>
      <TableSkeleton rows={8} />
    </>
  )
}

/** `/admin/resources` */
export function ResourcesSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        <Panel>
          <Bar className="h-3 w-24" />
          <Bar className="h-7 w-40" />
          <Bar className="h-2 w-full rounded-full" />
        </Panel>
        <Panel>
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-20" />
        </Panel>
        <Panel>
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-20" />
        </Panel>
      </div>
      <Bar className="mt-6 mb-3 h-3.5 w-48" />
      <TableSkeleton rows={5} />
      <Bar className="mt-6 mb-3 h-3.5 w-16" />
      <TableSkeleton rows={8} />
    </>
  )
}

/** `/admin/blog` */
export function BlogAdminSkeleton() {
  return (
    <>
      <HeaderSkeleton action />
      <TableSkeleton rows={6} />
    </>
  )
}

/** `/admin/blog/new` and `/admin/blog/[id]` */
export function BlogEditorSkeleton() {
  return (
    <>
      <HeaderSkeleton action />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <Bar className="h-8 w-40" />
          <Bar className="h-[28rem] w-full rounded-xl" />
        </Panel>
        <Panel className="h-fit">
          <FieldBlock />
          <FieldBlock />
          <FieldBlock />
        </Panel>
      </div>
    </>
  )
}
