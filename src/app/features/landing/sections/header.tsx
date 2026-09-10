"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "#features", label: "How it works" },
  { href: "#trust", label: "Why Papaldo" },
  { href: "/markets", label: "Markets" },
  { href: "#faq", label: "FAQ" },
] as const

export function Header() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); }, [])
  const cycles = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "system", icon: Monitor, label: "System" },
  ] as const

  const current = cycles.find((c) => c.key === (theme ?? "system")) ?? cycles[2]
  const next = cycles[(cycles.findIndex((c) => c.key === current.key) + 1) % 3]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          Papaldo
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted ? (
            <button
              onClick={() => setTheme(next.key)}
              aria-label={`Theme: ${current.label}`}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <current.icon className="size-3.5" />
            </button>
          ) : (
            <span className="inline-flex size-8" />
          )}
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Sign up</Button>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={(props) => (
                <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu" {...props}>
                  <Menu />
                </Button>
              )}
            />
            <SheetContent side="right">
              <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/sign-up" onClick={() => setOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
