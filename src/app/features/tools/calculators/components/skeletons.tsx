import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'

/** /tools/returns: the inputs card, then summary figures and the chart. */
export function ReturnsSkeleton() {
  return (
    <div className="grid gap-4">
      <Bar className="h-4 w-96 max-w-full" />
      <Panel className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FieldBlock className="md:col-span-2" />
        <FieldBlock />
        <FieldBlock />
      </Panel>
      <Panel className="grid gap-4">
        <Bar className="h-10 w-60" />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Bar key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Bar className="h-[240px] rounded-xl" />
      </Panel>
    </div>
  )
}

/** /tools/savings: inputs on the left, the answer and its chart on the right. */
export function SavingsSkeleton() {
  return (
    <div className="grid gap-4">
      <Bar className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
        <Panel className="grid gap-4">
          <FieldBlock />
          <div className="grid grid-cols-2 gap-3">
            <FieldBlock />
            <FieldBlock />
          </div>
          <FieldBlock />
          <FieldBlock />
        </Panel>
        <Panel className="grid gap-4">
          <Bar className="h-24 rounded-2xl" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Bar key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Bar className="h-[200px] rounded-xl" />
        </Panel>
      </div>
    </div>
  )
}
