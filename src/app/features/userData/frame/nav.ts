import {
  BadgeQuestionMark,
  Calculator,
  ChartNoAxesCombined,
  ChartSpline,
  ClipboardList,
  Coins,
  Download,
  FileSpreadsheet,
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
  /** A small heading shown above the first link of each section in a group. */
  section?: CopyKey
  /** Another site: opens in a new tab without an opener. */
  external?: boolean
}
export type NavGroup = { label: CopyKey; icon: LucideIcon; href: string; children: NavLeaf[] }

/**
 * Manulife Philippines' own calculators. The only life-insurance resource
 * Papaldo links to (Carlos, 2026-09-30): no in-app insurance calculators and
 * no other insurers. Opens Manulife's site in a new tab.
 */
export const MANULIFE_TOOLS_URL = 'https://www.manulife.com/ph/services/tools-calculators'

/**
 * Every tool, in the order the sidebar lists them, in the same sections as
 * the /tools hub (2026-09-30). The first is the Tools page itself.
 */
export const TOOL_LINKS: NavLeaf[] = [
  { href: '/tools', label: 'nav.tools.all', icon: LayoutList, exact: true },
  { href: '/isq', label: 'nav.tools.quiz', icon: ClipboardList, section: 'nav.tools.started' },
  { href: '/tools/returns', label: 'nav.tools.returns', icon: Calculator, section: 'nav.tools.basics' },
  { href: '/tools/savings', label: 'nav.tools.savings', icon: PiggyBank, section: 'nav.tools.basics' },
  { href: '/tools/purchasing-power', label: 'nav.tools.purchasingPower', icon: Coins, section: 'nav.tools.basics' },
  { href: '/tools/budget', label: 'nav.tools.budget', icon: Wallet, section: 'nav.tools.basics' },
  { href: '/markets/benchmarks', label: 'nav.tools.benchmarks', icon: ChartSpline, section: 'nav.tools.basics' },
  { href: '/tools/statements', label: 'nav.tools.statements', icon: FileSpreadsheet, section: 'nav.tools.accounting' },
  { href: MANULIFE_TOOLS_URL, label: 'nav.tools.manulife', icon: ShieldPlus, section: 'nav.tools.lifeInsurance', external: true },
  { href: '/tools/export', label: 'nav.tools.export', icon: Download, section: 'nav.tools.yourData' },
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
  if (item.exact) return pathname === item.href
  return [item.href, ...(item.also ?? [])].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export type PublicMenuItem = { href: string; label: CopyKey; icon: LucideIcon; external?: boolean }
export type PublicMenu = { label: CopyKey; sections: Array<{ label?: CopyKey; items: PublicMenuItem[] }> }
export type PublicNavEntry = { href: string; label: CopyKey } | PublicMenu

export const isPublicMenu = (entry: PublicNavEntry): entry is PublicMenu => 'sections' in entry

/**
 * The top bar outside the app (Carlos, 2026-09-30): About Papaldo ▾, Markets,
 * Community ▾, Tools ▾. Tools lists what a guest can open without an account;
 * the quiz and export need one and live in the signed-in sidebar.
 * Section links are absolute (`/#…`) so they also work from other pages.
 */
export const PUBLIC_NAV: PublicNavEntry[] = [
  {
    label: 'pub.about',
    sections: [
      {
        items: [
          { href: '/#features', label: 'pub.how', icon: Sparkles },
          { href: '/#trust', label: 'pub.why', icon: ShieldCheck },
          { href: '/#faq', label: 'pub.faq', icon: BadgeQuestionMark },
        ],
      },
    ],
  },
  { href: '/markets', label: 'pub.markets' },
  { label: 'nav.community', sections: [{ items: COMMUNITY_LINKS }] },
  {
    label: 'nav.tools',
    sections: [
      ...(['nav.tools.basics', 'nav.tools.accounting', 'nav.tools.lifeInsurance'] as const).map((section) => ({
        label: section,
        items: TOOL_LINKS.filter((link) => link.section === section && link.href !== '/markets/benchmarks'),
      })),
    ],
  },
]

