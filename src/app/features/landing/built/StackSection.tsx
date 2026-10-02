import { ArrowUpRight } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

import { logoUrl, type StackGroup, type StackItem } from './stack'

/** A logo on its own small tile: a CDN image, with the name's initials if it doesn't load. */
function StackLogo({ item }: { item: StackItem }) {
  const mono = 'icon' in item.logo && item.logo.mono
  return (
    <Avatar className="size-11 rounded-xl bg-muted p-2.5 after:rounded-xl">
      <AvatarImage
        src={logoUrl(item.logo)}
        alt=""
        referrerPolicy="no-referrer"
        className={cn('rounded-none object-contain', mono && 'dark:invert')}
      />
      <AvatarFallback className="rounded-xl text-xs font-semibold">{item.name.slice(0, 2)}</AvatarFallback>
    </Avatar>
  )
}

/** One group of the stack: a heading, then a tile per tool, each linking to its own site. */
export function StackSection({ group }: { group: StackGroup }) {
  return (
    <section aria-labelledby={`stack-${group.id}`} className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id={`stack-${group.id}`} className="scroll-mt-24 font-display text-2xl font-semibold tracking-[-0.015em] font-stretch-[110%] sm:text-3xl">
            {group.title}
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">{group.blurb}</p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {group.items.map((item) => (
            <li key={item.name} className={cn(item.name === 'Claude Code' && 'sm:col-span-2')}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/25 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <StackLogo item={item} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {item.name}
                    <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                  </span>
                  <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">{item.role}</span>
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
