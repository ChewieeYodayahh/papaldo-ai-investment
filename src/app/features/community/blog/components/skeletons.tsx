import { Bar, Panel } from '@/components/skeleton-blocks'

/** /blog: the lead article, then a grid of cards. */
export function BlogIndexSkeleton() {
  return (
    <div className="grid gap-4">
      <Panel>
        <Bar className="h-3 w-40" />
        <Bar className="h-8 w-3/4" />
        <Bar className="h-4 w-2/3" />
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Panel key={i}>
            <Bar className="h-3 w-32" />
            <Bar className="h-5 w-4/5" />
            <Bar className="h-4 w-full" />
          </Panel>
        ))}
      </div>
    </div>
  )
}

/** /blog/[slug]: title, byline and the body. */
export function BlogPostSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <Bar className="h-9 w-32 rounded-full" />
      <div className="grid gap-3">
        <Bar className="h-9 w-4/5" />
        <Bar className="h-5 w-2/3" />
        <Bar className="h-3 w-48" />
      </div>
      <Panel>
        {Array.from({ length: 8 }, (_, i) => (
          <Bar key={i} className="h-4 w-full" />
        ))}
      </Panel>
    </div>
  )
}
