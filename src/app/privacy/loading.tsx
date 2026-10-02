import { Bar } from '@/components/skeleton-blocks'

/** The privacy policy: date, title, note, then a column of sections. */
export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-16 md:px-6">
      <Bar className="h-4 w-40" />
      <Bar className="h-12 w-72 max-w-full" />
      <Bar className="h-14 rounded-2xl" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="mt-8 grid gap-3">
          <Bar className="h-6 w-48" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
