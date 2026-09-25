'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { usePreferences } from '@/app/features/preferences/store'
import type { Order } from '@/app/features/trading/types'

const timeFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * The bell. Papaldo's only real events are the user's own simulated fills,
 * so that is what it lists -- nothing is invented to make the badge light up.
 *
 * "Unread" means filled after the list was last opened, remembered per
 * browser. A first visit counts everything shown as unread.
 */
export function NotificationsMenu({ orders }: { orders: Order[] }) {
  const t = useCopy()
  const seenAt = usePreferences((s) => s.notificationsSeenAt)
  const markSeen = usePreferences((s) => s.markNotificationsSeen)

  const unread = orders.filter((o) => !seenAt || o.filledAt > seenAt).length

  return (
    <DropdownMenu onOpenChange={(open) => (open ? markSeen() : undefined)}>
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
        {orders.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{t('header.noNotifications')}</p>
        ) : (
          orders.map((order) => (
            <DropdownMenuItem
              key={order.id}
              render={<Link href={`/markets/${encodeURIComponent(order.symbol)}`} />}
              className="flex-col items-start gap-0.5"
            >
              <span className="text-sm">
                {order.side === 'buy' ? t('header.bought') : t('header.sold')}{' '}
                <span className="figure">{order.quantity}</span> {order.symbol} @ <Money usd={order.fillPrice} />
              </span>
              <span className="text-xs text-muted-foreground">{timeFormatter.format(new Date(order.filledAt))}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
