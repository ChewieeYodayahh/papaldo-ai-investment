'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

import { logoUrl } from '@/lib/logos'

/**
 * A ticker's logo, or its monogram when there is none.
 *
 * Built on the shadcn Avatar: the monogram shows while the logo loads and
 * stays if the logo 404s, so a missing mark never leaves a broken image or
 * an empty circle. The light disc behind it is there because most marks are
 * drawn for a white page.
 */
export function SymbolMark({ symbol, className }: { symbol: string; className?: string }) {
  const src = logoUrl(symbol)
  return (
    <Avatar aria-hidden className={cn('size-8 shrink-0 bg-secondary after:hidden', className)}>
      {src ? (
        <AvatarImage src={src} alt="" referrerPolicy="no-referrer" className="rounded-full bg-secondary object-contain p-[12%]" />
      ) : null}
      <AvatarFallback className="bg-secondary text-[0.5625rem] font-bold tracking-tight text-secondary-foreground">
        {symbol.replace(/[^A-Z]/g, '').slice(0, 4)}
      </AvatarFallback>
    </Avatar>
  )
}
