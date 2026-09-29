import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Panel>
        <Bar className="h-6 w-56" />
        <Bar className="h-4 w-80 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldBlock />
          <FieldBlock />
        </div>
        <FieldBlock />
        <Bar className="h-32 rounded-xl" />
      </Panel>
    </div>
  )
}
