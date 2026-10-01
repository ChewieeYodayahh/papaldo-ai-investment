'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { usePreferences } from '@/app/features/userData/preferences/store'
import type { SocialNotification } from '@/app/features/community/api/notifications'
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
  social,
  greetingSeed,
}: {
  user: ShellUser | null
  notifications: Order[]
  social: SocialNotification[]
  greetingSeed: number
}) {
  const t = useCopy()
  const language = usePreferences((s) => s.language)
  const pathname = usePathname()
  const title = titleFor(pathname)

  // Phones (Carlos, 2026-10-01): the menu button, bell, settings and avatar
  // share the top row and the title gets a line of its own, so a long
  // greeting no longer pushes the avatar onto a row by itself. One row from md.
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-4 pb-4 md:gap-y-3 md:pt-5">
      <SidebarTrigger className="md:hidden" />

      <h1 className="order-last w-full truncate text-xl font-medium tracking-tight md:order-none md:mr-auto md:w-auto md:text-xl lg:text-[1.625rem]">
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

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        {user ? <NotificationsMenu orders={notifications} social={social} /> : null}
        <SettingsMenu signedIn={Boolean(user)} />
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
      </div>
    </header>
  )
}
