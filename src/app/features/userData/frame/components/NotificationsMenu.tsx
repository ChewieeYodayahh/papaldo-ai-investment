'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, UserCheck, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SocialNotification } from '@/app/features/community/api/notifications'
import { SymbolMark } from '@/app/features/markets/components/SymbolMark'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { usePreferences } from '@/app/features/userData/preferences/store'
import type { Order } from '@/app/features/trading/types'

const timeFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

/** Newest events shown, fills and friend activity together. */
const LIMIT = 10

type Entry = { at: string; order: Order; social?: never } | { at: string; social: SocialNotification; order?: never }

/**
 * The bell. It lists real events only: the user's own simulated fills and,
 * since 2026-09-30, friend requests and acceptances.
 *
 * Fills count as unread when filled after the list was last opened
 * (remembered per browser). Friend activity is read or unread in the
 * database, and opening the bell marks it read.
 */
export function NotificationsMenu({ orders, social }: { orders: Order[]; social: SocialNotification[] }) {
  const t = useCopy()
  const seenAt = usePreferences((s) => s.notificationsSeenAt)
  const markSeen = usePreferences((s) => s.markNotificationsSeen)
  // Set once the bell was opened, so the badge clears before the next page load.
  const [socialRead, setSocialRead] = useState(false)

  const unreadSocial = socialRead ? 0 : social.filter((n) => !n.read).length
  const unread = orders.filter((o) => !seenAt || o.filledAt > seenAt).length + unreadSocial

  const entries: Entry[] = [
    ...orders.map((order): Entry => ({ at: order.filledAt, order })),
    ...social.map((item): Entry => ({ at: item.createdAt, social: item })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, LIMIT)

  function onOpenChange(open: boolean) {
    if (!open) return
    markSeen()
    if (unreadSocial > 0) {
      setSocialRead(true)
      void fetch('/api/notifications/read', { method: 'POST' }).catch(() => undefined)
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="relative rounded-full bg-card ring-1 ring-foreground/10"
            aria-label={unread > 0 ? `${t('header.notifications')} (${unread} unread)` : t('header.notifications')}
          />
        }
      >
        <Bell className="size-[1.125rem]" />
        {unread > 0 ? (
          <span className="figure absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-loss px-1 text-[10px] font-semibold text-background">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('header.notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {entries.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{t('header.noNotifications')}</p>
        ) : (
          entries.map((entry) =>
            entry.order ? (
              <DropdownMenuItem
                key={`order-${entry.order.id}`}
                render={<Link href={`/markets/${encodeURIComponent(entry.order.symbol)}`} />}
                className="gap-2.5"
              >
                <SymbolMark symbol={entry.order.symbol} className="size-7" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm">
                    {entry.order.side === 'buy' ? t('header.bought') : t('header.sold')}{' '}
                    <span className="figure">{entry.order.quantity}</span> {entry.order.symbol} @ <Money usd={entry.order.fillPrice} />
                  </span>
                  <span className="text-xs text-muted-foreground">{timeFormatter.format(new Date(entry.at))}</span>
                </span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={`social-${entry.social.id}`}
                render={<Link href={`/u/${encodeURIComponent(entry.social.actorName)}`} />}
                className="gap-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  {entry.social.kind === 'friend_request' ? <UserPlus className="size-3.5" /> : <UserCheck className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm">
                    {t(entry.social.kind === 'friend_request' ? 'soc.friendRequest' : 'soc.friendAccepted', {
                      name: entry.social.actorName,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeFormatter.format(new Date(entry.at))}</span>
                </span>
              </DropdownMenuItem>
            ),
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
