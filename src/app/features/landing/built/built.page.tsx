import { getShellUser } from '@/app/features/userData/frame/api/shell'
import { PublicShell } from '@/app/features/userData/frame/components/PublicShell'

import { archivo } from '../fonts'
import { Footer } from '../sections/footer'
import { DeveloperCard } from './DeveloperCard'
import { StackSection } from './StackSection'
import { STACK } from './stack'

/**
 * How it's built (Carlos, 2026-10-02), under About Papaldo: who built
 * Papaldo and everything it's built with, each with its logo and what it
 * does here. In the landing page's frame and type, opening 50 | 50 with the
 * words beside the developer's card.
 */
export async function BuiltPage() {
  const user = await getShellUser()
  const count = STACK.reduce((total, group) => total + group.items.length, 0)

  return (
    <PublicShell user={user} landing>
      <main className={archivo.variable}>
        <section className="bg-linear-to-b from-sky-top to-sky-horizon">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-sm font-semibold tracking-wider text-foreground/70 uppercase">About Papaldo</p>
              <h1 className="mt-3 max-w-[16ch] font-display text-[2.35rem] leading-[1.04] font-semibold tracking-[-0.025em] text-balance font-stretch-[116%] sm:text-[3.1rem] xl:text-[3.5rem]">
                How it&apos;s built
              </h1>
              <p className="mt-5 max-w-[34rem] text-base text-pretty text-foreground/80 sm:text-lg">
                One developer, one AI pair programmer and {count} tools, services and libraries. Here is every one of them,
                and what it does in Papaldo.
              </p>
              <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
                {STACK.map((group) => (
                  <a
                    key={group.id}
                    href={`#stack-${group.id}`}
                    className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-card hover:text-foreground"
                  >
                    {group.title}
                  </a>
                ))}
              </nav>
            </div>
            <DeveloperCard />
          </div>
        </section>

        {STACK.map((group) => (
          <StackSection key={group.id} group={group} />
        ))}
      </main>
      <Footer />
    </PublicShell>
  )
}
