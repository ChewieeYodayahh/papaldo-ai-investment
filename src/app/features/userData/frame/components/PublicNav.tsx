'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { ChevronDown, ExternalLink, Menu } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { ShellUser } from '../api/shell'
import { isPublicMenu, PUBLIC_NAV, type PublicMenu, type PublicMenuItem } from '../nav'
import { AccountMenu } from './AccountMenu'
import { SettingsMenu } from './SettingsMenu'

const linkClass = (active: boolean) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-sm transition-colors',
    active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
  )

/** Phone-menu rows: 17px text on a 44px touch target (Carlos, 2026-09-30: menus read too small). */
const MOBILE_ITEM = 'flex min-h-11 items-center gap-2 rounded-lg px-3 text-[1.0625rem] hover:bg-accent'

const isOnPage = (item: PublicMenuItem, pathname: string) =>
  !item.external && !item.href.startsWith('/#') && (pathname === item.href || pathname.startsWith(`${item.href}/`))

/** Opens an internal link client-side, an external one in a new tab without an opener. */
function useOpen() {
  const router = useRouter()
  return (item: PublicMenuItem) =>
    item.external ? window.open(item.href, '_blank', 'noopener,noreferrer') : router.push(item.href)
}

/** One dropdown in the top bar, with optional section labels (Tools: Basics, Life insurance). */
function NavMenu({ menu }: { menu: PublicMenu }) {
  const t = useCopy()
  const pathname = usePathname()
  const open = useOpen()
  const active = menu.sections.some((section) => section.items.some((item) => isOnPage(item, pathname)))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(linkClass(active), 'inline-flex items-center gap-1 outline-none data-popup-open:text-foreground')}>
        {t(menu.label)}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {menu.sections.map((section, index) => (
          <Fragment key={section.label ?? index}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              {section.label ? <DropdownMenuLabel>{t(section.label)}</DropdownMenuLabel> : null}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.href} onClick={() => open(item)}>
                    <Icon />
                    {t(item.label)}
                    {item.external ? <ExternalLink className="ml-auto size-3.5 opacity-60" aria-label="Opens in a new tab" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
            <SheetContent side="right" className="p-6">
              <SheetTitle className="text-base font-semibold tracking-[0.22em]">PAPALDO KA</SheetTitle>
              <nav className="mt-4 flex flex-col gap-4 overflow-y-auto" aria-label="Mobile">
                {PUBLIC_NAV.map((entry) =>
                  isPublicMenu(entry) ? (
                    <div key={entry.label} className="grid gap-0.5">
                      <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(entry.label)}</p>
                      {entry.sections.flatMap((section) =>
                        section.items.map((item) =>
                          item.external ? (
                            <a
                              key={item.href}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpen(false)}
                              className={MOBILE_ITEM}
                            >
                              {t(item.label)}
                              <ExternalLink className="size-4 opacity-60" aria-label="Opens in a new tab" />
                            </a>
                          ) : (
                            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={MOBILE_ITEM}>
                              {t(item.label)}
                            </Link>
                          ),
                        ),
                      )}
                    </div>
                  ) : (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center rounded-lg px-3 text-[1.0625rem] font-medium hover:bg-accent"
                    >
                      {t(entry.label)}
                    </Link>
                  ),
                )}
              </nav>
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
