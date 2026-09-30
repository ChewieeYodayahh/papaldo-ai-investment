import { cn } from '@/lib/utils'

/**
 * A hamburger that turns into an X when what it opens is open (Carlos,
 * 2026-09-30): the Tools accordion and the phone menu's groups. Put
 * `group/toggle` on the trigger; its `aria-expanded` drives the icon, so it
 * needs no state: the top and bottom bars swing into a cross and the middle
 * one fades. Respects reduced motion.
 */
export function MenuToggleIcon({ className }: { className?: string }) {
  const bar = 'absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none'
  return (
    <span aria-hidden className={cn('relative block size-4 shrink-0 text-muted-foreground', className)}>
      <span className={cn(bar, 'top-[3px] group-aria-expanded/toggle:top-[7px] group-aria-expanded/toggle:rotate-45')} />
      <span className={cn(bar, 'top-[7px] group-aria-expanded/toggle:opacity-0')} />
      <span className={cn(bar, 'top-[11px] group-aria-expanded/toggle:top-[7px] group-aria-expanded/toggle:-rotate-45')} />
    </span>
  )
}
