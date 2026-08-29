"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"

import { Button } from "@/components/ui/button"

import { MockDashboard } from "./mock-dashboard"

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

export function Hero() {
  return (
    <section className="hero-mesh">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-5"
        >
          <motion.span
            variants={item}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            Safe investing simulation for every Filipino
          </motion.span>

          <motion.h1
            variants={item}
            className="text-4xl font-semibold tracking-tight text-balance md:text-5xl"
          >
            Test your investing instincts before you risk a peso.
          </motion.h1>

          <motion.p variants={item} className="max-w-lg text-base text-muted-foreground text-pretty">
            Answer a six-question suitability questionnaire, get your risk profile, and practice
            trading with simulated funds — no real money, no broker, no pressure.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up">
              <Button size="lg">Get started — it&apos;s free</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="ghost">
                See how it works
              </Button>
            </a>
          </motion.div>

          <motion.p variants={item} className="text-xs text-muted-foreground">
            No real money moves. Papaldo is an investment simulator, not financial advice.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="justify-self-center md:justify-self-end"
        >
          <MockDashboard />
        </motion.div>
      </div>
    </section>
  )
}
