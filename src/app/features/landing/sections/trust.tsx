import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { T } from '@/app/features/userData/preferences/copy'

/**
 * Why trust Papaldo (2026-10-02): where it comes from, shown openly. It used
 * to name an insurer's suitability assessment as the quiz's source, which
 * could read as an outside, proprietary questionnaire (Carlos: not one to
 * cite); now it points to How it's built, which lists who built Papaldo and
 * every data source and tool behind it. Keeps `#trust` for the "Why
 * Papaldo" menu link.
 */
export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <h2 id="trust-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[112%] sm:text-4xl">
          <T k="land.trust.title" />
        </h2>
        <div className="grid max-w-xl gap-4 text-pretty text-muted-foreground">
          <p>
            <T k="land.trust.body" />
          </p>
          <div>
            <Link
              href="/how-its-built"
              className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-11 rounded-full px-6 font-semibold')}
            >
              <T k="land.trust.cta" />
            </Link>
          </div>
          <p className="text-sm">
            Papaldo is a learning and practice tool. Nothing in it is investment advice, and it never promises or
            forecasts returns.
          </p>
        </div>
      </div>
    </section>
  )
}
