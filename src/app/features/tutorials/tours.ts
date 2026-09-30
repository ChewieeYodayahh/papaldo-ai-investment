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
    { id: 'returns.asset', target: 'returns.asset' },
    { id: 'returns.amounts', target: 'returns.amounts', demo: true },
    { id: 'returns.window', target: 'returns.window' },
    { id: 'returns.ahead', target: 'returns.ahead', demo: true },
    { id: 'returns.result', target: 'returns.result', side: 'top' },
    { id: 'returns.chart', target: 'returns.chart', side: 'top' },
    { id: 'returns.share', target: 'returns.share', side: 'top' },
  ],
  savings: [
    { id: 'savings.goal', target: 'savings.goal', side: 'right' },
    { id: 'savings.result', target: 'savings.result', side: 'left' },
    { id: 'savings.bank', target: 'savings.bank', side: 'right', demo: true },
    { id: 'savings.tax', target: 'savings.tax', side: 'right' },
    { id: 'savings.compare', target: 'savings.compare', side: 'top' },
  ],
  purchasing: [
    { id: 'purchasing.currency', target: 'purchasing.currency', side: 'right' },
    { id: 'purchasing.years', target: 'purchasing.years', side: 'right', demo: true },
    { id: 'purchasing.result', target: 'purchasing.result', side: 'left' },
    { id: 'purchasing.chart', target: 'purchasing.chart', side: 'top' },
    { id: 'purchasing.future', target: 'purchasing.future', side: 'right' },
  ],
  budget: [
    { id: 'budget.region', target: 'budget.region', side: 'right' },
    { id: 'budget.pay', target: 'budget.pay', side: 'right' },
    { id: 'budget.lines', target: 'budget.lines', side: 'right', demo: true },
    { id: 'budget.buckets', target: 'budget.buckets', side: 'left' },
    { id: 'budget.tips', target: 'budget.tips', side: 'top' },
    { id: 'budget.export', target: 'budget.export', side: 'top' },
  ],
  statements: [
    { id: 'statements.sample', target: 'statements.sample', demo: true },
    { id: 'statements.nonprofit', target: 'statements.nonprofit' },
    { id: 'statements.checks', target: 'statements.checks' },
    { id: 'statements.tabs', target: 'statements.tabs' },
    { id: 'statements.export', target: 'statements.export' },
  ],
  dca: [
    { id: 'dca.asset', target: 'dca.asset' },
    { id: 'dca.amount', target: 'dca.amount' },
    { id: 'dca.period', target: 'dca.period', demo: true },
    { id: 'dca.result', target: 'dca.result', side: 'top' },
    { id: 'dca.chart', target: 'dca.chart', side: 'top' },
    { id: 'dca.history', target: 'dca.history', side: 'top' },
  ],
  waiting: [
    { id: 'waiting.inputs', target: 'waiting.inputs', side: 'right', demo: true },
    { id: 'waiting.results', target: 'waiting.results', side: 'left' },
    { id: 'waiting.chart', target: 'waiting.chart', side: 'top' },
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
