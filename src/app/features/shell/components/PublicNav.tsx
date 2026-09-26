'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCopy, type CopyKey } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

import { SettingsMenu } from './SettingsMenu'

/** Section links are absolute (`/#…`) so they also work from `/markets`. */
const LINKS: Array<{ href: string; label: CopyKey }> = [
  { href: '/#features', label: 'pub.how' },
  { href: '/#trust', label: 'pub.why' },
  { href: '/markets', label: 'pub.markets' },
  { href: '/#faq', label: 'pub.faq' },
]

/**
 * The signed-out top bar (landing page and signed-out /markets), after
 * Investopedia's: wordmark, section links, then the settings gear,
 * "Log in" and a filled "Get Started".
 *
 * The same gear as the app header -- theme, palette, font and language all
 * work before sign-in, so the landing page can be read in Brainrot too.
 */
export function PublicNav() {
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
          {LINKS.map((link) => {
            const active = link.href === pathname || (link.href === '/markets' && pathname.startsWith('/markets'))
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(link.label)}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SettingsMenu signedIn={false} />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost' }), 'hidden h-9 rounded-full px-4 sm:inline-flex')}
          >
            {t('pub.login')}
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants(), 'h-9 rounded-full px-4 font-semibold')}>
            {t('pub.getStarted')}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-lg" className="rounded-full md:hidden" aria-label={t('pub.menu')} />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle className="text-sm font-semibold tracking-[0.22em]">PAPALDO KA</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-[0.9375rem] hover:bg-accent"
                  >
                    {t(link.label)}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 grid gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-full')}>
                  {t('pub.login')}
                </Link>
                <Link href="/sign-up" onClick={() => setOpen(false)} className={cn(buttonVariants(), 'h-10 rounded-full')}>
                  {t('pub.getStarted')}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
