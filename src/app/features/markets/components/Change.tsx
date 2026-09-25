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

