import Link from 'next/link'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type Faq = { q: string; a: string; link?: { href: string; label: string } }

/**
 * Rewritten 2026-10-02 (Carlos): the questions people actually ask, answered
 * from what the app really does. Every claim here should stay true to the
 * code -- the universe size, the data sources, what is stored.
 */
const FAQS: Faq[] = [
  {
    q: 'Is any real money involved?',
    a: "No. You practise with $100,000 of pretend money. Papaldo never asks for a bank or card, never opens a brokerage account for you, and no order you place ever reaches a real broker.",
  },
  {
    q: 'Are the prices real?',
    a: 'Yes. You trade 70 US companies and funds at their live market prices, from Alpaca. News comes from Finnhub, and the peso figures use the day’s dollar-to-peso rate. Only the money is pretend.',
  },
  {
    q: 'Can I trade Philippine stocks?',
    a: 'Not yet. The practice market is US-listed companies and funds. You can compare how the PSEi has done against the New York indexes over fifteen years on the benchmarks page.',
    link: { href: '/markets/benchmarks', label: 'Compare the PSEi' },
  },
  {
    q: 'How does the quiz decide my risk level?',
    a: 'Six questions, each with three answers from careful to adventurous. Your answers make a score from 0 to 100: up to 33 is Conservative, 34 to 66 is Moderate and 67 and above is Aggressive. The score decides which kinds of holdings Papaldo suggests first.',
  },
  {
    q: 'Can I retake the quiz?',
    a: 'Any time. Your newest result becomes your risk level. Earlier results stay in your history, but only the newest one shapes your suggestions.',
  },
  {
    q: 'Do I need an account?',
    a: 'Not to look around: the markets and the calculators are open to everyone. You need one to take the quiz and to trade, so your risk level and your practice portfolio are saved.',
  },
  {
    q: 'What do you do with my information?',
    a: 'Only what it takes to run your practice account. We don’t sell it or show you ads, and you can download everything Papaldo has on you from Tools → Export.',
    link: { href: '/privacy', label: 'Read the privacy policy' },
  },
  {
    q: 'Is this financial advice?',
    a: 'No. Papaldo is for learning and practice. Nothing in it is investment advice, and it never promises or forecasts returns. For real decisions about your money, talk to a licensed financial professional.',
  },
]

/** The honest version. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 id="faq-title" className="font-display text-3xl font-semibold tracking-[-0.02em] font-stretch-[112%] sm:text-4xl">
            Questions, answered plainly
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-muted-foreground">No guaranteed returns, no fine print.</p>
        </div>
        <Accordion className="border-y border-border">
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.q} value={`item-${index}`}>
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent>
                <p className="max-w-prose pb-2 text-pretty text-muted-foreground">{faq.a}</p>
                {faq.link && (
                  <Link href={faq.link.href} className="inline-block pb-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary">
                    {faq.link.label}
                  </Link>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
