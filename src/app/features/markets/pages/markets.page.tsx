import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/**
 * Illustrative figures only -- these are static literals, not market data.
 * The Alpha Vantage REST ingestion job and the Supabase cache it writes to do
 * not exist yet (Phase 3, blocked on the ticker universe and an AV key). This
 * page shows the intended layout against sample numbers; nothing here is
 * fetched, and no value below reflects a real price.
 */
const SAMPLE_DATA = [
  { symbol: "DJI", name: "Dow Jones Industrial Average", price: 42120.5, change: 312.8, changePct: 0.75, volume: "2.4B", exchange: "NYSE" },
  { symbol: "SPX", name: "S&P 500", price: 5925.3, change: 18.4, changePct: 0.31, volume: "3.1B", exchange: "NYSE" },
  { symbol: "IXIC", name: "NASDAQ Composite", price: 18214.6, change: 45.2, changePct: 0.25, volume: "4.8B", exchange: "NASDAQ" },
]

export function MarketsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="mb-8 flex items-center gap-3">
          <TrendingUp className="size-6 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Markets</h1>
          <Badge variant="outline" className="text-xs">DJIA · SPX · NASDAQ · Sample data</Badge>
        </header>

        <p className="mb-8 text-sm text-muted-foreground max-w-2xl">
          The figures below are illustrative sample data, not live prices — the Alpha Vantage
          ingestion pipeline is not built yet. This is a simulated market view for learning, and
          no orders reach a broker. See <a href="/isq" className="underline">ISQ</a> to understand your risk profile.
        </p>

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Symbol</th>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-right font-medium">Change</th>
                  <th className="px-5 py-3 text-right font-medium">Volume</th>
                  <th className="px-5 py-3 text-right font-medium">Exchange</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SAMPLE_DATA.map((d) => {
                  const up = d.change >= 0
                  return (
                    <tr key={d.symbol} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 font-semibold tabular-nums">{d.symbol}</td>
                      <td className="px-5 py-3">{d.name}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">${d.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className={`px-5 py-3 text-right font-medium tabular-nums ${up ? 'text-primary' : 'text-destructive'}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {up ? '+' : ''}{d.change.toFixed(2)} ({d.changePct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{d.volume}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{d.exchange}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Disclaimer:</strong> Ranked by market capitalisation, not a recommendation.
            Simulated trading only. All prices for educational comparison — no real orders reach a broker.
            Source: none — these are hardcoded sample figures. When the Alpha Vantage REST ingestion job is
            built, this page will read cached Supabase rows and never call AV from the browser.
          </div>
        </Card>

        <div className="mt-8 text-xs text-muted-foreground">
          <strong>Free tier note:</strong> 3 tickers shown (DJIA/SPX/NASDAQ). No Alpha Vantage calls are made today;
          once ingestion exists this would cost 3 calls/day against the free 25/day cap.
          Full universe (~60 symbols + ETFs) requires premium tier + ingestion pipeline (Phase 3, blocked on ticker list + AV key).
        </div>
      </div>
    </main>
  )
}
