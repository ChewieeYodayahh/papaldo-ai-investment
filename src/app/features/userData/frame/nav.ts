import {
  Calculator,
  ChartNoAxesCombined,
  ChartSpline,
  ClipboardList,
  Download,
  House,
  LayoutGrid,
  LayoutList,
  MessagesSquare,
  Newspaper,
  PiggyBank,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { CopyKey } from '@/app/features/userData/preferences/copy'

export type NavLeaf = { href: string; label: CopyKey; icon: LucideIcon; also?: string[]; exact?: boolean }
export type NavGroup = { label: CopyKey; icon: LucideIcon; href: string; children: NavLeaf[] }

/** Every tool, in the order the sidebar lists them. The first is the Tools page itself. */
export const TOOL_LINKS: NavLeaf[] = [
  { href: '/tools', label: 'nav.tools.all', icon: LayoutList, exact: true },
  { href: '/isq', label: 'nav.tools.quiz', icon: ClipboardList },
  { href: '/markets/benchmarks', label: 'nav.tools.benchmarks', icon: ChartSpline },
  { href: '/tools/returns', label: 'nav.tools.returns', icon: Calculator },
  { href: '/tools/savings', label: 'nav.tools.savings', icon: PiggyBank },
  { href: '/tools/export', label: 'nav.tools.export', icon: Download },
]

export const COMMUNITY_LINKS: NavLeaf[] = [
  { href: '/community', label: 'nav.community.chat', icon: MessagesSquare },
  { href: '/blog', label: 'nav.community.blog', icon: Newspaper },
]

/** The signed-in sidebar. Groups open into indented lists. */
export const APP_NAV: Array<NavLeaf | NavGroup> = [
  { href: '/dashboard', label: 'nav.home', icon: House },
  { href: '/portfolio', label: 'nav.portfolio', icon: LayoutGrid },
  { href: '/markets', label: 'nav.market', icon: ChartNoAxesCombined },
  { label: 'nav.tools', icon: Wrench, href: '/tools', children: TOOL_LINKS },
  { label: 'nav.community', icon: Users, href: '/community', children: COMMUNITY_LINKS },
]

export function isActive(item: NavLeaf, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return [item.href, ...(item.also ?? [])].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
