'use client'

import { SignOutButton } from '@/app/features/auth/components/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCopy } from '@/app/features/preferences/copy'

import type { ShellUser } from '../api/shell'

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Read-only account details. There is no edit screen to link to: the
 * middleware sends anyone with a complete profile away from
 * `/onboarding/profile`, and a complete profile is required to be here.
 */
export function ProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ShellUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useCopy()
  const rows = [
    ['Name', user.displayName],
    ['Username', user.username],
    ['Email', user.email],
    ['Occupation', user.occupation],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3">
          <Avatar size="lg">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle>{t('header.profile')}</DialogTitle>
            <DialogDescription>Simulated account · no real money</DialogDescription>
          </div>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </DialogContent>
    </Dialog>
  )
}
