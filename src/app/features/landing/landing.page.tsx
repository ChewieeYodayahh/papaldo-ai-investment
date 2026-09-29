import { getShellUser } from "@/app/features/shell/api/shell"
import { PublicShell } from "@/app/features/shell/components/PublicShell"

import { Cta } from "./sections/cta"
import { Faq } from "./sections/faq"
import { Features } from "./sections/features"
import { Footer } from "./sections/footer"
import { Hero } from "./sections/hero"
import { Trust } from "./sections/trust"

/**
 * The landing page, inside the same outer frame as the app (PublicShell), so
 * "About Papaldo Ka" and the dashboard read as one product. It reads the
 * session so a signed-in visitor sees their account pill instead of "Log in"
 * (Carlos, 2026-09-29). getClaims verifies the token locally, so the read
 * costs no network round trip.
 */
export async function LandingPage() {
  const user = await getShellUser()
  return (
    <PublicShell user={user}>
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
