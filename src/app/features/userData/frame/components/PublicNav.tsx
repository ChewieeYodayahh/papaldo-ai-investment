'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Menu } from 'lucide-react'

import { MenuToggleIcon } from '@/components/menu-toggle-icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { ShellUser } from '../api/shell'
import { isActive, isPublicMenu, PUBLIC_NAV, type NavLeaf, type PublicMenu } from '../nav'
import { AccountMenu } from './AccountMenu'
import { SettingsMenu } from './SettingsMenu'

const linkClass = (active: boolean) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-sm transition-colors',
    active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
  )

const leavesOf = (menu: PublicMenu) => menu.entries.filter((entry): entry is NavLeaf => entry !== 'divider')

/** Opens an internal link client-side, an external one in a new tab without an opener. */
function useOpen() {
  const router = useRouter()
  return (item: NavLeaf) =>
    item.external ? window.open(item.href, '_blank', 'noopener,noreferrer') : router.push(item.href)
}

/** One dropdown in the top bar: links and dividers, no submenus and no arrows (Carlos, 2026-09-30 and 10-02). */
function NavMenu({ menu }: { menu: PublicMenu }) {
  const t = useCopy()
  const pathname = usePathname()
  const open = useOpen()
  const active = leavesOf(menu).some((item) => isActive(item, pathname))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(linkClass(active), 'inline-flex items-center gap-1 outline-none data-popup-open:text-foreground')}>
        {t(menu.label)}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {menu.entries.map((entry, index) => {
          if (entry === 'divider') return <DropdownMenuSeparator key={`divider-${index}`} />
          const Icon = entry.icon
          return (
            <DropdownMenuItem key={entry.href} onClick={() => open(entry)}>
              <Icon />
              {t(entry.label)}
              {entry.external && <ExternalLink className="ml-auto size-3.5 opacity-60" aria-label="Opens in a new tab" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A phone-menu row: 17px text on a 48px touch target. */
const ROW = 'flex min-h-12 w-full items-center gap-3 px-1 text-left text-[1.0625rem] transition-colors hover:text-foreground'

/**
 * The phone menu (Carlos, 2026-09-30): one divided list. About Papaldo,
 * Community and Tools fold open under a hamburger that turns into an X, their
 * links without arrows (2026-10-02); Markets and Support are rows.
 */
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const t = useCopy()
  const pathname = usePathname()

  const leaf = (item: NavLeaf, nested: boolean) => {
    const active = isActive(item, pathname)
    const className = cn(
      ROW,
      nested && 'min-h-11 pl-4 text-base',
      active ? 'font-medium text-foreground' : nested ? 'text-muted-foreground' : 'text-foreground',
    )
    const trailing = item.external ? (
      <ExternalLink className="ml-auto size-4 opacity-60" aria-label="Opens in a new tab" />
    ) : !nested ? (
      <ChevronRight className="ml-auto size-4 opacity-50" aria-hidden />
    ) : null
    return item.external ? (
      <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={className}>
        {t(item.label)}
        {trailing}
      </a>
    ) : (
      <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={className}>
        {t(item.label)}
        {trailing}
      </Link>
    )
  }

  return (
    <nav className="-mx-1 mt-2 flex-1 divide-y divide-border overflow-y-auto border-y border-border px-1" aria-label="Mobile">
      {PUBLIC_NAV.map((entry) => {
        if (!isPublicMenu(entry)) {
          return (
            <div key={entry.href} className="py-1">
              {leaf({ href: entry.href, label: entry.label, icon: ChevronRight }, false)}
            </div>
          )
        }
        const open = leavesOf(entry).some((item) => isActive(item, pathname))
        return (
          <Collapsible key={entry.label} defaultOpen={open} className="py-1">
            <CollapsibleTrigger className={cn(ROW, 'group/toggle justify-between text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
              {t(entry.label)}
              <MenuToggleIcon />
            </CollapsibleTrigger>
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden pb-1 transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
              {leavesOf(entry).map((item) => leaf(item, true))}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </nav>
  )
}

/**
 * The top bar outside the app (landing page, signed-out /markets, blog and
 * community for guests), after Investopedia's: wordmark, section links, then
 * the settings gear and either "Log in" / "Get Started" or, for a signed-in
 * visitor, their account pill with its menu (Carlos, 2026-09-29).
 *
 * The same gear as the app header -- theme, palette, font and language all
 * work before sign-in, so the landing page can be read in Brainrot too. For
 * guests those choices last for the visit only.
 */
export function PublicNav({ user = null }: { user?: ShellUser | null }) {
  const t = useCopy()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl md:rounded-t-[1.75rem]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="shrink-0 text-[0.9375rem] font-semibold tracking-[0.22em]">
          PAPALDO KA
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {PUBLIC_NAV.map((entry) => {
            if (isPublicMenu(entry)) return <NavMenu key={entry.label} menu={entry} />
            const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`)
            return (
              <Link key={entry.href} href={entry.href} aria-current={active ? 'page' : undefined} className={linkClass(active)}>
                {t(entry.label)}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SettingsMenu signedIn={Boolean(user)} />
          {user ? (
            <AccountMenu user={user} showDashboardLink />
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost' }), 'hidden h-9 rounded-full px-4 sm:inline-flex')}
              >
                {t('pub.login')}
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants(), 'h-9 rounded-full px-4 font-semibold')}>
                {t('pub.getStarted')}
              </Link>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-lg" className="rounded-full md:hidden" aria-label={t('pub.menu')} />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0 p-6">
              <SheetTitle className="text-base font-semibold tracking-[0.22em]">PAPALDO KA</SheetTitle>
              <MobileNav onNavigate={() => setOpen(false)} />
              <div className="mt-6 grid gap-2">
                {user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)} className={cn(buttonVariants(), 'h-11 rounded-full text-base')}>
                    {t('header.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'h-11 rounded-full text-base')}
                    >
                      {t('pub.login')}
                    </Link>
                    <Link href="/sign-up" onClick={() => setOpen(false)} className={cn(buttonVariants(), 'h-11 rounded-full text-base')}>
                      {t('pub.getStarted')}
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
