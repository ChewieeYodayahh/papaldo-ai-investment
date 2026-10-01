/**
 * Who stands behind the quiz (restyled 2026-10-02): the questionnaire's
 * source and the licensed planner who reviewed it. Plain statements, no
 * badge wall.
 */
export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <h2 id="trust-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[112%] sm:text-4xl">
          Built with a licensed financial planner
        </h2>
        <div className="grid max-w-xl gap-4 text-pretty text-muted-foreground">
          <p>
            Your risk level decides the kinds of holdings Papaldo suggests, so the quiz has to be right. Its six questions
            are adapted from Manulife&apos;s Client Suitability Assessment and measure your comfort with loss, your time
            horizon and what the money is for.
          </p>
          <p>
            The questionnaire and its results were prepared with input from David Jamandre, a Licensed Financial Planner
            affiliated with Manulife.
          </p>
          <p className="text-sm">
            Papaldo is a learning and practice tool. Nothing in it is investment advice, and it never promises or
            forecasts returns.
          </p>
        </div>
      </div>
    </section>
  )
}
