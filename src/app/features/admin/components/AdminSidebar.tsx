'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  LayoutDashboard,
  LifeBuoy,
  Newspaper,
  Plug,
  ScrollText,
  Server,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean }

export const ADMIN_NAV: Item[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/integrations', label: 'Integration logs', icon: Plug },
  { href: '/admin/notifications', label: 'Notification log', icon: Bell },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/resources', label: 'Resources', icon: Server },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
]

/** The Developer Dashboard's sidebar, after FoxeeMarket Admin (Carlos, 2026-09-29). */
export function AdminSidebar({ email, openSupport }: { email: string | null; openSupport: number }) {
  const pathname = usePathname()
  return (
    <Sidebar variant="floating" className="absolute h-full [&_[data-slot=sidebar-inner]]:rounded-[1.25rem]">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <Link href="/admin" className="text-[0.9375rem] font-semibold tracking-[0.16em]">
          PAPALDO DEV
        </Link>
        {email ? <p className="truncate text-xs text-sidebar-foreground/70">{email}</p> : null}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {ADMIN_NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={item.href} />}
                    className="h-9 data-active:bg-linear-to-r data-active:from-sidebar-accent data-active:to-sidebar-accent/40"
                  >
                    <Icon />
                    <span>{item.label}</span>
                    {item.href === '/admin/support' && openSupport > 0 ? (
                      <Badge className="ml-auto h-5 min-w-5 rounded-full bg-sidebar-primary px-1.5 text-sidebar-primary-foreground">
                        {openSupport}
                      </Badge>
                    ) : null}
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
            <SidebarMenuButton render={<Link href="/dashboard" />}>
              <ArrowLeft />
              <span>Back to Papaldo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
