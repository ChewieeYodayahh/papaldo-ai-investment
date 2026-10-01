import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { T } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { Skyline } from '../components/Skyline'

/**
 * The closing invitation (2026-10-02): the hero's promise once more, with
 * the same CTA, over the skyline -- by now every window is lit.
 */
export function Cta() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden border-t border-border bg-linear-to-b from-street to-sky-top">
      <Skyline className="absolute inset-x-0 bottom-0 -z-10 h-[62%] w-full opacity-70" />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-40 text-center md:px-6 md:pt-28 md:pb-52">
        <h2 id="cta-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[114%] sm:text-[2.75rem] sm:leading-[1.08]">
          <T k="land.ctaTitle" />
        </h2>
        <p className="mt-4 max-w-md text-pretty text-foreground/80">
          Take the six-question quiz, then make your first trade with practice money. It&apos;s free.
        </p>
        <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'mt-8 h-12 rounded-full px-7 text-base font-semibold')}>
          <T k="land.cta" />
        </Link>
      </div>
    </section>
  )
}
