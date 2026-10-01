'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { DevicePair, type ClipScene } from '../components/devices'

const STEPS: Array<{ scene: ClipScene; title: string; body: string; label: string }> = [
  {
    scene: 'quiz',
    title: 'Find your risk level',
    body: 'Six questions about your goals, your timeline and how you would feel if a price fell. You get a risk level, and the funds and companies that suit it.',
    label: 'A quiz result in the Papaldo app: the score meter fills to a Moderate Investor, with the answers and the suggested funds and stocks.',
  },
  {
    scene: 'trade',
    title: 'Practice with $100,000',
    body: 'Buy and sell real companies and funds at their real prices. Before any order goes through you see what it costs and what you will have left. None of it is real money.',
    label: 'A practice order in the Papaldo app: ten shares of an S&P 500 fund, then the confirmation with the estimated cost and cash after.',
  },
  {
    scene: 'learn',
    title: 'Learn as you go',
    body: 'Tools that each answer one money question, like how much more you need to save if you start later, and a guided tour on every page. Each ends with the lesson, in plain words.',
    label: 'Tutorial Mode in the Papaldo app, walking through the Cost of Waiting tool and its lesson.',
  },
]

/**
 * How it works (2026-10-02): three steps, a true sequence, so they are
 * numbered. On a wide screen one pair of screens stays in place while the
 * steps scroll past, and changes to show the step in view -- the page's only
 * scroll-driven motion, and the visitor's own scrolling drives it. Narrower
 * screens show each step's screens right under it.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0)
  const steps = useRef<Array<HTMLLIElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const step of steps.current) if (step) observer.observe(step)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 md:px-6 md:pt-28">
        <h2 id="how-title" className="font-display text-3xl font-semibold tracking-[-0.02em] font-stretch-[112%] sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          Three steps, at your own pace. Everything you see here is the real app, with a sample account.
        </p>

        <div className="mt-12 grid gap-16 lg:mt-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <ol className="grid gap-16 lg:gap-0">
            {STEPS.map((step, i) => (
              <li
                key={step.scene}
                ref={(element) => {
                  steps.current[i] = element
                }}
                data-step={i}
                className="lg:flex lg:min-h-[78vh] lg:items-center"
              >
                <div>
                  <span aria-hidden className="block font-display text-6xl leading-none font-semibold text-foreground/20 font-stretch-[118%]">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.015em] font-stretch-[110%] sm:text-[1.75rem]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-pretty text-muted-foreground">{step.body}</p>
                  <DevicePair scene={step.scene} label={step.label} className="mt-8 lg:hidden" />
                </div>
              </li>
            ))}
          </ol>

          <div className="hidden lg:block">
            <div className="sticky top-[max(5.5rem,calc(50svh-17rem))] grid">
              {STEPS.map((step, i) => (
                <div
                  key={step.scene}
                  aria-hidden={active !== i || undefined}
                  className={cn(
                    '[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none',
                    active === i ? 'opacity-100' : 'pointer-events-none opacity-0',
                  )}
                >
                  <DevicePair scene={step.scene} label={step.label} active={active === i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
