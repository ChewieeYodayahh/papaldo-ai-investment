import { TrendingUp } from "lucide-react"

import { Money } from "@/app/features/userData/preferences/components/Money"
import { Card, CardContent } from "@/components/ui/card"

/**
 * A still of the Home dashboard, in the same card style as the real one
 * (rounded-2xl, borderless, palette tokens) so the landing page previews the
 * app it leads into rather than a different product. Illustrative numbers --
 * the $100,000 is what every new account really starts with (since
 * 2026-09-30), shown in pesos at the live rate when the visitor picks ₱.
 *
 * No longer on the landing page (2026-10-02: it shows the real app in device
 * clips now); kept for the promo video's opening scene
 * (marketing/video/src/scenes/Hook.tsx), which imports it.
 */
const HOLDINGS = [
  { symbol: "VOO", pct: 45 },
  { symbol: "AAPL", pct: 30 },
  { symbol: "NVDA", pct: 25 },
]

export function MockDashboard() {
  return (
    <div className="grid w-full max-w-md gap-3" aria-hidden="true">
      <Card className="rounded-2xl border-0 py-4 shadow-xl">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Holdings</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground">$ / ₱</span>
          </div>
          <div className="flex items-baseline gap-2">
            <Money usd={100_000} className="figure text-3xl font-semibold" />
            <span className="flex items-center gap-1 text-xs font-medium text-gain">
              <TrendingUp className="size-3.5" /> +1.2% today
            </span>
          </div>
          <svg viewBox="0 0 240 48" className="h-12 w-full text-gain" fill="none">
            <path
              d="M0 40 L20 36 L40 38 L60 30 L80 32 L100 24 L120 27 L140 18 L160 20 L180 12 L200 14 L220 7 L240 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[1fr_1.2fr] gap-3">
        <Card className="rounded-2xl border-0 py-4 shadow-xl">
          <CardContent className="space-y-1.5 px-4">
            <span className="text-sm font-medium">Risk Appetite</span>
            <p className="text-sm">
              You are <span className="font-semibold text-highlight">a Moderate</span>
            </p>
            <span className="block rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
              Retake the quiz
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 py-4 shadow-xl">
          <CardContent className="space-y-2 px-4">
            <span className="text-sm font-medium">My Portfolio</span>
            {HOLDINGS.map((holding) => (
              <div key={holding.symbol} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{holding.symbol}</span>
                  <span className="figure text-muted-foreground">{holding.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${holding.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
