import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'

import { StatementsBuilder } from '../components/StatementsBuilder'

/** `/tools/statements` -- the three financial statements. Browser-only; open to guests. */
export function StatementsPage() {
  return (
    <>
      <TutorialTrigger tour="statements" className="mb-2" />
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Build an income statement, balance sheet and cash-flow statement that tie together, or start from the
        sample to see how they connect. Net income flows into retained earnings, and the cash flow has to end on
        the cash in the balance sheet.
      </p>
      <StatementsBuilder />
    </>
  )
}
