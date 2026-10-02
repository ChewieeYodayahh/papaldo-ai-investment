import { FaFacebook, FaGithub, FaGlobe, FaLinkedin } from 'react-icons/fa6'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Portfolio', href: 'https://sensei-david.vercel.app/', Icon: FaGlobe },
  { label: 'GitHub', href: 'https://github.com/ChewieeYodayahh', Icon: FaGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/carlos-david-jamandre-57ab2a278/', Icon: FaLinkedin },
  { label: 'Facebook', href: 'https://www.facebook.com/carlos.jamandre.9/', Icon: FaFacebook },
]

/**
 * Who built Papaldo (2026-10-02): David's profile as one card, with his
 * portfolio site and the links he publishes there. The photo is his GitHub avatar,
 * so it changes when he changes it there.
 */
export function DeveloperCard({ className }: { className?: string }) {
  return (
    <article aria-labelledby="developer-name" className={cn('rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8', className)}>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 sm:size-20">
          <AvatarImage src="https://github.com/ChewieeYodayahh.png" alt="" />
          <AvatarFallback className="text-lg font-semibold">DJ</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">The developer</p>
          <h2 id="developer-name" className="mt-1 font-display text-2xl font-semibold tracking-[-0.015em] font-stretch-[110%] sm:text-[1.75rem]">
            David Jamandre
          </h2>
          <p className="text-sm text-muted-foreground">Licensed Financial Planner · Builder of Papaldo</p>
        </div>
      </div>

      <p className="mt-6 text-pretty text-muted-foreground">
        A financial planner who builds software. David started Papaldo so Filipinos could practise investing before they
        put in a peso. He planned every feature, chose the data sources, helped shape the risk quiz and tested each screen, building it with Claude Code as his pair programmer.
      </p>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="David's profiles">
        {LINKS.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 gap-2 rounded-full px-4')}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}
