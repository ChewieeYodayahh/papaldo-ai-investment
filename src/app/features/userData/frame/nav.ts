import {
  BadgeQuestionMark,
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
  ShieldCheck,
  ShieldPlus,
  Sparkles,
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

/**
 * Manulife Philippines' own calculators. The only life-insurance resource
 * Papaldo links to (Carlos, 2026-09-30): no in-app insurance calculators and
 * no other insurers. Opens Manulife's site in a new tab.
 */
export const MANULIFE_TOOLS_URL = 'https://www.manulife.com/ph/services/tools-calculators'

export type PublicMenuItem = { href: string; label: CopyKey; icon: LucideIcon; external?: boolean }
export type PublicMenu = { label: CopyKey; sections: Array<{ label?: CopyKey; items: PublicMenuItem[] }> }
export type PublicNavEntry = { href: string; label: CopyKey } | PublicMenu

export const isPublicMenu = (entry: PublicNavEntry): entry is PublicMenu => 'sections' in entry

/**
 * The top bar outside the app (Carlos, 2026-09-30): About Papaldo ▾, Markets,
 * Community ▾, Tools ▾. Tools lists what a guest can open without an account;
 * the quiz and export need one and live in the signed-in sidebar. Purchasing
 * power, budget and accounting join Basics as they ship (plan Phase 7).
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
      {
        label: 'nav.tools.basics',
        items: TOOL_LINKS.filter((link) => ['/tools/returns', '/tools/savings'].includes(link.href)),
      },
      {
        label: 'nav.tools.lifeInsurance',
        items: [{ href: MANULIFE_TOOLS_URL, label: 'nav.tools.manulife', icon: ShieldPlus, external: true }],
      },
    ],
  },
]

