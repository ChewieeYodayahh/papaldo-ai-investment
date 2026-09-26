"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { ArrowRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { useCopy } from "@/app/features/preferences/copy"
import { cn } from "@/lib/utils"

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
  const t = useCopy()

  return (
    <section className="hero-mesh">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-5"
        >
          <motion.span
            variants={item}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/20"
          >
            {t("land.badge")}
          </motion.span>

          <motion.h1
            variants={item}
            className="text-4xl font-semibold tracking-tight text-balance md:text-5xl"
          >
            {t("land.title")}
          </motion.h1>

          <motion.p variants={item} className="max-w-lg text-base text-muted-foreground text-pretty">
            {t("land.body")}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-6 text-[0.9375rem] font-semibold")}>
              {t("land.cta")}
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link href="/#features" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "h-11 rounded-full px-5")}>
              {t("land.secondary")}
            </Link>
          </motion.div>

          <motion.p variants={item} className="text-xs text-muted-foreground">
            No real money moves. Papaldo is an investment simulator, not financial advice.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="w-full justify-self-center md:justify-self-end"
        >
          <MockDashboard />
        </motion.div>
      </div>
    </section>
  )
}
