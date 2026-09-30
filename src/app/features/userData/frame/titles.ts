import type { CopyKey } from '@/app/features/userData/preferences/copy'

/**
 * What the header says on each route. Home is the only page that greets;
 * everywhere else the header names the page (Carlos, 2026-09-25). Shared by
 * the app header and the signed-out frame, which has no header of its own.
 */
export function titleFor(pathname: string): CopyKey | 'greeting' {
  if (pathname.startsWith('/portfolio')) return 'page.portfolio'
  if (pathname === '/markets') return 'page.markets'
  if (pathname.startsWith('/markets/benchmarks')) return 'page.benchmarks'
  if (pathname.startsWith('/markets/')) return 'page.trade'
  if (pathname.startsWith('/profile')) return 'page.profile'
  if (pathname.startsWith('/tools/returns')) return 'page.returns'
  if (pathname.startsWith('/tools/savings')) return 'page.savings'
  if (pathname.startsWith('/tools/export')) return 'page.export'
  if (pathname.startsWith('/tools/purchasing-power')) return 'page.purchasingPower'
  if (pathname.startsWith('/tools/budget')) return 'page.budget'
  if (pathname.startsWith('/tools/statements')) return 'page.statements'
  if (pathname.startsWith('/community')) return 'page.community'
  if (pathname.startsWith('/u/')) return 'page.member'
  if (pathname.startsWith('/blog')) return 'page.blog'
  if (pathname.startsWith('/support')) return 'page.support'
  if (pathname.startsWith('/tools')) return 'page.tools'
  if (pathname.startsWith('/isq/results')) return 'page.results'
  if (pathname.startsWith('/isq')) return 'page.quiz'
  if (pathname.startsWith('/onboarding')) return 'page.setup'
  return 'greeting'
}
