import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'

/** /tools/export: three option cards on the left, the file card on the right. */
export function ExportSkeleton() {
  return (
    <div className="grid gap-4">
      <Bar className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 xl:grid-cols-[7fr_4fr]">
        <div className="grid gap-4">
          <Panel>
            <Bar className="h-5 w-48" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Bar className="h-20 rounded-2xl" />
              <Bar className="h-20 rounded-2xl" />
            </div>
          </Panel>
          <Panel>
            <Bar className="h-5 w-36" />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Bar key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </Panel>
          <Panel>
            <Bar className="h-5 w-24" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <FieldBlock key={i} />
              ))}
            </div>
          </Panel>
        </div>
        <Panel>
          <Bar className="h-5 w-24" />
          <FieldBlock />
          <FieldBlock />
          <Bar className="h-10 rounded-full" />
        </Panel>
      </div>
    </div>
  )
}
