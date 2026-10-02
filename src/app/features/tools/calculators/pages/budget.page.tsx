import { BudgetPlanner } from '../components/BudgetPlanner'
import { ToolIntro } from '../components/lesson'

/** `/tools/budget` -- the 50/30/20 budget. Client-only; open to guests. */
export function BudgetPage() {
  return (
    <>
      <ToolIntro tour="budget" currency={false} question="tool.budget.q">
        Fill in your month and see how it compares with the 50/30/20 guide: half for needs, 30% for wants, 20% for savings.
      </ToolIntro>
      <BudgetPlanner />
    </>
  )
}
