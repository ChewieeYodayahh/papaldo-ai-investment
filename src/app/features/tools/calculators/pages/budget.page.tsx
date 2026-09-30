import { BudgetPlanner } from '../components/BudgetPlanner'

/** `/tools/budget` -- the 50/30/20 budget. Client-only; open to guests. */
export function BudgetPage() {
  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Split take-home pay the 50/30/20 way: half for needs, 30% for wants, 20% for savings and paying down debt.
        Fill in your month and see where it lands.
      </p>
      <BudgetPlanner />
    </>
  )
}
