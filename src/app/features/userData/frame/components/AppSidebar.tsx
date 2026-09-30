'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import { ChevronRight, ChevronsLeft, CircleHelp, ExternalLink, ShieldCheck } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { APP_NAV, isActive, type NavGroup, type NavLeaf } from '../nav'

/** A spinner on the one nav item whose page is loading. Must render inside its <Link>. */
function PendingSpinner() {
  const { pending } = useLinkStatus()
  return pending ? <Spinner className="ml-auto size-3.5 text-sidebar-primary group-data-[collapsible=icon]:hidden" /> : null
}

function LeafItem({ item }: { item: NavLeaf }) {
  const pathname = usePathname()
  const t = useCopy()
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive(item, pathname)}
        tooltip={t(item.label)}
        render={<Link href={item.href} />}
        className="h-9 max-md:h-11 max-md:text-base max-md:[&_svg]:size-5 data-active:bg-linear-to-r data-active:from-sidebar-accent data-active:to-sidebar-accent/40"
      >
        <Icon />
        <span>{t(item.label)}</span>
        <PendingSpinner />
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * A heading that opens its own list (Tools, Community). The list is dimmed
 * and indented, and comes to full strength while the pointer is over it
 * (Carlos, 2026-09-29). With the sidebar collapsed to icons there is no room
 * for a list, so the heading becomes a plain link to the group's first page.
 */
function GroupItem({ group }: { group: NavGroup }) {
  const pathname = usePathname()
  const t = useCopy()
  const { state, isMobile } = useSidebar()
  const Icon = group.icon
  const active = group.children.some((child) => isActive(child, pathname))
  const [open, setOpen] = useState(active)

  // Navigating into the group from elsewhere opens it.
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  if (state === 'collapsed' && !isMobile) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={active} tooltip={t(group.label)} render={<Link href={group.href} />} className="h-9 max-md:h-11 max-md:text-base max-md:[&_svg]:size-5">
          <Icon />
          <span>{t(group.label)}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            isActive={active && !open}
            className="group/trigger h-9 max-md:h-11 max-md:text-base max-md:[&_svg]:size-5 data-active:bg-linear-to-r data-active:from-sidebar-accent data-active:to-sidebar-accent/40"
          />
        }
      >
        <Icon />
        <span>{t(group.label)}</span>
        <ChevronRight
          aria-hidden
          className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-panel-open/trigger:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <SidebarMenuSub className="mt-1 opacity-65 transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
          {group.children.map((child, index) => {
            const ChildIcon = child.icon
            // A heading where a new section starts (Tools: Get started, Basics, …).
            const heading = child.section && child.section !== group.children[index - 1]?.section ? child.section : null
            return (
              <Fragment key={child.href}>
                {heading ? (
                  <li aria-hidden className="px-2 pt-2 pb-0.5 text-[10px] font-medium tracking-wider text-sidebar-foreground/60 uppercase max-md:text-xs">
                    {t(heading)}
                  </li>
                ) : null}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={isActive(child, pathname)}
                    render={
                      child.external ? (
                        <a href={child.href} target="_blank" rel="noopener noreferrer" />
                      ) : (
                        <Link href={child.href} />
                      )
                    }
                    className="h-8 max-md:h-10 max-md:text-base! max-md:[&_svg]:size-5 data-active:font-medium data-active:text-sidebar-primary"
                  >
                    <ChildIcon />
                    <span>{t(child.label)}</span>
                    {child.external ? <ExternalLink aria-label="Opens in a new tab" className="ml-auto size-3! opacity-60" /> : <PendingSpinner />}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </Fragment>
            )
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
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
          className="truncate text-[0.9375rem] font-medium max-md:text-base tracking-[0.2em] group-data-[collapsible=icon]:hidden"
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
          <SidebarMenu className="gap-1" data-tut="account.nav">
            {APP_NAV.map((item) =>
              'children' in item ? <GroupItem key={item.label} group={item} /> : <LeafItem key={item.href} item={item} />,
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu>
          {isAdmin ? (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('nav.admin')} render={<Link href="/admin" />}>
                <ShieldCheck />
                <span>{t('nav.admin')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
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
