import { Globe, Mail } from "lucide-react"

import { Separator } from "@/components/ui/separator"

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "How it works" },
      { href: "#faq", label: "FAQ" },
      { href: "/isq", label: "Take the questionnaire" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#trust", label: "About" },
      { href: "#trust", label: "Careers" },
      { href: "#trust", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Cookie policy" },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 Papaldo. Simulation only — not investment advice. No real money moves.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@papaldo.ph" className="text-muted-foreground hover:text-foreground" aria-label="Email">
              <Mail className="size-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Website">
              <Globe className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
