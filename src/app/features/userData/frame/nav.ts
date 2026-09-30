import {
  BadgeQuestionMark,
  Calculator,
  ChartNoAxesCombined,
  ChartSpline,
  Coins,
  FileSpreadsheet,
  Hourglass,
  House,
  LayoutGrid,
  LayoutList,
  MessagesSquare,
  Newspaper,
  PiggyBank,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { CopyKey } from '@/app/features/userData/preferences/copy'

export type NavLeaf = {
  href: string
  label: CopyKey
  icon: LucideIcon
  also?: string[]
  exact?: boolean
  /** Active on these paths instead of `href` (a link into a section of a hub). */
  activeOn?: string[]
  /** Another site: opens in a new tab without an opener. */
  external?: boolean
  /** Shows "→": the link opens a section of a page rather than a single tool. */
  arrow?: boolean
}
export type NavGroup = { label: CopyKey; icon: LucideIcon; href: string; children: Array<NavLeaf | 'divider'> }

/**
 * Manulife Philippines' own calculators. The only life-insurance resource
 * Papaldo links to (Carlos, 2026-09-30): no in-app insurance calculators and
 * no other insurers. Opens Manulife's site in a new tab.
 */
export const MANULIFE_TOOLS_URL = 'https://www.manulife.com/ph/services/tools-calculators'

/** The Basics section of the /tools hub, in its order. */
export const BASIC_TOOLS: NavLeaf[] = [
  { href: '/tools/returns', label: 'nav.tools.returns', icon: Calculator },
  { href: '/tools/savings', label: 'nav.tools.savings', icon: PiggyBank },
  { href: '/tools/purchasing-power', label: 'nav.tools.purchasingPower', icon: Coins },
  { href: '/tools/budget', label: 'nav.tools.budget', icon: Wallet },
  { href: '/tools/dca', label: 'nav.tools.dca', icon: ChartSpline },
  { href: '/tools/cost-of-waiting', label: 'nav.tools.waiting', icon: Hourglass },
]

/**
 * Tools, as both the sidebar and the top bar list them (Carlos, 2026-09-30):
 * Open Tools, a divider, then Basics, Accounting and Life insurance. No
 * submenus: each opens its own section of /tools.
 */
export const TOOL_LINKS: Array<NavLeaf | 'divider'> = [
  { href: '/tools', label: 'nav.tools.open', icon: LayoutList, exact: true, arrow: true },
  'divider',
  { href: '/tools?open=basics', label: 'nav.tools.basics', icon: Calculator, arrow: true, activeOn: BASIC_TOOLS.map((tool) => tool.href) },
  { href: '/tools?open=accounting', label: 'nav.tools.accounting', icon: FileSpreadsheet, arrow: true, activeOn: ['/tools/statements'] },
  { href: '/tools?open=insurance', label: 'nav.tools.lifeInsurance', icon: ShieldPlus, arrow: true, activeOn: [] },
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
  if (item.external) return false
  if (item.activeOn) return item.activeOn.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (item.exact) return pathname === item.href
  return [item.href, ...(item.also ?? [])].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export type MenuEntry = NavLeaf | 'divider'

/**
 * A top-bar dropdown. On the phone menu it folds open under its name, or,
 * with `mobile: 'list'` (Tools), always shows its links under a heading.
 */
export type PublicMenu = { label: CopyKey; entries: MenuEntry[]; mobile?: 'collapse' | 'list' }
export type PublicNavEntry = { href: string; label: CopyKey } | PublicMenu

export const isPublicMenu = (entry: PublicNavEntry): entry is PublicMenu => 'entries' in entry

/**
 * The top bar outside the app (Carlos, 2026-09-30): About Papaldo ▾, Markets,
 * Community ▾, Tools ▾, Support. Section links are absolute (`/#…`) so they
 * also work from other pages.
 */
export const PUBLIC_NAV: PublicNavEntry[] = [
  {
    label: 'pub.about',
    entries: [
      { href: '/#features', label: 'pub.how', icon: Sparkles },
      { href: '/#trust', label: 'pub.why', icon: ShieldCheck },
      { href: '/#faq', label: 'pub.faq', icon: BadgeQuestionMark },
    ],
  },
  { href: '/markets', label: 'pub.markets' },
  { label: 'nav.community', entries: COMMUNITY_LINKS },
  { label: 'nav.tools', entries: TOOL_LINKS, mobile: 'list' },
  { href: '/support', label: 'nav.support' },
]
