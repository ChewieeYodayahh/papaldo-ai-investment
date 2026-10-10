import { BudgetPlanner } from '../components/BudgetPlanner'
import { ToolIntro } from '../components/lesson'
import { T } from '@/app/features/userData/preferences/copy'

/** `/tools/budget` -- the 50/30/20 budget. Client-only; open to guests. */
export function BudgetPage() {
  return (
    <>
      <ToolIntro tour="budget" currency={false} question="tool.budget.q">
        <T k="tool.budget.intro" />
      </ToolIntro>
      <BudgetPlanner />
    </>
  )
}
