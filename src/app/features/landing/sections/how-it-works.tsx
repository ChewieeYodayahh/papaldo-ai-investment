import { cn } from '@/lib/utils'

import { MacBook, type LaptopShot } from '../components/devices'

const STEPS: Array<{ shot: LaptopShot; title: string; body: string; alt: string }> = [
  {
    shot: 'quiz',
    title: 'Find your risk level',
    body: 'Six questions about your goals, your timeline and how you would feel if a price fell. You get a risk level, and the funds and companies that suit it.',
    alt: 'A quiz result in the Papaldo app: the score meter at Moderate Investor, with the suggested funds and stocks.',
  },
  {
    shot: 'trade',
    title: 'Practice with $100,000',
    body: 'Buy and sell real companies and funds at their real prices. Before any order goes through you see what it costs and what you will have left. None of it is real money.',
    alt: 'A practice order in the Papaldo app: the confirmation for ten shares of an S&P 500 fund, with the estimated cost and the cash left after.',
  },
  {
    shot: 'learn',
    title: 'Learn as you go',
    body: 'Tools that each answer one money question, like how much more you need to save if you start later, and a guided tour on every page. Each ends with the lesson, in plain words.',
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
          How it works
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          Three steps, at your own pace. Every screen here is the real app, with a sample account.
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
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-pretty text-muted-foreground">{step.body}</p>
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
