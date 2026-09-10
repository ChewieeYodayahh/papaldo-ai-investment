"use client"

import { motion, type Variants } from "motion/react"
import { Gauge, LineChart, Sparkles, TrendingUp } from "lucide-react"

import { LandingCard } from "@/components/LandingCard"

const FEATURES = [
  {
    icon: <Gauge className="size-5" />,
    title: "Know your risk.",
    description:
      "Six questions adapted from Manulife's Client Suitability Assessment map you to a Low, Medium, or High risk profile.",
  },
  {
    icon: <TrendingUp className="size-5" />,
    title: "Practice with simulated funds.",
    description:
      "Buy, sell and rebalance a practice portfolio. No real money moves and no order ever reaches a broker.",
  },
  {
    icon: <LineChart className="size-5" />,
    title: "Track against benchmarks. (Coming soon)",
    description:
      "Compare your simulated portfolio's performance against the PSEi and the S&P 500 over time.",
  },
  {
    icon: <Sparkles className="size-5" />,
    title: "Learn as you go. (Coming soon)",
    description:
      "AI-assisted insights to help you read your results and understand your allocation — not to pick stocks for you.",
  },
] as const

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 flex flex-col items-start gap-3"
        >
          <motion.h2 variants={item} className="text-3xl font-semibold tracking-tight text-balance">
            How Papaldo works
          </motion.h2>
          <motion.p variants={item} className="max-w-xl text-muted-foreground text-pretty">
            Three steps from curiosity to confidence.
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={item} className="h-full">
              <LandingCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
