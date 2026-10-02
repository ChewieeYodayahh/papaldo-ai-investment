import { Bar, Panel } from '@/components/skeleton-blocks'

/** How it's built: the title and the developer's card side by side, then tiles. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="grid gap-4">
          <Bar className="h-4 w-28" />
          <Bar className="h-12 w-72 max-w-full" />
          <Bar className="h-4 w-96 max-w-full" />
          <Bar className="h-4 w-80 max-w-full" />
        </div>
        <Panel>
          <div className="flex items-center gap-4">
            <Bar className="size-16 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Bar className="h-6 w-48" />
              <Bar className="h-4 w-56 max-w-full" />
            </div>
          </div>
          <Bar className="h-20 rounded-xl" />
        </Panel>
      </div>
      <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Bar key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
