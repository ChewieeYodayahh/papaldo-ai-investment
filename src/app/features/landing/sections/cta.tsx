"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-5"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Ready to understand your investing style?
          </h2>
          <p className="max-w-lg text-pretty text-primary-foreground/90">
            Start with the questionnaire. Six questions, a clear risk profile, and a simulated
            portfolio to practice with — before you ever consider putting real money to work.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-foreground hover:bg-muted cta-glow"
            >
              Get started — it&apos;s free
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
