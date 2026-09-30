'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, LifeBuoy, LogOut, ShieldCheck, UserRound } from 'lucide-react'

import { useSignOut } from '@/app/features/auth/components/SignOutButton'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

import type { ShellUser } from '../api/shell'

/**
 * The signed-in account pill (avatar, name, email). Clicking it opens a menu
 * instead of going straight to the profile (Carlos, 2026-09-29). In the public
 * top bar the menu also links back to the dashboard, since the landing page
 * has no sidebar.
 */
export function AccountMenu({
  user,
  showDashboardLink = false,
  active = false,
}: {
  user: ShellUser
  showDashboardLink?: boolean
  /** Highlights the pill while the profile page is open. */
  active?: boolean
}) {
  const t = useCopy()
  const router = useRouter()
  const { pending, signOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('header.account')}
        data-tut="account.menu"
        data-active={active || undefined}
        className={cn(
          'flex min-w-0 items-center gap-2.5 rounded-full bg-card py-1 pr-3 pl-1 text-left text-card-foreground ring-1 ring-foreground/10 transition-colors outline-none',
          'hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-accent data-active:ring-primary/60',
        )}
      >
        <Avatar>
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-44 truncate text-sm leading-tight font-medium">{user.displayName}</span>
          {user.email ? (
            <span className="block max-w-44 truncate text-xs leading-tight text-muted-foreground">{user.email}</span>
          ) : null}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{user.displayName}</span>
            {user.email ? <span className="truncate text-xs font-normal">{user.email}</span> : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {showDashboardLink ? (
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <LayoutDashboard />
            {t('header.dashboard')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <UserRound />
          {t('header.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/support')}>
          <LifeBuoy />
          {t('header.support')}
        </DropdownMenuItem>
        {user.isAdmin ? (
          <DropdownMenuItem onClick={() => router.push('/admin')}>
            <ShieldCheck />
            {t('header.admin')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} disabled={pending}>
          <LogOut />
          {pending ? t('header.signingOut') : t('header.signout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
