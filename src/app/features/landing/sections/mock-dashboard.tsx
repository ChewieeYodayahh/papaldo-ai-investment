import { Card, CardContent } from "@/components/ui/card"

import { TrendingUp } from "lucide-react"

const ALLOCATION = [
  { label: "Peso Secure Fund", pct: 25, color: "var(--chart-1)" },
  { label: "Peso Global Multi-Asset Income Fund", pct: 75, color: "var(--primary)" },
]

export function MockDashboard() {
  return (
    <Card className="max-w-md">
      <CardContent className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Simulated balance</span>
          <TrendingUp className="size-4 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">₱0.00</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            +0.00 this month
          </span>
        </div>

        {/* Allocation bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Allocation</span>
            <span className="text-muted-foreground">Medium Risk</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {ALLOCATION.map((segment) => (
              <div
                key={segment.label}
                className="transition-all duration-500"
                style={{ width: `${segment.pct}%`, backgroundColor: segment.color }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {ALLOCATION.map((segment) => (
              <span key={segment.label}>{segment.pct}% {segment.label}</span>
            ))}
          </div>
        </div>

        {/* Mini SVG line chart */}
        <div className="rounded-lg bg-muted/50 p-2">
          <span className="text-xs text-muted-foreground">PSEi benchmark</span>
          <svg
            viewBox="0 0 120 36"
            className="mt-1 h-9 w-full text-primary"
            fill="none"
            aria-hidden="true"
          >
            <polyline
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,30 10,26 20,28 35,20 50,22 65,14 80,16 95,10 110,12 120,8"
            />
            <polyline
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
              points="0,36 10,36 20,36 35,36 50,36 65,36 80,36 95,36 110,36 120,36"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
