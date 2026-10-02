import { Suspense } from 'react'

import { getShellUser } from '@/app/features/userData/frame/api/shell'
import { PublicShell } from '@/app/features/userData/frame/components/PublicShell'

import { archivo } from './fonts'
import { Cta } from './sections/cta'
import { Faq } from './sections/faq'
import { Footer } from './sections/footer'
import { Hero } from './sections/hero'
import { HowItWorks } from './sections/how-it-works'
import { MarketsSection } from './sections/markets'
import { PhoneSection } from './sections/phone'
import { PracticeFloor } from './sections/practice-floor'
import { Ticker, TickerFallback } from './sections/ticker'
import { Trust } from './sections/trust'

/**
 * The landing page, inside the same outer frame as the app (PublicShell), so
 * "About Papaldo Ka" and the dashboard read as one product. It reads the
 * session so a signed-in visitor sees their account pill instead of "Log in"
 * (Carlos, 2026-09-29). getClaims verifies the token locally, so the read
 * costs no network round trip.
 *
 * Redesigned 2026-10-02 ("High Street Blue Hour", LANDING_PALDO_PLAN.md):
 * the frame takes the scene's colours (`landing`) and the street ticker
 * streams in behind its own Suspense so the hero never waits on a price.
 * Made static the same day (Carlos): stills of the real app, a MacBook first
 * and the phone layout in its own section, never the two combined.
 */
export async function LandingPage() {
  const user = await getShellUser()
  return (
    <PublicShell user={user} landing>
      <main className={archivo.variable}>
        <Hero />
        <Suspense fallback={<TickerFallback />}>
          <Ticker />
        </Suspense>
        <HowItWorks />
        <PhoneSection />
        <MarketsSection />
        <PracticeFloor />
        <Trust />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </PublicShell>
  )
}
