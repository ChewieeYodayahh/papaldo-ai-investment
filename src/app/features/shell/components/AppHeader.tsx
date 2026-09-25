'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useCopy, type CopyKey } from '@/app/features/preferences/copy'
import { usePreferences } from '@/app/features/preferences/store'
import type { Order } from '@/app/features/trading/types'
import { cn } from '@/lib/utils'

import type { ShellUser } from '../api/shell'
import { pickGreeting } from '../greetings'
import { NotificationsMenu } from './NotificationsMenu'
import { initials, ProfileDialog } from './ProfileDialog'
import { SettingsMenu } from './SettingsMenu'

/**
 * What the header says on each route. Home is the only page that greets;
 * everywhere else the header names the page (Carlos, 2026-09-25).
 */
function titleFor(pathname: string): CopyKey | 'greeting' {
  if (pathname.startsWith('/portfolio')) return 'page.portfolio'
  if (pathname === '/markets') return 'page.markets'
  if (pathname.startsWith('/markets/')) return 'page.trade'
  return 'greeting'
}

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
  const [profileOpen, setProfileOpen] = useState(false)
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
        <SettingsMenu signedIn={Boolean(user)} onOpenProfile={() => setProfileOpen(true)} />
      </div>

      {user ? (
        <>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex min-w-0 items-center gap-2.5 rounded-full bg-card py-1 pr-4 pl-1 text-left text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-accent"
          >
            <Avatar>
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm leading-tight font-medium">{user.displayName}</span>
              {user.email ? (
                <span className="block truncate text-xs leading-tight text-muted-foreground">{user.email}</span>
              ) : null}
            </span>
          </button>
          <ProfileDialog user={user} open={profileOpen} onOpenChange={setProfileOpen} />
        </>
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
