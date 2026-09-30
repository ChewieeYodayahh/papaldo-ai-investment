"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { buttonVariants } from "@/components/ui/button"
import { useCopy } from "@/app/features/userData/preferences/copy"
import { cn } from "@/lib/utils"

export function Cta() {
  const t = useCopy()

  return (
    <section className="px-4 pb-20 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground"
      >
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">{t("land.ctaTitle")}</h2>
        <p className="max-w-lg text-pretty opacity-90">
          Start with the questionnaire. Six questions, a clear risk profile, and a simulated portfolio to practice
          with — before you ever consider putting real money to work.
        </p>
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants({ size: "lg", variant: "secondary" }),
            "cta-glow h-11 rounded-full bg-background px-6 text-[0.9375rem] font-semibold text-foreground hover:bg-muted",
          )}
        >
          {t("land.cta")}
        </Link>
      </motion.div>
    </section>
  )
}
