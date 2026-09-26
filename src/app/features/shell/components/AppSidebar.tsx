'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartNoAxesCombined,
  ChevronsLeft,
  CircleHelp,
  House,
  LayoutGrid,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { useCopy, type CopyKey } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: CopyKey; icon: LucideIcon; also?: string[] }

/** `also`: routes that belong to an item -- the quiz and its results live under Tools. */
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'nav.home', icon: House },
  { href: '/portfolio', label: 'nav.portfolio', icon: LayoutGrid },
  { href: '/markets', label: 'nav.market', icon: ChartNoAxesCombined },
  { href: '/tools', label: 'nav.tools', icon: Wrench, also: ['/isq'] },
]

/** A spinner on the one nav item whose page is loading. Must render inside its <Link>. */
function PendingSpinner() {
  const { pending } = useLinkStatus()
  return pending ? <Spinner className="ml-auto size-3.5 text-sidebar-primary group-data-[collapsible=icon]:hidden" /> : null
}

export function AppSidebar() {
  const pathname = usePathname()
  const t = useCopy()
  const { toggleSidebar, state } = useSidebar()

  return (
    // `absolute h-full` replaces the primitive's `fixed h-svh`, so the sidebar
    // sits inside AppShell's frame (the nearest positioned ancestor) rather
    // than against the viewport edge.
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="absolute h-full [&_[data-slot=sidebar-inner]]:rounded-[1.25rem]"
    >
      <SidebarHeader className="flex-row items-center justify-between gap-2 px-3 pt-4 pb-5 group-data-[collapsible=icon]:px-1">
        <Link
          href="/dashboard"
          className="truncate text-[0.9375rem] font-medium tracking-[0.2em] group-data-[collapsible=icon]:hidden"
        >
          PAPALDO KA
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          className="grid size-7 shrink-0 place-items-center rounded-md text-sidebar-primary transition-colors hover:bg-sidebar-accent"
        >
          <ChevronsLeft
            className={cn('size-5 transition-transform', state === 'collapsed' && 'rotate-180')}
            strokeWidth={2.5}
          />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {NAV.map((item) => {
              const active = [item.href, ...(item.also ?? [])].some((prefix) => pathname.startsWith(prefix))
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={t(item.label)}
                    render={<Link href={item.href} />}
                    className="h-9 data-active:bg-linear-to-r data-active:from-sidebar-accent data-active:to-sidebar-accent/40"
                  >
                    <Icon />
                    <span>{t(item.label)}</span>
                    <PendingSpinner />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('nav.about')} render={<Link href="/" />}>
              <CircleHelp />
              <span>{t('nav.about')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
