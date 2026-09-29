'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useCopy } from '@/app/features/preferences/copy'
import { usePreferences } from '@/app/features/preferences/store'
import type { Order } from '@/app/features/trading/types'
import { cn } from '@/lib/utils'

import type { ShellUser } from '../api/shell'
import { pickGreeting } from '../greetings'
import { titleFor } from '../titles'
import { AccountMenu } from './AccountMenu'
import { NotificationsMenu } from './NotificationsMenu'
import { SettingsMenu } from './SettingsMenu'

export function AppHeader({
  user,
  notifications,
  greetingSeed,
}: {
  user: ShellUser | null
  notifications: Order[]
  greetingSeed: number
}) {
  const t = useCopy()
  const language = usePreferences((s) => s.language)
  const pathname = usePathname()
  const title = titleFor(pathname)

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-3 pt-5 pb-4">
      <SidebarTrigger className="md:hidden" />

      <h1 className="mr-auto text-xl font-medium tracking-tight lg:text-[1.625rem]">
        {title === 'greeting' ? (
          <>
            {pickGreeting(language, greetingSeed)}
            {user ? (
              <>
                , <span className="text-highlight">{user.firstName}</span>
              </>
            ) : null}
          </>
        ) : (
          t(title)
        )}
      </h1>

      <div className="flex items-center gap-2">
        {user ? <NotificationsMenu orders={notifications} /> : null}
        <SettingsMenu signedIn={Boolean(user)} />
      </div>

      {user ? (
        // A menu, not a link: Profile and Sign out (Carlos, 2026-09-29).
        <AccountMenu user={user} active={pathname.startsWith('/profile')} />
      ) : (
        <div className="flex items-center gap-1.5 rounded-full bg-card p-1 ring-1 ring-foreground/10">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'rounded-full px-4')}>
            {t('header.login')}
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ variant: 'secondary' }), 'rounded-full px-4')}>
            {t('header.signup')}
          </Link>
        </div>
      )}
    </header>
  )
}
