import { Header } from "./sections/header"
import { Hero } from "./sections/hero"
import { Features } from "./sections/features"
import { Trust } from "./sections/trust"
import { Faq } from "./sections/faq"
import { Cta } from "./sections/cta"
import { Footer } from "./sections/footer"

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Trust />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
