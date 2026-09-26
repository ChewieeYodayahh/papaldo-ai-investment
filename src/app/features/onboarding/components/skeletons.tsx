import { Bar, FieldBlock, Panel } from '@/components/skeleton-blocks'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholders for the setup journey, the quiz and its results. The
 * quiz and setup both live in one centered card inside the app frame, so
 * their skeletons are that card.
 */

function JourneyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Panel className="py-6">
        <div className="space-y-5 px-1 sm:px-3">{children}</div>
      </Panel>
    </div>
  )
}

function StepHeader() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Bar className="h-3 w-28" />
        <Bar className="h-3 w-16" />
      </div>
      <Skeleton className="shimmer h-1.5 w-full rounded-full" />
    </div>
  )
}

export function SetupSkeleton() {
  return (
    <JourneyCard>
      <StepHeader />
      <div className="space-y-2 pt-2">
        <Bar className="h-7 w-64" />
        <Bar className="h-3.5 w-80 max-w-full" />
      </div>
      <FieldBlock />
      <FieldBlock />
      <div className="flex justify-between pt-2">
        <Skeleton className="shimmer h-10 w-24 rounded-full" />
        <Skeleton className="shimmer h-10 w-32 rounded-full" />
      </div>
    </JourneyCard>
  )
}

export function QuizSkeleton() {
  return (
    <JourneyCard>
      <StepHeader />
      <div className="space-y-2 pt-2">
        <Bar className="h-7 w-72 max-w-full" />
        <Bar className="h-3.5 w-80 max-w-full" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl p-4 ring-1 ring-foreground/10">
            <Skeleton className="shimmer size-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-56 max-w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="shimmer h-10 w-24 rounded-full" />
        <Skeleton className="shimmer h-10 w-28 rounded-full" />
      </div>
    </JourneyCard>
  )
}

export function ResultsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <Panel className="py-6">
        <div className="flex flex-col items-center gap-3 py-2">
          <Skeleton className="shimmer size-16 rounded-2xl" />
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-72 max-w-full" />
          <Skeleton className="shimmer mt-2 h-2 w-full max-w-md rounded-full" />
        </div>
      </Panel>
      <Panel>
        <Bar className="h-4 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton className="shimmer size-9 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Bar className="h-3 w-72 max-w-full" />
              <Bar className="h-3 w-40" />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}
