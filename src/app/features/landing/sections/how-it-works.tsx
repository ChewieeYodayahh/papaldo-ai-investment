import { T, type CopyKey } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { MacBook, type LaptopShot } from '../components/devices'

const STEPS: Array<{ shot: LaptopShot; title: CopyKey; body: CopyKey; alt: string }> = [
  {
    shot: 'quiz',
    title: 'land.step.quiz.title',
    body: 'land.step.quiz.body',
    alt: 'A quiz result in the Papaldo app: the score meter at Moderate Investor, with the suggested funds and stocks.',
  },
  {
    shot: 'trade',
    title: 'land.step.trade.title',
    body: 'land.step.trade.body',
    alt: 'A practice order in the Papaldo app: the confirmation for ten shares of an S&P 500 fund, with the estimated cost and the cash left after.',
  },
  {
    shot: 'learn',
    title: 'land.step.learn.title',
    body: 'land.step.learn.body',
    alt: 'Tutorial Mode in the Papaldo app, walking through the Cost of Waiting tool and its lesson.',
  },
]

/**
 * How it works (2026-10-02, static): three steps, a true sequence, so they
 * are numbered. Each is a row, the words on one side and that step's screen
 * on a MacBook on the other, half and half (Carlos's 50 | 50 rule),
 * alternating sides on a wide screen.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <h2 id="how-title" className="font-display text-3xl font-semibold tracking-[-0.02em] font-stretch-[112%] sm:text-4xl">
          <T k="land.how.title" />
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          <T k="land.how.sub" />
        </p>

        <ol className="mt-14 grid gap-20 md:mt-20 lg:gap-28">
          {STEPS.map((step, i) => (
            <li
              key={step.shot}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <div className={cn(i % 2 === 1 && 'lg:order-last')}>
                <span aria-hidden className="block font-display text-6xl leading-none font-semibold text-foreground/20 font-stretch-[118%]">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.015em] font-stretch-[110%] sm:text-[1.75rem]">
                  <T k={step.title} />
                </h3>
                <p className="mt-3 max-w-md text-pretty text-muted-foreground"><T k={step.body} /></p>
              </div>
              <MacBook
                shot={step.shot}
                alt={step.alt}
                sizes="(min-width: 1024px) 50vw, 92vw"
                className="mx-auto w-full max-w-2xl lg:max-w-none"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
