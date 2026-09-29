import { Bar, Panel } from '@/components/skeleton-blocks'

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
