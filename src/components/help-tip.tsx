'use client'

import { ArrowUpRight, CircleHelp } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * A "?" that opens a one-line meaning and, optionally, a link out for more.
 * Tap or click to open; Esc closes. `chip` shows the term's name in a pill
 * (the lesson cards' key terms); `icon` is the bare "?" beside a label.
 */
export function HelpTip({
  label,
  text,
  href,
  ariaLabel,
  learnMore = 'Learn more',
  variant = 'icon',
  className,
}: {
  label: string
  text: string
  href?: string
  ariaLabel?: string
  learnMore?: string
  variant?: 'icon' | 'chip'
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={ariaLabel ?? `What is ${label}?`}
        className={cn(
          'transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          variant === 'icon'
            ? 'inline-grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground'
            : 'inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/70',
          className,
        )}
      >
        {variant === 'chip' ? label : null}
        <CircleHelp className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm" align="start">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-muted-foreground">{text}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {learnMore} <ArrowUpRight className="size-3.5" />
          </a>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
