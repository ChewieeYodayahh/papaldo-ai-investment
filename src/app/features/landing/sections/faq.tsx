"use client"

import { motion, type Variants } from "motion/react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Is any real money at risk?",
    a: "No. Every order you place on Papaldo is a simulation. The platform never opens a brokerage account on your behalf, and no order ever reaches a real broker.",
  },
  {
    q: "How is my risk score calculated?",
    a: "Your six answers are normalised to a 0–20 scale per question, averaged, and rescaled to a 0–100 score. 0–33 maps to Low, 34–66 to Medium, and 67–100 to High. The wording is adapted from Manulife's Client Suitability Assessment.",
  },
  {
    q: "Can I retake the questionnaire?",
    a: "Yes. Retaking the questionnaire stores a new history record in your account and replaces your current risk profile. Your previous answers are kept for analysis but are not used for recommendations.",
  },
  {
    q: "Is Papaldo financial advice?",
    a: "No. Papaldo is a learning and simulation platform. Nothing here is investment advice, and we don't promise or forecast returns. For real investment decisions, please consult a licensed financial professional.",
  },
  {
    q: "Do I need an account to try the simulator?",
    a: "Yes — an account lets Papaldo keep your simulated portfolio and your risk profile linked to one identity, and it lets the questionnaire save your answers.",
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

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 flex flex-col items-start gap-3"
        >
          <motion.h2 variants={item} className="text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </motion.h2>
          <motion.p variants={item} className="text-muted-foreground text-pretty">
            The honest version. No &quot;guaranteed returns&quot;, no fine-print marketing.
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={item}>
            <Accordion className="rounded-lg border border-border bg-card">
              {FAQS.map((faq, index) => (
                <AccordionItem
                  key={faq.q}
                  value={`item-${index}`}
                  className="px-4"
                >
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
