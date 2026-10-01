import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Is any real money at risk?',
    a: 'No. Every order you place on Papaldo is a simulation. The platform never opens a brokerage account on your behalf, and no order ever reaches a real broker.',
  },
  {
    q: 'Where do the prices come from?',
    a: 'From the real US market, through Alpaca: the prices you trade at are the live quotes for those companies and funds. Only the money is pretend.',
  },
  {
    q: 'How is my risk score calculated?',
    a: "Your six answers are normalised to a 0–20 scale per question, averaged, and rescaled to a 0–100 score. 0–33 maps to Low, 34–66 to Medium, and 67–100 to High. The wording is adapted from Manulife's Client Suitability Assessment.",
  },
  {
    q: 'Can I retake the questionnaire?',
    a: 'Yes. Retaking it stores a new record in your account and replaces your current risk profile. Your earlier answers are kept, but they are not used for suggestions.',
  },
  {
    q: 'Is Papaldo financial advice?',
    a: "No. Papaldo is a learning and simulation platform. Nothing here is investment advice, and we don't promise or forecast returns. For real investment decisions, please consult a licensed financial professional.",
  },
  {
    q: 'Do I need an account?',
    a: 'Not to look around: the markets and the calculators are open without one. You need one to take the quiz and to trade, so your risk profile and your practice portfolio are saved.',
  },
] as const

/** The honest version (restyled 2026-10-02). */
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
