"use client"

import { motion, type Variants } from "motion/react"
import { BadgeCheck, BookOpenCheck, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const HONESTY_POINTS = [
  {
    icon: <ShieldCheck className="size-4" />,
    text: "No real money moves. No order ever reaches a broker.",
  },
  {
    icon: <BookOpenCheck className="size-4" />,
    text: "Papaldo is a learning and simulation exercise, not investment advice.",
  },
] as const

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid items-center gap-12 md:grid-cols-2"
        >
          <div className="flex flex-col items-start gap-4">
            <motion.h2 variants={item} className="text-3xl font-semibold tracking-tight text-balance">
              Why a suitability questionnaire matters.
            </motion.h2>
            <motion.p variants={item} className="max-w-lg text-muted-foreground text-pretty">
              Your risk profile is not a number for its own sake — it decides the kinds of
              simulated holdings you practice with. Papaldo&apos;s six questions are adapted from
              Manulife&apos;s Client Suitability Assessment, and they measure your comfort with loss,
              your time horizon, and your objective.
            </motion.p>
            <motion.ul variants={item} className="space-y-3">
              {HONESTY_POINTS.map((point) => (
                <li key={point.text} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-primary">{point.icon}</span>
                  <span className="text-muted-foreground">{point.text}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div variants={item}>
            <Card className="rounded-2xl border-0 bg-primary/[0.06] ring-1 ring-primary/25">
              <CardHeader>
                <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BadgeCheck className="size-5" />
                </div>
                <CardTitle>Built under a licensed eye.</CardTitle>
                <CardDescription>
                  The questionnaire and its result framework were prepared with input from David
                  Jamandre, a Licensed Financial Planner affiliated with Manulife.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Licensed Financial Planner · Manulife</Badge>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
