import { PublicShell } from "@/app/features/shell/components/PublicShell"

import { Cta } from "./sections/cta"
import { Faq } from "./sections/faq"
import { Features } from "./sections/features"
import { Footer } from "./sections/footer"
import { Hero } from "./sections/hero"
import { Trust } from "./sections/trust"

/**
 * The landing page, inside the same outer frame as the app (PublicShell), so
 * "About Papaldo Ka" and the dashboard read as one product. Static: no
 * session read, so it still prerenders; a signed-in visitor who presses
 * "Log in" is bounced to the dashboard by the middleware.
 */
export function LandingPage() {
  return (
    <PublicShell>
      <main>
        <Hero />
        <Features />
        <Trust />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </PublicShell>
  )
}
