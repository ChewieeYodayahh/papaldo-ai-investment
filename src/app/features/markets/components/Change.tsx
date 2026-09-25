import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/** A signed percentage in the gain or loss accent. Zero is neither. */
export function Change({
  percent,
  arrow = false,
  className,
}: {
  percent: number
  arrow?: boolean
  className?: string
}) {
  // Judge the sign on what is displayed: -0.0001% must read as a flat 0.00%,
  // not a red "-0.00%".
  const shown = Number(percent.toFixed(2)) || 0
  const tone = shown > 0 ? 'text-gain' : shown < 0 ? 'text-loss' : 'text-muted-foreground'
  const Icon = shown < 0 ? ArrowDownRight : ArrowUpRight
  return (
    <span className={cn('figure inline-flex items-center gap-0.5', tone, className)}>
      {arrow && shown !== 0 ? <Icon className="size-3.5" aria-hidden /> : null}
      {shown > 0 ? '+' : ''}
      {shown.toFixed(2)}%
    </span>
  )
}

/**
 * A ticker's monogram. Alpaca's logo endpoint answers 403 on this plan and
 * Finnhub's logo is one request per symbol, so a list of forty would cost
 * forty calls for decoration; the monogram costs none.
 */
export function SymbolMark({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[0.5625rem] font-bold tracking-tight text-secondary-foreground',
        className,
      )}
    >
      {symbol.replace(/[^A-Z]/g, '').slice(0, 4)}
    </span>
  )
}
