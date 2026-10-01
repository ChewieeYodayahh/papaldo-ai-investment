/**
 * Tutorial Mode's tours (Carlos, 2026-09-30). Each step points at an element
 * a page marks with `data-tut="<target>"` and explains it in a line or two;
 * the words live in `copy.ts` under `<step id>.title` / `<step id>.body`.
 *
 * A step whose element is not on screen (hidden at this width, or not
 * rendered for this viewer) is skipped rather than blocking the tour.
 * `demo: true` offers "Show me", which runs what the page registered with
 * `useTutorialDemo(step id, …)` -- a sample value filled in so the effect is
 * visible.
 */

export type TourSide = 'top' | 'bottom' | 'left' | 'right'
export type TourStepDef = { id: string; target: string; side?: TourSide; demo?: boolean }

export const TOUR_IDS = ['returns', 'savings', 'purchasing', 'budget', 'statements', 'dca', 'waiting', 'quiz', 'account', 'markets', 'trade'] as const
export type TourId = (typeof TOUR_IDS)[number]

export const TOURS: Record<TourId, TourStepDef[]> = {
  returns: [
    { id: 'returns.question', target: 'returns.question', side: 'bottom' },
    { id: 'returns.amounts', target: 'returns.amounts', demo: true },
    { id: 'returns.result', target: 'returns.result', side: 'top' },
    { id: 'returns.lesson', target: 'returns.lesson', side: 'top' },
  ],
  savings: [
    { id: 'savings.question', target: 'savings.question', side: 'bottom' },
    { id: 'savings.goal', target: 'savings.goal', side: 'right' },
    { id: 'savings.result', target: 'savings.result', side: 'left' },
    { id: 'savings.compare', target: 'savings.compare', side: 'top' },
  ],
  purchasing: [
    { id: 'purchasing.question', target: 'purchasing.question', side: 'bottom' },
    { id: 'purchasing.years', target: 'purchasing.years', side: 'right', demo: true },
    { id: 'purchasing.result', target: 'purchasing.result', side: 'left' },
    { id: 'purchasing.lesson', target: 'purchasing.lesson', side: 'top' },
  ],
  budget: [
    { id: 'budget.question', target: 'budget.question', side: 'bottom' },
    { id: 'budget.lines', target: 'budget.lines', side: 'right', demo: true },
    { id: 'budget.buckets', target: 'budget.buckets', side: 'left' },
    { id: 'budget.lesson', target: 'budget.lesson', side: 'top' },
  ],
  statements: [
    { id: 'statements.question', target: 'statements.question', side: 'bottom' },
    { id: 'statements.sample', target: 'statements.sample', demo: true },
    { id: 'statements.checks', target: 'statements.checks' },
    { id: 'statements.lesson', target: 'statements.lesson', side: 'top' },
  ],
  dca: [
    { id: 'dca.question', target: 'dca.question', side: 'bottom' },
    { id: 'dca.period', target: 'dca.period', demo: true },
    { id: 'dca.result', target: 'dca.result', side: 'top' },
    { id: 'dca.history', target: 'dca.history', side: 'top' },
  ],
  waiting: [
    { id: 'waiting.question', target: 'waiting.question', side: 'bottom' },
    { id: 'waiting.inputs', target: 'waiting.inputs', side: 'right', demo: true },
    { id: 'waiting.results', target: 'waiting.results', side: 'left' },
    { id: 'waiting.lesson', target: 'waiting.lesson', side: 'top' },
  ],
  quiz: [
    { id: 'quiz.question', target: 'quiz.question' },
    { id: 'quiz.choices', target: 'quiz.choices', side: 'top' },
    { id: 'quiz.progress', target: 'quiz.progress' },
  ],
  account: [
    { id: 'account.nav', target: 'account.nav', side: 'right' },
    { id: 'account.bell', target: 'account.bell' },
    { id: 'account.settings', target: 'account.settings' },
    { id: 'account.menu', target: 'account.menu' },
  ],
  markets: [
    { id: 'markets.search', target: 'markets.search' },
    { id: 'markets.table', target: 'markets.table', side: 'top' },
    { id: 'markets.movers', target: 'markets.movers', side: 'left' },
    { id: 'markets.heatmap', target: 'markets.heatmap', side: 'top' },
    { id: 'markets.benchmarks', target: 'markets.benchmarks', side: 'top' },
  ],
  trade: [
    { id: 'trade.chart', target: 'trade.chart' },
    { id: 'trade.stats', target: 'trade.stats', side: 'top' },
    { id: 'trade.side', target: 'trade.side', side: 'left' },
    { id: 'trade.quantity', target: 'trade.quantity', side: 'left' },
    { id: 'trade.review', target: 'trade.review', side: 'left' },
  ],
}

/** Where each tour runs, for starting one from the Tools hub. */
export const TOUR_HOME: Record<TourId, string> = {
  returns: '/tools/returns',
  savings: '/tools/savings',
  purchasing: '/tools/purchasing-power',
  budget: '/tools/budget',
  statements: '/tools/statements',
  dca: '/tools/dca',
  waiting: '/tools/cost-of-waiting',
  quiz: '/isq',
  account: '/dashboard',
  markets: '/markets',
  trade: '/markets',
}
