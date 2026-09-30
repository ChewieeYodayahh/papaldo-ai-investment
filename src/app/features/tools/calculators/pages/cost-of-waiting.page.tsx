import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'

import { CostOfWaiting } from '../components/CostOfWaiting'

/** `/tools/cost-of-waiting` -- starting now vs 5, 10 or 15 years later. Open to guests. */
export function CostOfWaitingPage() {
  return (
    <>
      <TutorialTrigger tour="waiting" className="mb-2" />
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        The same monthly savings, started today or a few years from now. See what the wait costs by retirement.
      </p>
      <CostOfWaiting />
    </>
  )
}
